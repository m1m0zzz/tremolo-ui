# codex レビュー: @tremolo-ui/functions（コード）

- 実行日時: 2026-09-08 21:04 (JST)
- 対象: `packages/functions/src/`
- コミット: `8cc8371`
- 実行: `codex exec --sandbox read-only`（codex-cli 0.153.4）

---

## 対応状況

| 状況 | 件数 |
| --- | --- |
| 対応済み | 1 |
| 対応する（未対応） | 9 |
| 要判断 | 0 |
| 対応しない | 0 |
| 未判断 | 0 |

全 P1 / P2 / P3 を判定済み。P1 は再現の有無まで確認した。

---

### [P1] `stepValue` が小数の中間値と指数表記の step を誤って丸める — packages/functions/src/math.ts:29

> **状況: 対応済み** — #203 で修正。距離比較をやめて商を丸める実装に変え、指数表記の step と半 step の回帰テストを追加した。`Math.round` が返す `-0` の正規化も入れている。

**何が問題か。** 小数桁数を `String(step).split('.')` から求め、丸め前の `value` と候補値の距離をそのまま比較しています。

```ts
const quotient = Math.floor(value / step)
const decimalDigits = decimalPart(step)?.length
const v = toFixed(quotient * step, decimalDigits)
const next = toFixed((quotient + 1) * step, decimalDigits)
return Math.abs(value - v) < Math.abs(value - next) ? v : next
```

**どう壊れるか。**

- `stepValue(0.15, 0.1)` は、同距離なら上側を選ぶコードにもかかわらず、浮動小数誤差により `0.1` になります。
- `String(1e-7)` は `"1e-7"` なので `decimalPart()` が `undefined` になり、`toFixed()` が整数丸めになります。その結果 `stepValue(1.6e-7, 1e-7)` は `2e-7` ではなく `0` になります。
- この関数はドラッグ・キーボード・ホイールの値確定に共用されるため、小さい step のコントロール全体が 0 や整数へ吸着します。

**対応案。** `value / step` を `toPrecision` などで正規化してから `Math.round` し、最後に積を再度正規化してください。指数表記から小数桁数を推定しない実装にし、`0.15 / 0.1`、`1e-7`、負数の中間値をテストへ追加する必要があります。

### [P2] 黒鍵が範囲端にあると `pianoWidth`・描画位置・当たり判定が食い違う — packages/functions/src/piano.ts:88

> **状況: 対応する（未対応）** — `pianoWidth` が白鍵数だけで幅を出しているのを確認した。02 の「端が黒鍵のレイアウト」と同件。

**何が問題か。** 幅は白鍵数だけから計算しますが、黒鍵は境界を中心に左右へ張り出します。

```ts
export function pianoWidth(layout: PianoLayout): number {
  const whiteKeys = getNoteRangeArray(layout.noteRange).filter(isWhiteKey)
  return (
    (layout.whiteKeyWidth + (layout.keyGap ?? DEFAULT_KEY_GAP)) *
    whiteKeys.length
  )
}
```

```ts
return isBlackKey(note)
  ? whiteKeysIn * slot - blackKeyWidth(layout) / 2
  : whiteKeysIn * slot
```

`noteAt` にも `0 <= x < pianoWidth(layout)` の境界判定がありません。

**どう壊れるか。** `whiteKeyWidth: 40`、既定 gap、範囲 C4–D#4 の場合、`pianoWidth()` は `82` ですが、D#4 は `69..95px` に配置されます。そのため、報告された幅の外側である `noteAt(82, 10, 160, layout)` が D#4 を返します。範囲を C#4–D4 にすると、先頭の C#4 は `-13px` から描かれます。黒鍵一つだけの範囲では幅が `0` です。

**対応案。** 範囲内の全鍵について最小 left と最大 right を求め、共通の原点オフセットと幅を導出してください。そのオフセットを `notePosition` と `noteAt` の両方に適用し、`noteAt` は算出幅の外を必ず `null` にします。代替として端を白鍵に制限できますが、現在の `NoteRange` API より制約が強くなります。

### [P2] `ModifierValue<T>` は `default` プロパティを持つ通常オブジェクトを安全に扱えない — packages/functions/src/types.ts:65

> **状況: 対応する（未対応）** — **`ModifierValue<T extends number | InputEventOption>` と制約すると決定。** `T` になりうる型のうちオブジェクトなのはタプルだけで、それは `Array.isArray` で弾けるため、判別が型の側から保証される（`'default' in value` は型を持たない JS からの呼び出しに備えて残す）。`{ default: 1, shift: 0.1 }` という記法は変わらない。
>
> あわせて `InputEventOptions`（= `ModifierValue<InputEventOption>`）のエイリアスを削除し、`ModifierValue<InputEventOption>` と書く。末尾の `s` だけで型が変わるうえ、その `s` は「複数の選択肢」ではなく「修飾キーごとに書ける」を意味していて名前から読めないため。`dragSensitivity?: ModifierValue<number>` と形が揃う。`ModifierValue` / `ModifierMap` は、生成される API ページに型名が出る以上、公開のまま維持する。

