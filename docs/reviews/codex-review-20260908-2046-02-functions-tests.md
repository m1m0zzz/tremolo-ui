# codex レビュー: @tremolo-ui/functions（テスト）

- 実行日時: 2026-09-08 21:25 (JST)
- 対象: `packages/functions/__tests__/`
- コミット: `8cc8371`
- 実行: `codex exec --sandbox read-only`（codex-cli 0.153.4）
- 最終確認: 2026-09-10 (`8fd96fe`)

---

## 対応状況

| 状況 | 件数 |
| --- | --- |
| 対応済み | 1 |
| 対応する（未対応） | 10 |
| 要判断 | 0 |
| 対応しない | 1 |
| 未判断 | 0 |

全 P1 / P2 / P3 を判定済み。P1 は再現の有無まで確認した。

---

### [P1] `stepValue` の指数表記と小数の中間値がテストされていない — packages/functions/__tests__/math.test.ts:40

> **状況: 対応済み** — #203 で `0.15 / 0.1`、`0.35 / 0.1`、負の中間値、`1.2e-7`〜`2.5e-7` の 7 ケースを追加した。

**何が問題か。** 実装は `step` の文字列表現から小数桁数を求め、丸めた二候補との距離を比較しています。

```ts
const decimalDigits = decimalPart(step)?.length
const v = toFixed(quotient * step, decimalDigits)
const next = toFixed((quotient + 1) * step, decimalDigits)
return Math.abs(value - v) < Math.abs(value - next) ? v : next
```

テストには通常の小数と `10e-7`（値は `0.000001`）しかなく、`String(step)` が指数表記になる境界や、二候補から等距離になる `0.1` 単位の値がありません。

```ts
expect(stepValue(3.15, 0.3)).toBe(3.3)
expect(
  stepValue(rawValue(normalizeValue(Math.PI, 0, 100), 0, 100), 10e-7),
).toBe(3.141593)
```

**どう壊れるか。**

- `stepValue(0.15, 0.1)` は浮動小数誤差によって下側の `0.1` を選びます。
- `String(1e-7)` は `"1e-7"` なので `decimalPart()` は `undefined` となり、候補が整数桁へ丸められます。そのため `stepValue(1.6e-7, 1e-7)` は `2e-7` ではなく `0` になります。
- `applyDelta` もこの関数を利用するため、小さい `step` を使うコントロール全体に波及します。

**対応案。** `0.15/0.1`、`1.6e-7/1e-7`、負の中間値を回帰ケースに追加してください。実装は文字列から桁数を推測せず、`value / step` を正規化して整数へ丸め、積を再度 `toPrecision` する方式が適切です。

### [P2] 端が黒鍵のレイアウトを使わないため、幅と当たり判定の不整合を検出できない — packages/functions/__tests__/piano.test.ts:112

> **状況: 対応する（未対応）** — 01 の `pianoWidth` の修正とあわせて追加する。

**何が問題か。** `pianoWidth` は白鍵数だけで幅を計算しますが、黒鍵は白鍵境界から左右へ張り出します。また、`noteAt` には `x < pianoWidth(layout)` の事前判定がありません。

```ts
const whiteKeys = getNoteRangeArray(layout.noteRange).filter(isWhiteKey)
return (layout.whiteKeyWidth + (layout.keyGap ?? DEFAULT_KEY_GAP)) *
  whiteKeys.length
```

```ts
return isBlackKey(note)
  ? whiteKeysIn * slot - blackKeyWidth(layout) / 2
  : whiteKeysIn * slot
```

現在の範囲外テストは、末尾が白鍵の `C3..B4` だけです。

```ts
expect(noteAt(pianoWidth(layout), 80, height, layout)).toBe(null)
```

**どう壊れるか。** `whiteKeyWidth: 40`、既定 gap、範囲 `C4..D#4` では `pianoWidth()` は `82` ですが、D#4 は `69..95px` に存在します。したがって幅の外側である `noteAt(82, 10, 160, layout)` が D#4 を返します。`C#4..D4` では先頭鍵が `-13px` に配置され、黒鍵だけの範囲では幅が `0` になります。

**対応案。** 先頭・末尾が黒鍵、および黒鍵一つだけの範囲について、位置・幅・`noteAt` を一組で検証してください。実装側では全鍵の最小 left／最大 right から原点と幅を共通に算出するか、APIとして範囲端を白鍵に限定する必要があります。

### [P2] `unitFormat` の往復テストが既定オプションだけで、対応していない組み合わせを見逃す — packages/functions/__tests__/unit.test.ts:79

> **状況: 対応する（未対応）**

