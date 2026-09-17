# `@tremolo-ui/functions` の棚卸し

対象: `8cc8371` 時点の `packages/functions/src/index.ts`（63 export）

## 目的

**`functions` は、このライブラリ群で使っている汎用な関数を、利用者が使いやすい形で公開するためのパッケージ。** 汎用な関数だけを置く。

この基準で全 export を見直したところ、**入力イベントの解釈**と**描画された鍵盤の幾何**という、汎用ではない 2 つの塊が入っていた。どちらも「ライブラリの実装に必要だから純粋関数として書いた」ものが、純粋であることを理由に `functions` に置かれた結果と見られる。

判定基準は「純粋かどうか」ではなく **「このライブラリを使わない人が使うか」**。

## 残すもの

| モジュール | export | 根拠 |
| --- | --- | --- |
| `math.ts` | `clamp` `mapValue` `normalizeValue` `rawValue` `stepValue` `toPrecision` `toFixed` `radian` `degree` `dbToGain` `gainToDb` | 値の正規化とオーディオ単位の変換。ライブラリ非依存で成立する |
| `scales.ts`（`applyDelta` を除く） | `Scale` `ValueRange` `linearScale` `exponentialScale` `curveScale` `skewScale` `symmetricSkewScale` `curveWithCenterValue` `skewWithCenterValue` | 値の分布の定義。JUCE の `NormalisableRange` 互換の `skew` を含み、自分の UI に使える |
| `midi.ts` | 15 export すべて | 音楽理論と MIDI のユーティリティ。**ドキュメントの例で最も使われている**（`noteNumber` 7 / `noteName` 3） |
| `unit.ts` | `unitFormat` `SIPrefix` `UnitFormatOptions` `UnitFormatter` | 表示用フォーマット。例で 4 回使用 |

## `dom` へ移すもの

### 1. 入力イベントの解釈（`modifiers.ts` 一式 + `applyDelta`）

`Modifier` `ModifierState` `ModifierMap` `ModifierValue` `InputEventOption` `SelectedInputEvent` `selectModifier` `mapModifier` `selectInputEvent` `applyDelta`

`ModifierState` は DOM イベントの修飾キーフラグそのものの形をしており、`applyDelta` は「1 ノッチ / 1 キー押下で値がどれだけ動くか」を決める。**`createDragValue` がドラッグについてやっている仕事と同じもの**が、ホイールとキーボードについてだけ `functions` にある。

現状の分かれ方:

| 入力 | 実装場所 |
| --- | --- |
| ドラッグ | `dom` の `createDragValue` |
| ホイール・キーボード | `functions` の `applyDelta` + `react` の各コンポーネントの `onKeyDown` |

**`applyDelta` だけを残して型を移すことはできない**（`functions → dom` の依存が生まれて循環する）。まとめて移す。`dom` 側から `applyDelta` への参照は現在コメント 1 箇所だけで、実コードの依存は無い。

移した後は、Vue / Svelte のラッパーがキーボード操作を実装するときに `react` の各コンポーネントを読み直さずに済む。CLAUDE.md の「新しいインタラクションもまずコアに書く」に沿う形になる。

### 2. 鍵盤の幾何（`piano.ts` 一式）

`NoteRange` `PianoLayout` `blackKeyWidth` `pianoWidth` `notePosition` `noteAt` `getNoteRangeArray`

**描画された鍵盤のピクセル幾何と当たり判定**であって、汎用の音楽ユーティリティではない（音楽理論は `midi.ts` にある）。`noteAt` は `dom` の `createPianoInput` が、`notePosition` / `blackKeyWidth` / `pianoWidth` は `react` の Piano が描画に使っている。

**ドキュメントの例では 1 つも使われていない。** 検索でヒットするのは changelog と移行ガイドだけ。

`dom` へ移せば、Vue / Svelte の Piano も同じ幾何を共有できる。

## 公開をやめるもの

| export | 状況 | 行き先 |
| --- | --- | --- |
| `isEmpty` | 使用箇所ゼロで、公開 API に紛れ込んだだけだった | **削除済み** |
| `mod` | `midi.ts` が唯一の実コードの利用者。棚卸しの時点では「使用箇所ゼロ」と書いたが、その後 WavetableSynth の story が使い始めていた | **`midi.ts` の中の非公開関数へ。** `util.ts` は空になったので削除。story は自前で 3 行持つ |
| `SIGNIFICANT_DIGITS` | `toPrecision` の既定値。外に出す必要がない | `math.ts` の中の定数へ |
| `xor` | Slider の内部 4 箇所のみ | **削除。** いったん `react` の `components/_util/xor.ts` へ移したが、4 箇所とも `vertical !== reverse` に置き換えた。どちらも既定値を持つ `boolean` なので、`undefined` を `false` に読み替える関数は要らなかった |
| `decimalPart` / `integerPart` | Slider の目盛りと story のみ。`string \| undefined` を返す扱いにくい形で、指数表記で壊れる（`stepValue` の丸めバグの原因になったのと同じ問題） | **削除。** Slider は `react` の `components/_util/decimal-digits.ts` に置き換えた。`number` を返し、`1e-7` のような指数表記も数えるので、目盛りが整数に丸められるバグも直る |
| `selectInputEvent` | `applyDelta` の内部と、`NumberInput` が `raw` かどうかを見るためだけに使っている | **手順 3 で削除。** 中身は `selectModifier` の返り値の `value` を `option` に言い換えただけだった |

`selectInputEvent` を手順 1 で外せなかったのは、`react` の `NumberInput` が呼んでいたため。手順 3 で読み直したところ **`selectModifier` と同じものを返り値のキー名だけ変えて返す関数**だったので、非公開にするのではなく削除し、`applyDelta` と `NumberInput` の両方が `selectModifier` を直接呼ぶようにした。

## 結果

`functions` は **値の分布（scales）・数値変換（math）・音楽理論（midi）・表示（unit）** の 4 本になる。どれも「このライブラリを使わなくても役に立つ」もの。

`dom` は「入力の解釈」と「描画対象の幾何」を持つ層になり、`createDrag` / `createWheel` / `createPianoInput` と、それらが必要とする値の計算が同じ場所に揃う。

## 手順

依存の向きを一度に変えると壊れたときの切り分けが難しいので、3 つに分ける。

1. **公開をやめる** — `functions` 内で完結。影響は `react` の import のみ（完了）
2. **`piano.ts` を `dom` へ** — `react` の Piano の import 変更（完了。`dom` の `src/piano/layout.ts` に置き、`createPianoInput` と同じディレクトリに揃えた）
3. **modifier 一式 + `applyDelta` を `dom` へ** — `react` の 12 ファイルの import 変更（完了。`dom` の `src/input/` に `modifiers.ts` と `apply-delta.ts` を置いた）
   - `ModifierValue<T extends number | InputEventOption>` の制約は既に入っていた（`ModifierSetting` という名前で書かれている）ので、この手順ですることは無かった
   - `selectInputEvent` は非公開化ではなく削除した（上記）