**何が問題か。** `T` は無制約のジェネリックですが、オブジェクトに `default` があるだけで修飾キー用 map と判定しています。

```ts
export type ModifierValue<T> = T | ModifierMap<T>

function isModifierMap<T>(value: ModifierValue<T>): value is ModifierMap<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'default' in value
  )
}
```

**どう壊れるか。** 次の呼び出しは型上許可され、戻り値の `value` は `Config` と推論されますが、実行時には文字列 `"normal"` が返ります。

```ts
type Config = { default: string; amount: number }
const config: Config = { default: 'normal', amount: 2 }

selectModifier<Config>(config).value
```

`mapModifier` では、`Config` を受け取るはずのコールバックへ `"normal"` が渡され、プロパティ参照などで例外になり得ます。

**対応案。** modifier map に明示的な discriminant を設けるか、`{ modifiers: ModifierMap<T> }` のようにラップしてください。現在の形を維持するなら、公開ジェネリックを number・tuple など識別可能な型に制限する必要があります。

### [P2] skew 系 API が自身の `Scale` 契約を満たさない係数を生成する — packages/functions/src/scales.ts:61

> **状況: 対応する（未対応）** — 公開 helper が契約を破る係数を返すのは入力検証の欠落。

**何が問題か。** `skewScale` と `symmetricSkewScale` は `skew` の正値・有限性を検査しません。また、`skewWithCenterValue` は端点を center として明示的に許可しています。

```ts
export function skewScale(skew: number): Scale {
  return {
    normalize: (value, min, max) =>
      Math.pow(normalizeValue(value, min, max), skew),
    // ...
  }
}
```

```ts
if (!(min <= centerValue && centerValue <= max))
  throw new RangeError('requirements: min <= centerValue <= max')
return Math.log(0.5) / Math.log((centerValue - min) / (max - min))
```

**どう壊れるか。**

- `skewWithCenterValue(min, min, max)` は `0` を返します。
- その値を使った `skewScale(0)` は `normalize(min) === 1` となり、`normalize` と `denormalize` が逆関数ではなくなります。
- `skewWithCenterValue(max, min, max)` は `-Infinity` を返します。
- `symmetricSkewScale(0).denormalize(0.25, 0, 100)` は は `50` となり、区間の大部分が中央へ潰れます。

**対応案。** 両 scale factory で `Number.isFinite(skew) && skew > 0` を要求してください。helper は最初に `min < max`、続いて `min < centerValue && centerValue < max` を検証するべきです。

### [P2] 非線形スケールが、文書化された条件を満たす有限入力でも overflow する — packages/functions/src/scales.ts:109

> **状況: 対応する（未対応）**

**何が問題か。** `exponentialScale` は先に `max / min` を計算し、`curveScale` は先に `Math.exp(curve)` を計算しています。

```ts
Math.log(clamp(value, min, max) / min) / Math.log(max / min)
```

```ts
const grow = Math.exp(curve)
```

**どう壊れるか。** `min=1e-300`、`max=1e300` はともに有限・非ゼロ・同符号ですが、比が `Infinity` になります。数学上の中点は `1` なのに、`exponentialScale.denormalize(0.5, min, max)` は `Infinity`、`normalize(1, min, max)` は `0` を返します。また、有限値の `curveScale(710).denormalize(0.5, 0, 100)` は `NaN` です。

**対応案。** exponential scale は絶対値の対数を補間して比そのものを作らない実装にしてください。curve scale は `expm1` / `log1p` を使った安定形へ変形するか、安定して扱える `curve` の範囲を検証して例外にしてください。

### [P2] `unitFormat` は空の unit と非空の base で format/parse が一致しない — packages/functions/src/unit.ts:164

> **状況: 対応する（未対応）** — format と parse は往復するのが前提なので、片方向でしか成立しない組み合わせは直す。

**何が問題か。** formatter は選んだ prefix が空なら数値だけを出力しますが、parser は suffix のない数値を「保存値の単位」と解釈します。

```ts
return text + separator + PREFIXES[index][0] + unit
```

```ts
// A bare number is in the unit the value is stored in
if (suffix === '') return number
```

**どう壊れるか。**

```ts
const formatter = unitFormat('', { base: 'm' })
formatter.format(1000)                 // "1"
formatter.parse(formatter.format(1000)) // 1
```

保存値 `1000` が往復後に `1` へ変わります。実装には `unit === ''` 用の分岐があるため、単に未定義の入力とは扱えません。

**対応案。** 空 unit をサポートするなら、選択 prefix が空かつ base が非空のときは保存値と同じ base prefixで表現し、裸の数値を生成しないようにしてください。サポートしないなら、`unit === ''` を入口で拒否して型・JSDocにも制約を明記します。

### [P2] MIDI の整数制約がなく、宣言された戻り値と実行時値が一致しない — packages/functions/src/midi.ts:51

> **状況: 対応する（未対応）**

**何が問題か。** `number` をそのまま配列添字へ使っています。