**何が問題か。** `format` と `parse` の往復テストは `unitFormat('Hz')` だけです。

```ts
const { format, parse } = unitFormat('Hz')
for (const value of [0, 1, 999, 1000, 1234, 1e6, 0.5, -1234]) {
  expect(parse(format(value))).toBeCloseTo(value, 9)
}
```

一方、実装は任意の `separator` を出力しますが、`parse` はその separator を除去しません。また、空の unit と非空の base では、裸の数値の意味が format と parse で異なります。

```ts
return text + separator + PREFIXES[index][0] + unit
```

```ts
if (suffix === '') return number
```

**どう壊れるか。**

```ts
unitFormat('Hz', { separator: ' / ' }).format(1234) // "1.234 / kHz"
```

これを parse すると prefix が `"/ k"` と解釈され、`1.234` しか返りません。

```ts
const f = unitFormat('', { base: 'm' })
f.format(1000)          // "1"
f.parse(f.format(1000)) // 1
```

後者は保存値が `1000` から `1` に変わります。

**対応案。** `unit × base × separator × prefixes × digits` の代表的な組み合わせをテーブル化し、`parse(format(value))` を検証してください。separator を parse 時に明示的に除去し、空 unit をサポートするか拒否するかも契約として固定する必要があります。

### [P2] skew の端点・ゼロ・非有限係数がテストされていない — packages/functions/__tests__/scales.test.ts:73

> **状況: 対応する（未対応）**

**何が問題か。** テスト対象は `skew` が `0.5`、`1`、`2` の場合だけで、helper のエラーテストも範囲外の一例だけです。

```ts
expect(() => skewWithCenterValue(2000, 20, 1000)).toThrow(RangeError)
```

実装は端点を明示的に許可し、scale factory 自体は係数を検証しません。

```ts
if (!(min <= centerValue && centerValue <= max))
  throw new RangeError(...)
return Math.log(0.5) / Math.log((centerValue - min) / (max - min))
```

**どう壊れるか。**

- `skewWithCenterValue(min, min, max)` は `0` を返します。
- その結果、`skewScale(0).normalize(min, min, max)` は `Math.pow(0, 0)` により `1` となり、端点契約と逆関数契約を破ります。
- `skewWithCenterValue(max, min, max)` は `-Infinity` になります。
- `symmetricSkewScale(0)` は区間の大部分を中央へ潰します。

**対応案。** helper の `centerValue === min/max`、factory の `0`、負数、`NaN`、`Infinity` を追加してください。両 factory は有限の正数だけを許可し、center は開区間に限定するのが一貫しています。

### [P2] 非線形スケールの有限な極値入力で起きる overflow が未テスト — packages/functions/__tests__/scales.test.ts:12

> **状況: 対応する（未対応）**

**何が問題か。** 共通テストの範囲は常に `20..22000`、curve も `±4` に限定されています。

```ts
const MIN = 20
const MAX = 22000

['exponentialScale', exponentialScale],
['curveScale(4)', curveScale(4)],
['curveScale(-4)', curveScale(-4)],
```

実装では先に比や指数を作ります。

```ts
Math.log(clamp(value, min, max) / min) / Math.log(max / min)
```

```ts
const grow = Math.exp(curve)
```

**どう壊れるか。** `min=1e-300`、`max=1e300` は非ゼロで同符号という文書化された条件を満たしますが、`max / min` が `Infinity` になり、`exponentialScale.denormalize(0.5, min, max)` は `Infinity` になります。また、有限値の `curveScale(710).denormalize(0.5, 0, 100)` は `NaN` になります。

**対応案。** 数値限界付近の有限入力をテストへ追加してください。実装は比を直接作らない対数補間や `expm1`／`log1p` を利用するか、安定して扱える係数範囲を検証して例外にする必要があります。

### [P2] `mapModifier` と generic な `selectModifier` の契約がテスト対象外 — packages/functions/__tests__/modifiers.test.ts:1

> **状況: 対応する（未対応）**

**何が問題か。** テストが import するのは `selectInputEvent` だけで、公開されている `mapModifier` と `selectModifier<T>` は直接検証されていません。

```ts
import { selectInputEvent, type InputEventOptions } from '../src/types'
```

実装には、値が `0` の modifier を維持するための明示的な分岐があります。

```ts
if (value !== undefined && modifiers[MODIFIER_FLAG[modifier]]) {
  return { value, modifier }
}
```

```ts
if (value !== undefined) mapped[modifier] = fn(value)
```

また、generic の `T` は無制約ですが、`default` プロパティを持つ通常オブジェクトを modifier map と誤認します。

