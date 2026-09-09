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

### 1. 入力イベントの解釈（`types.ts` 一式 + `applyDelta`）

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

| export | 状況 |
| --- | --- |
| `isEmpty` | **削除済み。** 使用箇所ゼロで、公開 API に紛れ込んだだけだった |
| `mod` | **使用箇所ゼロ** |
| `SIGNIFICANT_DIGITS` | `toPrecision` の既定値。外に出す必要がない |
| `selectInputEvent` | `applyDelta` の内部からのみ |
| `xor` | Slider の内部 4 箇所のみ。3 行の内部ヘルパー |
| `decimalPart` / `integerPart` | Slider の目盛りと story のみ。`string \| undefined` を返す扱いにくい形で、指数表記で壊れる（`stepValue` の丸めバグの原因になったのと同じ問題） |

`functions` 内の内部モジュールへ落とすか、削除する。

## 結果

`functions` は **値の分布（scales）・数値変換（math）・音楽理論（midi）・表示（unit）** の 4 本になる。どれも「このライブラリを使わなくても役に立つ」もの。

`dom` は「入力の解釈」と「描画対象の幾何」を持つ層になり、`createDrag` / `createWheel` / `createPianoInput` と、それらが必要とする値の計算が同じ場所に揃う。

## 手順

依存の向きを一度に変えると壊れたときの切り分けが難しいので、3 つに分ける。

1. **公開をやめる** — `functions` 内で完結。影響は `react` の import のみ
2. **`piano.ts` を `dom` へ** — `react` の Piano の import 変更
3. **modifier 一式 + `applyDelta` を `dom` へ** — `react` の 12 ファイルの import 変更。`ModifierValue<T extends number | InputEventOption>` の制約もここで入れる

## レビューの指摘との対応

`docs/reviews/` の指摘のうち、この作業で一緒に片付くもの。

- `ModifierValue<T>` が `default` を持つ通常オブジェクトを誤判定する（01 P2）→ 手順 3 の制約で解消
- [x] `InputEventOptions` のエイリアス削除（同上）
- [x] `isEmpty` の引数型が実際より広い（01 P3）→ 未使用の実装と公開 export を削除した
- 黒鍵が範囲端にあるときの `pianoWidth` の不整合（01 P2）→ 手順 2 の移動先で直す
- テストが公開 entry point を迂回している（02 P3）→ 手順 1 で公開面が縮むので、確認するテストを足しやすくなる