```ts
export function noteName(noteNumber: number): `${NoteKey}${number}` {
  const noteIndex = mod(noteNumber, 12)
  const octave = Math.floor(noteNumber / 12) - 1
  return `${noteKeys[noteIndex]}${octave}`
}

export function noteKey(noteNumber: number): NoteKey {
  return noteKeys[mod(noteNumber, 12)]
}
```

また `scaleNotes` の octave 数も検証せず、`Array.from` の暗黙変換に任せています。

```ts
return Array.from({ length: octaves }, (_, octave) =>
  intervals.map((interval) => r + octave * 12 + interval),
).flat()
```

**どう壊れるか。**

- `noteName(60.5)` は戻り値型に反する `"undefined4"` を返します。
- `noteKey(NaN)` は `NoteKey` 型に反して `undefined` を返します。
- `isBlackKey(NaN)` は `true` になります。
- `scaleNotes('C3', 'major', 1.5)` は 1.5 octave を拒否せず、1 octave に切り捨てます。

**対応案。** 数値の note/root は有限な安全整数であること、`octaves` は非負の安全整数であることを共通 validator で確認してください。例外にしない設計なら、戻り値を `null` などで表現して型にも反映する必要があります。

### [P3] 読み取り専用 tuple を `InputEventOption` として渡せない — packages/functions/src/types.ts:4

> **状況: 対応する（未対応）** — `as const` で書いた設定を渡せないのは素直に不便。`readonly` を受ける形にする。

**何が問題か。** 設定値を変更するコードはないのに、tuple が mutable として宣言されています。

```ts
export type InputEventOption = ['normalized' | 'raw', number]
```

**どう壊れるか。** 次の自然な定数化は TypeScript で `InputEventOptions` に代入できません。

```ts
const keyboard = ['raw', 1] as const
applyDelta(value, 1, keyboard, range)
```

`keyboard` は readonly tuple なので、mutable tuple を要求する現在の API では型エラーになります。

**対応案。** `readonly ['normalized' | 'raw', number]` に変更してください。`selectInputEvent` と `applyDelta` は読み取りしかしないため、実装変更は不要です。

### [P3] `applyDelta` の range 検証が入力モードによって変わる — packages/functions/src/scales.ts:295

> **状況: 対応する（未対応）**

**何が問題か。** normalized mode では scale が `min < max` を検証しますが、raw mode は検証を通らず最後の `clamp` まで進みます。

```ts
const next =
  mode === 'normalized'
    ? scale.denormalize(scale.normalize(value, min, max) + x, min, max)
    : value + x

return clamp(toPrecision(stepped), min, max)
```

**どう壊れるか。** `{ min: 10, max: 10 }` に対し normalized mode は `RangeError` になりますが、raw mode は黙って `10` を返します。同じ `ValueRange` の設定ミスが、keyboard/wheel の mode によって例外または固定値という異なる故障になります。

**対応案。** `applyDelta` の入口で `min < max` を共通検証してください。`step` の有効範囲もここで検証すると、値パイプライン間の挙動を揃えられます。

### [P3] `isEmpty` の引数型が実際に判定する「空」の範囲より広い — packages/functions/src/util.ts:1

> **状況: 対応する（未対応）**

**何が問題か。** 引数は任意の `object` ですが、判定対象は enumerable な own string key だけです。

```ts
export function isEmpty(obj: object) {
  return Object.keys(obj).length === 0
}
```

**どう壊れるか。** `isEmpty(new Map([['key', 1]]))` と `isEmpty({ [Symbol()]: 1 })` は、どちらも内容があるのに `true` です。

**対応案。** plain record 専用なら引数を `Record<string, unknown>` に狭め、関数名またはJSDocで判定対象を明示してください。任意の object を受けるなら、`Map` / `Set` の `size` と `Reflect.ownKeys()` を型別に処理します。

a11y: 問題なし。このパッケージは DOM・role・ARIA・キーボードイベントを生成しません。

後始末・競合状態: 問題なし。リスナ、pointer capture、`requestAnimationFrame`、非同期処理、`destroy()` 対象を持ちません。

パフォーマンス: 問題なし。既定の MIDI 範囲に対する配列走査は小さく、明確なホットパス上の過大計算や tree shaking を妨げる namespace 集約はありません。

namespace オブジェクト／`*Methods`: 該当なし。コンポーネントを公開しない純粋関数パッケージです。

規約との乖離: 問題なし。React state、context、外部ストア、既定描画、CSS は含まれていません。

検証では `packages/functions` の既存テスト 132 件がすべて成功し、`tsc --noEmit` も成功しました。上記の不具合は既存テストにない境界入力を現在の実装へ直接与えて確認しています。

## まとめ

- P1: 1件
- P2: 6件
- P3: 3件

優先して直すべき上位3件は、次のとおりです。

1. `stepValue` の丸めアルゴリズム。全コントロールの値確定に波及し、小さい step では値域そのものが潰れます。
2. 黒鍵を範囲端に置いたときのピアノ幾何。表示幅・描画位置・当たり判定の共通前提が崩れています。
3. skew 系の入力検証。公開 helper が、そのまま `Scale` 契約を破る係数を生成します。