```ts
typeof value === 'object' &&
value !== null &&
!Array.isArray(value) &&
'default' in value
```

**どう壊れるか。**

- `selectModifier({ default: 1, shift: 0 }, shiftEvent)` の `0` を truthiness 判定に変える回帰があっても、現在の tuple テストは全値が truthy なので検出できません。
- `mapModifier({ default: 1, shift: 0 }, fn)` が `shift` を落としても検出できません。
- `T = { default: string; amount: number }` は型上許可されますが、通常値が modifier map と解釈され、`selectModifier<T>` は `T` 型に反して文字列を返します。

**対応案。** 数値の `0`、欠けた modifier、複数 modifier、通常値／map の双方を `selectModifier` と `mapModifier` に直接テーブルテストしてください。`default` を持つ `T` の扱いは discriminant の導入または generic 制約で解消する必要があります。

### [P2] `applyDelta` の不正 range／step に対するモード間の差が未テスト — packages/functions/__tests__/applyDelta.test.ts:26

> **状況: 対応する（未対応）**

**何が問題か。** テストする range はすべて `min < max` で、step は正数か省略だけです。

```ts
const range = { min: 0, max: 100, step: 1 }
```

実装は normalized mode では scale 経由で range を検証しますが、raw mode は検証しません。また `step: 0` は truthiness 判定で「省略」と同じになります。

```ts
const next =
  mode === 'normalized'
    ? scale.denormalize(scale.normalize(value, min, max) + x, min, max)
    : value + x

const stepped = quantum ? stepValue(next, quantum) : next
```

**どう壊れるか。**

- `{ min: 10, max: 10 }` は normalized mode では `RangeError`、raw mode では黙って `10` を返します。
- `stepValue(..., 0)` は明示的に拒否する一方、`applyDelta(..., { step: 0 })` は丸めなしとして処理します。
- `step: -1` は truthy なので例外となり、`0` と負数で設定ミスの扱いが変わります。

**対応案。** raw／normalized の双方について `min === max`、`min > max`、`step` の `0`・負数・`NaN` を追加してください。`applyDelta` の入口で range と step を共通検証するのが明確です。

### [P2] MIDI API の非整数・非有限入力と parse のエラー経路が未テスト — packages/functions/__tests__/midi.test.ts:11

> **状況: 対応する（未対応）**

**何が問題か。** `noteName`、`noteNumber`、`scaleNotes` のテスト入力は有効な整数・文字列だけです。公開されている `parseNoteName` の失敗経路も直接テストされていません。

```ts
const m = noteName.match(/^([a-g])(#{0,2}|b{0,2})(-?\d+)$/i)
if (!m) throw new Error('Invalid note name')
```

数値から音名を作る処理は、入力をそのまま配列添字にしています。

```ts
const noteIndex = mod(noteNumber, 12)
return `${noteKeys[noteIndex]}${octave}`
```

**どう壊れるか。**

- `noteName(60.5)` は戻り値型に反する `"undefined4"` を返します。
- `noteKey(NaN)` は `NoteKey` 型に反して `undefined` を返し、`isBlackKey(NaN)` は `true` になります。
- `scaleNotes('C3', 'major', 1.5)` は不正値を拒否せず、暗黙に一オクターブへ切り捨てます。
- `parseNoteName('H4')` や `parseNoteName('C###4')` の例外契約は、正規表現が緩められても検出されません。

**対応案。** note/root は有限整数、octaves は非負整数という境界をテストで固定してください。`parseNoteName` には有効値の構造と、無効な音名・余分な文字・空文字の例外を直接検証するケースが必要です。

### [P3] 多くのテストが公開 entry point を迂回している — packages/functions/__tests__/math.test.ts:1

> **状況: 対応する（未対応）** — 実装の隣のテストが対象モジュールを直接 import すること自体は方針どおり。ただし re-export の書き忘れを誰も検出しないので、`src/index.ts` の公開面を確かめるテストを 1 つ足す形にする。

**何が問題か。** `math`、`midi`、`piano`、`unit` のテストは個別モジュールを直接 import しています。

```ts
import { ... } from '../src/math'
import { ... } from '../src/midi'
import { ... } from '../src/piano'
import { unitFormat } from '../src/unit'
```

一方、利用者向けの公開面は `src/index.ts` です。

```ts
export { ... } from './math'
export { ... } from './midi'
export { ... } from './piano'
export { ... } from './unit'
```

**どう壊れるか。** たとえば `unitFormat` や `noteAt` を誤って `index.ts` から削除しても、それぞれのテストは引き続き型検査・実行可能です。内部実装は正常なのに、パッケージ利用者の import だけが壊れる偽陰性になります。

**対応案。** 公開 API のテストは原則 `../src` から import するか、`index.ts` の主要な runtime export を確認する smoke test を一つ追加してください。

### [P3] modifier の fallback／優先順位テストが戻り値の半分しか検証していない — packages/functions/__tests__/modifiers.test.ts:50

> **状況: 対応する（未対応）** — `modifier` の側を検証していない。

**何が問題か。** fallback と複数 modifier のケースでは `modifier` だけを検証し、実際に選ばれた `option` を確認していません。

```ts
expect(selectInputEvent(options, held('altKey')).modifier).toBeNull()
```

```ts
expect(
  selectInputEvent(options, held('shiftKey', 'ctrlKey')).modifier,
).toBe('ctrl')
```

**どう壊れるか。** 未設定の alt で `{ option: options.shift, modifier: null }` を返す回帰や、meta を選択したと報告しながら ctrl の option を返す回帰でもテストが通ります。`applyDelta` は `option` の値を使うため、表示上の modifier 判定が正しくても移動量が誤ります。

**対応案。** すべて `{ option, modifier }` を `toStrictEqual` で検証してください。特に複数同時押しは、選択名と選択値の組を確認する必要があります。

### [P3] 公開されている算術・utility helper に契約テストがない — packages/functions/__tests__/math.test.ts:1

> **状況: 対応する（未対応）**

**何が問題か。** `math.test.ts` の import 対象は次だけです。

```ts
clamp,
normalizeValue,
rawValue,
stepValue,
toPrecision,
decimalPart,
integerPart,
```

しかし `math.ts` はほかにも次を公開しています。

```ts
export function toFixed(...)
export function radian(...)
export function degree(...)
export function mapValue(...)
export function dbToGain(...)
export function gainToDb(...)
```

`util.ts` の `isEmpty`、`mod`、`xor` にも専用テストがありません。`mod` は MIDI 経由で一部通りますが、公開関数としての契約は固定されていません。

**どう壊れるか。** `radian(180) === Math.PI`、`degree(Math.PI) === 180`、`dbToGain(0) === 1`、`gainToDb(1) === 0`、逆向き範囲の `mapValue`、`xor` の真理値表などが壊れても、このパッケージの対象テストでは直接検出できません。

**対応案。** 変換関数は既知値と往復、`xor` は全四組、`mod` は負の非倍数、`isEmpty` は enumerable own property の有無をテーブルテストしてください。

### [P3] `min: 0` の回帰ケースが既存ケースと重複している — packages/functions/__tests__/applyDelta.test.ts:20

> **状況: 対応しない** — 回帰ケースの重複は害がない。消すと、そのケースが何の再発防止だったかが失われる。

**何が問題か。** 専用テストは次の二ケースです。

```ts
expect(applyDelta(5, 1, ['normalized', 0.1], range)).toBe(15)
expect(applyDelta(5, 1, ['raw', 1], range)).toBe(6)
```

しかし同じファイルの `range` は元から `min: 0` であり、raw・normalized の通常テストもすでにその条件を通っています。

```ts
const range = { min: 0, max: 100, step: 1 }
expect(applyDelta(50, 1, ['raw', 1], range)).toBe(51)
expect(applyDelta(0, 1, ['normalized', 0.25], { min: 0, max: 8 })).toBe(2)
```

**どう壊れるか。** `min` を truthiness で検査する回帰は既存の raw／normalized ケースでも失敗するため、専用テストを削除しても分岐カバレッジは変わりません。ケースが増えるほど同一障害に対する失敗表示が重複し、原因を絞りにくくなります。

**対応案。** `min: 0` を通常系のテスト名またはテーブル行として明示し、専用ケースは統合してください。過去不具合の説明を残すなら、代表ケース一つで十分です。

非同期の待機・モック起因の偽陽性: 問題なし。対象は同期的な純関数テストで、非同期処理やモックを使用していません。

## まとめ

- P1: 1件
- P2: 7件
- P3: 4件

優先して直すべき上位3件は次のとおりです。

1. `stepValue` に指数表記の step と小数中間値のテストを追加し、丸めアルゴリズムを修正する。
2. 先頭・末尾が黒鍵の Piano レイアウトで、幅・位置・当たり判定を一体で検証する。
3. `unitFormat` のオプション組み合わせについて round-trip テストを追加し、separator と空 unit の不一致を解消する。

指定に従い、テスト・ビルドは実行せず、ファイルの読み取りと検索だけで確認しています。
