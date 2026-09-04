# tremolo-ui コア切り出し計画

対象リポジトリ: `m1m0zzz/tremolo-ui`
目的: React 依存のロジックを framework-agnostic なコアへ切り出し、React / Vue / Svelte のラッパーを提供できる構成にする。

## 1. 現状（リポジトリで確認済み）

### パッケージ構成

npm workspaces のモノレポ。`packages/functions`, `packages/react`, `site` の 3 ワークスペース。

| パッケージ | version | 内容 |
| --- | --- | --- |
| `@tremolo-ui/functions` | 0.2.0 | 純粋関数のみ。`sideEffects: false` |
| `@tremolo-ui/react` | 0.2.0 | 全コンポーネント + hooks |

`@tremolo-ui/functions` の公開関数:

- math: `clamp` / `normalizeValue` / `rawValue` / `skewWithCenterValue` / `stepValue` / `mapValue` / `toFixed` / `integerPart` / `decimalPart` / `radian` / `degree` / `dbToGain` / `gainToDb`
- midi: `noteKey` / `noteKeys` / `noteName` / `noteNumber` / `noteToFrequency` / `parseNoteName` / `isBlackKey` / `isWhiteKey` / `whiteKeys` / 型 `NoteKey` `WhiteKey`
- util: `isEmpty` / `mod` / `styleHelper` / `xor`、型 `InputEventOption`

`@tremolo-ui/react` の依存:

- dependencies: `@tremolo-ui/functions` (`^0.1.6`), `clsx` (`^2.1.1`), `zustand` (`^5.0.3`)
- peerDependencies: `react` (`^18 || ^19`), `react-dom` (`^18 || ^19`)

### コンポーネントと hooks

コンポーネント: `AnimationCanvas` / `DragObserver` / `Knob` / `NumberInput` / `Piano` / `PointsEditor` / `Slider` / `WheelObserver` / `XYPad`

公開 hooks: `useAnimationFrame` / `useDrag` / `useDragWithElement` / `useEventListener` / `useInterval` / `useLongPress` / `useMIDIAccess` / `useMIDIInput` / `useMIDIMessage`

内部 hooks（未公開）: `useCallbackRef` / `usePianoDrag` / `useRefCallbackEvent`

ソース合計 約4,900行（stories / test を除く）。

### zustand の使われ方（重要 / 当初の想定と異なる）

`createStore` + `useStore` を Context 経由でサブコンポーネントに配る形。**ストアの内容はコンポーネントごとに一貫していない。**

| コンポーネント | ストアの内容 |
| --- | --- |
| Slider | 設定のみ（`min` `max` `step` `skew` `vertical` `reverse` `disabled` `readonly`）。**value を持たない** |
| Knob | **`value`** + `min` `max` `step` `skew` `startValue` `angleRange` |
| NumberInput | **`value: string`** + `valueAsNumber` + `step` `min` `max` `units` `digit` `readonly` `keepWithinRange` + **`onChange` コールバック** |
| Piano | `noteRange` `glissando` `midiMax` `fill` + **`onPlayNote` / `onStopNote` / `label` コールバック** |
| PointsEditor | **`containerElementRef`** + `disabled` `readonly` `externalStyles` |

→ コア化の前に「何をストアに置くか」の方針統一が必要。

### リリース機構（既存）

- `scripts/publish.sh <patch|minor|major>` が同期リリースを実装済み。functions を bump → react の依存を実バージョンに更新 → react を bump → commit → `v<version>` タグを push
- `.github/workflows/release.yml` が `v*.*.*` タグを検知して test → build → publish
- publish は **npm trusted publishing (OIDC)**。`permissions: id-token: write` + `npm install -g npm@latest`（OIDC は npm CLI 11.5.1 以上が必要）
- changesets は未導入

**これらは changesets へ置き換える（第8章参照）。**

## 2. 決定事項

| 論点 | 決定 |
| --- | --- |
| コアの形 | Embla 型。要素を受け取り listener を張る命令的インスタンス。`destroy()` を持つ |
| platform 抽象 | **入れない**（Floating UI の core/dom 分割は不要）。DOM 直結 |
| 要素の受け渡し | ラッパーがマークアップを描画するため、**ref で直接渡す**。querySelector 探索は不要 |
| data 属性 | 要素特定には使わない。`[data-dragging]` `[data-disabled]` 等、**スタイリングと状態表現のみ** |
| バージョニング | 全パッケージ同一バージョンで同期リリース。**changesets の `fixed` で実現**し、`scripts/publish.sh` は廃止 |
| `@tremolo-ui/react` の公開 API | 破壊的変更を許容 |
| Web Components | 中止 |
| `@tremolo-ui/functions` | **変更しない**。純粋関数のまま維持 |

### 未確定（着手前に決める）

1. **値の所有者**（コアが `value` を保持するか、ラッパーが保持するか）
   - コアが保持する案の根拠: AnimationCanvas でオートメーション/LFO 由来の値を毎フレーム描画する場合、値が React state にあると 60fps で再レンダリングが走る。コアが保持すれば `subscribe` で再レンダリングなしに追従できる
   - 現状 Knob は既にストアに value を持ち、Slider は持たない。どちらに寄せるか要決定
2. **NumberInput の扱い**（`<input>` のテキストが値の裏付けであり、他5つと性質が異なる。制御コンポーネント衝突・カーソル位置維持・IME 中間文字列の考慮が必要）
3. **`@tremolo-ui/dom` の公開範囲**（`createDrag` / `createWheel` を公開 API にするか内部専用にするか）

## 3. 目標構成

```
packages/
  functions/   @tremolo-ui/functions   純粋関数（現状維持）
  dom/         @tremolo-ui/dom         新規。DOM 依存・framework 非依存
  react/       @tremolo-ui/react       薄いラッパーへ再構成
  vue/         @tremolo-ui/vue         将来
  svelte/      @tremolo-ui/svelte      将来
```

`@tremolo-ui/dom` に置くもの:

- `createDrag(el, handlers)` / `createWheel(el, handlers)` — ポインタ・ホイールの正規化、pointer capture、`touch-action`、`passive: false` の管理
- `createDragValue(elements, options)` — 上記 + functions のスケール変換 + 座標写像。Knob / Slider / XYPad / PointsEditor が座標写像の差分だけで共有
- Piano 用のポインタ→ノート番号写像（値が集合なので別プリミティブ）
- AnimationCanvas 用の rAF + ResizeObserver + DPR 管理
- MIDI アクセス（`createMIDIAccess` 等）

`@tremolo-ui/functions` には移さない。`sideEffects: false` の宣言と、DOM リスナを張るコードは両立しない。

ラッパーの形はフレームワークごとに変えてよい（統一しない）:

- React: hook（`useDrag(ref, handlers)`）またはコンポーネント
- Svelte: action（`use:drag={handlers}`）
- Vue: composable または custom directive

## 4. 作業タスク

### Phase 0: 準備

- [x] `packages/react` の依存 `@tremolo-ui/functions": "^0.1.6"` が実バージョン 0.2.0 とずれている。意図的か確認し、必要なら修正
- [x] devDependencies の `eslint-plugin-lit-a11y` が Web Components 中止により不要か確認、不要なら削除
- [x] 現行の React 公開 API のスナップショットを残す（破壊的変更の差分を後から説明するため）
- [x] **changesets への移行を先に完了させる（第8章）**。dom 追加より前にやること

### Phase 1: `@tremolo-ui/dom` の器を作り、MIDI だけ移す

ロジックの複雑さ抜きでパッケージ分割の配線を検証するのが目的。MIDI 系はコンポーネントと無関係な Web MIDI API ラッパーなので最適。

- [x] `packages/dom` を作成。`package.json` は functions のものを雛形にする（`type: module`, tsdown, `exports` の require/import 分岐）
- [x] ルート `package.json` の `workspaces` に `packages/dom` を追加
- [x] `useMIDIAccess` / `useMIDIInput` / `useMIDIMessage` のロジックを `createMIDIAccess` 等としてコアへ移植
- [x] `@tremolo-ui/react` 側は同名 hook を維持し、内部でコアを呼ぶだけにする
- [x] ~~`.changeset/config.json` の `fixed` に `@tremolo-ui/dom` を追加~~ → 変更不要。`fixed` は `[["@tremolo-ui/*"]]` のグロブなので dom を自動的に含む（`changeset status` で確認済み）
- [x] `build.yml` にも dom を追加
- [x] **`@tremolo-ui/dom` の初回 publish はローカルから手動で行う**（trusted publishing は npm 上にパッケージが存在しないと設定できないため）
- [x] npm の `@tremolo-ui/dom` 設定で trusted publisher を登録（org/user・repo・ワークフローファイル名。既存2パッケージと同じ workflow を指す）
- [x] 実際に 1 リリース通して npm 上で依存が解決できることを確認

**Phase 1 完了（0.3.0 でリリース済み）。** 3パッケージとも provenance 付きで publish され、新パッケージでも OIDC trusted publishing が機能することを確認した。クリーンな環境で `npm i @tremolo-ui/react@0.3.0` を実行し、dom / functions が 0.3.0 で解決されること、ESM・CJS 双方で import できることも確認済み。

#### Phase 1 で分かったこと（vue / svelte 追加時にも効く）

1. **新パッケージのコードを main に入れる前に、手動 publish と trusted publisher 登録を済ませること。** 計画では「changeset を追加しなければリリースは走らない」前提だったが、`changesets/action` は `publish-script` を渡してあると **changeset が無いときにこそ publish を実行する**。`changeset publish` はレジストリに無いバージョンを publish しようとするため、npm 上に存在しない新パッケージが main に入った時点で E404 で落ちる。正しい順序は「ローカルから手動 publish → trusted publisher 登録 → コードを push」。
2. **ローカル publish には npm へのログインが必要。** 従来の publish は全て CI の OIDC 経由だったため、ローカルの authToken が失効していても気付かない。scoped パッケージでは未認証でも 401 ではなく **E404 が返る**ので、`npm whoami` で切り分けること。
3. **publish 直後、レジストリの読み取り側が数分 404 を返す。** `PUT 200` がログにあれば publish は成功している。バージョン指定エンドポイント（`/@scope/name/x.y.z`）の方が先に 200 になる。
4. **`.changeset/config.json` の `fixed` は変更不要。** `[["@tremolo-ui/*"]]` のグロブが新パッケージを自動的に含む。
5. **Vercel の Storybook プロジェクトのビルドコマンドはパッケージ追加の影響を受ける。** `npm run build:package -w packages/functions` のように個別指定していると新パッケージの dist が無く、Vite が解決できずに落ちる。ルートの `npm run build:sb`（全ワークスペースをビルドしてから Storybook をビルド）を使うこと。
6. **拡張子のない `LICENSE` は `.prettierignore` に必要。** 新パッケージに LICENSE を追加すると lint-staged の prettier がパーサを推論できず pre-commit が落ちる。

### Phase 2: `createDrag` / `createWheel`

- [x] `useDrag` のバグ修正（後述）を反映した `createDrag` をコアに実装
- [x] Pointer Events に一本化（現行の `useDrag` は `pointerdown` + `mousemove` + `touchmove` + `pointerup` の混在）
- [x] `setPointerCapture` を使い、window への `mousemove` / `pointerup` 購読を不要にする
- [x] `createWheel` は現行 `useRefCallbackEvent('wheel', ..., { passive: false })` の挙動を踏襲する
- [x] `DragObserver` / `WheelObserver` / `useDrag` / `useDragWithElement` をコア呼び出しに差し替え
- [x] 既存の Storybook で回帰確認（マウス・タッチ・実機まで確認済み。過程で回帰を 2 件見つけて修正した）

#### Phase 2 での公開 API 変更

pointer capture を使うと、pointerdown を受けた要素が以降のイベントを受け取るため、`pointerDownHandler` を呼び出し側に返す必要がなくなった。

| | 変更前 | 変更後 |
| --- | --- | --- |
| `useDrag` | `[refCallback, pointerDownHandler]` | ref コールバック 1 つ |
| `useDragWithElement` | `{ refHandler, pointerDownHandler, dragging }` | `{ refCallback, dragging }` |
| `useWheel` | （なし） | 新規。`useRefCallbackEvent('wheel', ..., { passive: false })` の置き換え |
| `DragObserver` | あり | **削除**。`useDrag` に一本化 |
| `WheelObserver` | あり | **削除**。`useWheel` に一本化 |

`useRefCallbackEvent` は `usePianoDrag` からのみ使われる内部 hook として残っている（Phase 4 で Piano をコア化する際に不要になる想定）。

#### Phase 2 で直したもの / 意図的に維持したもの

- **直した**: 5.1 の delta バグ。画面左上端 `(0,0)` から掴むと旧実装は `onDrag` が一度も発火しなかった。回帰テストを `packages/dom/__tests__/pointer/drag.test.ts` に入れてある
- **直した**: `useDragWithElement` の `onDragStart` に古い正規化値（初回は 0,0）が渡っていた問題。`setDragging(true)` 直後の `handleDrag` が更新前の `dragging === false` を見て早期 return していたため、座標が更新されないまま `onDragStart` が呼ばれていた
- **直した**: `onDragEnd` が、その要素で pointerdown していなくても window 上の任意の pointerup で発火していた問題
- **維持した**: ボタンの種類を問わずドラッグが始まる挙動（右クリックドラッグでも値が動く）。フィルタを足すかは別途判断

#### pointerdown での発火はコンポーネントごとに分ける

ドラッグの性質は 2 つに分かれ、pointerdown 単体で値を動かすかどうかは絶対位置型だけの論点になる。

| コンポーネント | 座標の性質 | pointerdown で発火 |
| --- | --- | --- |
| Knob | 相対デルタ | 該当なし（デルタしか意味を持たない） |
| Slider | track の rect で正規化 | **する**（クリックした位置へ飛ぶ） |
| XYPad | area の rect で正規化 | **する** |
| PointsEditor / Point | container の rect で正規化 | しない（点の縁を掴んだときに点がずれるため） |
| Piano | piano の rect で正規化 | する（押下＝発音。従来からこの挙動） |

`useDragWithElement` に `updateOnPointerDown` を追加し、Slider / XYPad のみ有効にした。Phase 3 で `createDragValue` に持ち上げる。

なお Piano だけが従来から pointerdown で発火していたのは設計判断ではなく実装差によるもので、`usePianoDrag` が `dragged.current`（ref）を使うのに対し `useDragWithElement` が `setDragging`（state）を使っていたため、pointerdown 時の処理が更新前の値を見て早期 return していた。

#### DragObserver / WheelObserver を廃止

コア化により両者は「hook を呼んで ref を要素に渡すだけ」の薄いラッパーになり、`as` prop で要素を選べる以外の価値が無くなったため削除した。リポジトリ内の利用箇所は stories のみで、ドキュメントページも CSS も無かった。stories は `useDrag` / `useWheel` のデモとして書き直してある。


### Phase 2.5: Slider / Knob / XYPad の実装統一

Phase 3 の前に、3 つの「範囲付きスカラー」コンポーネントを同じ実装に揃えた。

- [x] children をそのまま描画する形に統一（`Children.forEach` による props 抜き取りを廃止）
- [x] フォールバックを全廃し `children` を型で必須に（`Knob.SVGRoot` も同様）
- [x] zustand store を React context に置き換え、設定・値・導出値をレンダー中に計算
- [x] `XYPad` の軸ごと設定を `[x, y]` タプルに変更（Slider の `min={0}` の自然な拡張）
- [x] ブラウザでの目視確認

#### バラバラだった原因

value の置き場所の違いは設計判断ではなく、**children の扱いの違いから機械的に決まっていた**。

| | children | 結果 |
| --- | --- | --- |
| Slider / XYPad | 子から props を抜き取り、要素は捨てて自前で再描画 | props で値を渡せる → store は設定のみ |
| Knob | そのまま描画 | props で渡せない → store に value を入れるしかない |

抜き取り方式は `child.type == Thumb` の一致判定なので、ユーザーが子をラップしたり独自のマークアップに混ぜたりすると例外になっていた。compound component としては Knob 側が正しい形。

#### value を store に持たない理由

`value` は props から来るため、store に入れた時点でコピーになり同期が必要になる。実際、`SliderProvider` / `KnobProvider` はどちらも `useEffect(..., [props])` で毎レンダー `setState` しており、さらに effect は描画後に走るため **値が変わったフレームでは store が古い値を返していた**。レンダー中に導出すればコピーも同期も不要になる。

zustand の利点であるセレクタ購読も、`value` が props である以上 Root が再レンダーすれば子も再レンダーするため、ここでは効果が出ない。サブコンポーネントは Slider で 4 つ、Knob で 3 つ。

#### 60fps の話（訂正）

「コアが value を持てば再レンダーなしに 60fps 追従できる」は、**現在の制御コンポーネント API のままでは成立しない**。`value` が props である限り利用者側が 60fps で `setState` する。この利点を得るには非制御 + 命令的なパス（`defaultValue` + `ref.setValue()`）を別途足す必要があり、値の所有者の議論とは切り離して判断できる。

#### 決めたこと

- `wheel` / `keyboard` の軸ごと指定は廃止（XYPad はホイールを Shift で軸切り替えする 1 つの操作として扱う）
- つまみ半分の余白は CSS 変数（`--thumb-size`）へ。Root が children からつまみの大きさを知る手段が無くなったため
- `Knob` の既定サイズも CSS 変数（`--knob-size`、50px）へ。`size` 未指定だと要素が潰れて何も見えない不具合があった

### Phase 3: `createDragValue`

- [x] `useDragWithElement`（要素の bounding rect に対する正規化）をコアへ移植
- [x] `createDragValue` として、座標写像を差し替え可能な形にまとめる
- [x] Knob / Slider / XYPad / PointsEditor を `createDragValue` ベースに差し替え
- [x] Phase 2/3 の時点で「値の所有者」を確定させ、全コンポーネントで `value` / `onChange` の意味論（step の丸め、範囲外の扱い）を揃える
- [x] ブラウザでの目視確認

#### 構造

`createDragValue(element, options)` は `createDrag` の上に「座標 → 値」の変換を乗せたもの。責務を 2 つに割った。

| | 担当 | 差し替え可能 |
| --- | --- | --- |
| mapping | ポインタの動き → 各軸の 0-1 の位置 | する（`DragValueMapping`） |
| axis | 0-1 の位置 → 値（`min` `max` `step` `skew` `reverse`） | しない。全コンポーネント共通 |

同梱する mapping は 2 つ。

- `elementMapping(getElement)`: 要素の bounding rect に対して正規化する。**値＝指した位置**。Slider / XYPad / PointsEditor
- `relativeMapping({ pixelRange })`: ドラッグ開始時の値からの相対移動。ポインタの位置自体には意味がない。Knob

値の算出順序を 1 か所に固定した: 位置 → `reverse` → `rawValue`（skew）→ `stepValue` → `clamp`。従来も 4 コンポーネントとも同じ順序だったが、それぞれが自前で書いていた。

#### 決めたこと

- **値の所有者はラッパー。** コアは値を保持せず、必要なとき（`relativeMapping` の開始時）だけ `getValue()` で読む。Phase 2.5 で「value は props から来るのでコピーすると同期が要る」と結論した延長で、コアでも同じ扱いにした。非制御 + 命令的なパス（`defaultValue` + `ref.setValue()`）を足すかは、これとは独立に判断できる
- **`reverse` は「画面の向きを反転する」意味に統一。** 位置は常に画面に従う（x は右、y は下）。垂直 Slider は `xor(vertical, reverse)` を、Knob は y 軸に `reverse: true` を渡す（上へドラッグすると値が増える）
- **`step` を省略すると丸めない。** PointsEditor の Point は 0-1 の位置がそのまま値なので、丸めが要らない。`stepValue` は `step <= 0` で例外を投げるため、0 を渡す形にはできない
- **PointsEditor の `clampPoint` は React 側に残した。** 点ごとの `min` / `max` は軸のレンジではなく可動範囲の制限で、`rawValue` に渡すと再スケールになってしまう（左端が 0.2 ではなく 0.2〜1.0 の写像になる）

#### `update()` を追加した

`createDrag` / `createDragValue` に `update(options)` を足し、リスナを張り直さずに設定を差し替えられるようにした（Embla と同じ形）。React 側は「node ごとにインスタンスを 1 つ作り、毎レンダー `update()` で最新の props を流し込む」ようになる。

これがないと `min` / `max` / `step` を effect の依存に入れることになり、**ドラッグ中にそれらが変わるとインスタンスが破棄されてドラッグが中断する**。`__tests__/hooks/useDragValue.test.tsx` に回帰テストがある。

#### Phase 3 での公開 API 変更

| | 変更前 | 変更後 |
| --- | --- | --- |
| `useDragWithElement` | `{ refCallback, dragging }`、正規化座標を渡す | **削除**。`useDragValue` に置き換え |
| `useDragValue` | （なし） | 新規。`{ refCallback, dragging }`、**値**を `XY<number>` で渡す |
| `@tremolo-ui/dom` | | `createDragValue` / `elementMapping` / `relativeMapping` / `toXY` と型を追加 |

`useDrag`（相対デルタのみの低レベル hook）は公開のまま残す。Knob が使わなくなったため、リポジトリ内の利用箇所は stories とテストのみ。

`XY` / `XYOrSingle` / `toXY` の定義は `@tremolo-ui/dom` に移し、`XYPad/context.tsx` はそれを re-export するだけにした。

あわせて `XYOrSingle<T>` を **`XYInput<T>`** に改名し、ペア側を `readonly [x: T, y: T]` にした。

判別が `Array.isArray` である以上、`T` 自体が配列だと単一値とペアを区別できない。そこを条件型で表現し、**配列のときだけ単一値の形を落とす**（ペアでしか書けなくなる）。

```ts
export type XYInput<T> = [T] extends [readonly unknown[]]
  ? readonly [x: T, y: T]
  : T | readonly [x: T, y: T]
```

プリミティブの whitelist で制限する案もあったが、それだと `createDragValue` の `axis`（`AxisOptions` というオブジェクト）に使えず、同じ形の型と型述語をもう一組定義することになる。条件型なら実行時の要件（配列でないこと）をそのまま型にできる。

`toXY` の引数は `XYInput<T>` ではなく `T | readonly [x: T, y: T]` と書き下している。条件型は絞り込めないため。制限は型を宣言する側（props など）に置く。

#### ついでに直したもの

- 正規化の基準要素が幅・高さ 0 になっていると `normalizeValue` が `RangeError` を投げていた（`min < max` を要求するため）。位置 0 を返すようにした
- `@tremolo-ui/dom` が `@tremolo-ui/functions` に依存するようになった（スケール変換のため）。`fixed` グループなのでバージョンは自動で揃う

### Phase 4: 残りのコンポーネント

- [ ] AnimationCanvas（rAF + ResizeObserver + DPR。`canvas.ts` と `index.tsx` 計 約280行）
- [ ] NumberInput（テキスト入力はラッパー担当、ドラッグ/矢印キー増減はコア、パース・フォーマット・clamp・step は純粋関数）
- [ ] NumberInputは InternalInputをInputFieldとして公開。他のコンポーネント同様 Compound Component パターンで公開
- [ ] **`<input>` に `tabIndex` を設定すべきか決める。** 設定する場合、フォーカス時のスタイルはラッパー側に `:focus-within` で当てる
- [ ] Piano
  - [ ] 既存のTODO: マルチタッチ、グリッサンド。(`usePianoDrag` が該当)
  - [ ] コンポーネント設計の検討

### Phase 5: zustand 除去

- [ ] 5コンポーネントのストア内容の方針を統一（設定のみ / 値も持つ）
- [ ] コアのインスタンスが同等の情報を持つようにする
- [ ] React 側は `useSyncExternalStore` でセレクタ購読に置換
- [ ] `zustand` を dependencies から削除
- [ ] `SliderProvider` の `useEffect(..., [props])` は props が毎レンダー新しいオブジェクトのため毎回 `setState` が走る。置換時に解消する

### Phase 6: Vue / Svelte

`plans/milestone.md` へ移動。1.0 に向けたマイルストーンとして管理する。

## 5. コア化と並行して片付けるもの

Phase の順序に組み込みきれないが、1.0 までに決着させる項目。

### 5.1 CSS の完全ヘッドレス化 — Phase 3 と Phase 5 の間

Radix UI / Base UI と同じ方針にする。パッケージはスタイルを配らず、**ドキュメント上でデモの CSS を公開**して、利用者が Tailwind / CSS Modules / plain CSS を自由に選べる形にする。

- [ ] `packages/react` から `index.css` 群を外す方針を決める（完全に消すか、opt-in の「デフォルトテーマ」として別 export に残すか）
- [ ] `package.json` の `exports` から `./styles/*.css` を整理（Phase 6 の「CSS の配布方法を再検討」はこの項目に統合）
- [ ] 状態を表す ARIA 属性 / `data-*` 属性が、利用者側から十分にスタイリングできるか確認する。現状は `[aria-disabled]` `[aria-readonly]` `[data-dragging]` を使っている
- [ ] ドキュメントサイトに、デモで使っている CSS をコピーできる形で載せる

**これは破壊的変更であり、既存利用者は `@tremolo-ui/react/styles/index.css` を import しているため、移行手順を用意する必要がある。**

### 5.2 `tremolo-user-select-none` / `tremolo-cursor-*` をどうするか — 5.1 とセット

ドラッグ中に body へクラスを付け外しする仕組み（`src/styles/global.css` + `src/components/_util/index.ts`）。Knob / Slider / XYPad / PointsEditor の 4 コンポーネントが `externalStyles` prop 経由で使っている。**CSS をヘッドレス化すると、このグローバル CSS だけがパッケージに残ることになるため、5.1 と同時に決める。**

選択肢:

1. コア（`@tremolo-ui/dom`）が `element.style` を直接操作する（クラス不要になり CSS を配らなくて済む）
2. `data-*` 属性を body に付けるだけにして、スタイルは利用者に任せる
3. 現状維持（グローバル CSS だけは配り続ける）

`createDrag` は既に `touch-action` / `user-select` / `-webkit-user-select` / `-webkit-touch-callout` を要素に直接適用し、ドラッグ中は `selectstart` をキャンセルしているので、1 と整合性が取りやすい。

**`tremolo-cursor-*` は Phase 2 で不要になった。** ドラッグ中の cursor は `createDrag` の `cursor` オプションが要素へ直接適用する形に変えた（pointer capture により、ポインタが要素の外へ出てもその cursor が維持されるため、body を触る必要がない）。`_util` の `setCursorStyle` / `resetCursorStyle` と `global.css` の `.tremolo-cursor-*` は**現在どこからも使われていない**ので削除できる。

ドラッグ中にページ全体へ掛ける `tremolo-user-select-none` の方は残っており、ここで判断する。

> 補足: body へ cursor クラスを付ける実装は、タッチの長押しでページ全体が一瞬選択状態になる不具合の原因だった（ドラッグ開始と同時に文書全体のスタイルが再計算されるため）。Storybook 上で要因を 1 つずつ切り分けて特定した。

### 5.3 内部ユーティリティの削除

- [x] ~~`_util/composeRefs.tsx` を削除~~ → **削除せず、Slider / Knob / XYPad の Root で `useComposedRefs` を使う形にした。**
  - `composeRefs(...)` も、それを置き換えたインライン ref も、毎レンダー新しい関数になるため React が ref を付け直す（`node → null → node`）。ref コールバック内でリソースを確保する実装と組み合わせると再レンダーのたびに破棄・再生成される（Phase 2 でこの不具合を出した）
  - hook 側は node を state で保持して耐性を持たせてあるが、無駄な付け直しは残る。memo 化された `useComposedRefs` でまとめると付け直し自体が無くなる
  - `useDrag` / `useWheel` / `useDragWithElement` が返すコールバックは `useState` の setter なので安定しており、`useComposedRefs` の依存として問題ない
  - 付け直しが起きないことを `__tests__/util/composeRefs.test.tsx` で検証している
- [x] `_util/type.ts` の `Override` を削除。利用箇所は `Knob/SVGRoot.tsx` の 1 箇所のみ。Observer 系の削除で他は消えた

### 5.4 Knob の描画を修正

`ActiveLine` / `InactiveLine` は `viewBox="0 0 100 100"` の中で半径 50 の円弧を描いているが、`strokeWidth` が既定 6 のため線の太さの半分（3）が viewBox からはみ出る。これを `overflow: visible` で誤魔化している。

- [x] 円弧の半径を `strokeWidth / 2` だけ内側に取り、viewBox 内に収める
- [x] `SVGRoot` の `style.overflow = 'visible'`、`index.css` の `.tremolo-knob` と `.tremolo-knob-active-line` の `overflow: visible` を削除
- [x] `SVGRoot` の `overflowVisible` prop（宣言されているが未使用）を削除
- [x] `strokeWidth` は利用者が変更できるため、半径の計算は実際の `strokeWidth` から導く必要がある。現状 `ActiveLine` / `InactiveLine` がそれぞれ既定値を持っているので、context に集約するか検討する

**対応済み。** context に集約するのではなく、逆にストアから座標（`x1`〜`y4`）を外し、角度（`r1`〜`r4`）だけを持たせる形にした。`ActiveLine` と `InactiveLine` は別々の `strokeWidth` を取れるため、座標をストアで先に計算すると太さを反映できないため。座標は `pointOnArc(angle, radius)`、半径は `arcRadius(strokeWidth)` で各コンポーネントが求める。

あわせて `SVGRoot` の props から未使用の `block` / `overflowVisible` を削除した。`block` は destructure されておらず、渡すと不正な属性として `<svg>` に流れる状態だった。

### 5.5 Piano のアーキテクチャ再検討 — Phase 4 の一部

Phase 4 の Piano 対応と一体で進める。

- [ ] `usePianoDrag` を `createDragValue` ベースに置き換える。`useDragWithElement` との差は「pointerdown で発火するか」だけで、Phase 2 で入れた `updateOnPointerDown` オプションで吸収できる見込み
- [ ] `index.tsx:193` の TODO を消化する。「単一ポインタは useDrag で対応可能だが、マルチタッチには TouchEvent が必要」とあるが、**Pointer Events は `pointerId` で複数ポインタを区別できるため、TouchEvent は不要**。コアに複数ポインタ対応のプリミティブを足す
- [ ] `index.tsx:238` の `// FIXME`（内容が書かれていない）が何を指すか特定する
- [ ] `keyboardShortcuts.ts:3` の TODO
- [ ] 鍵盤の当たり判定（`getHitKeyIndex`）が座標計算とコンポーネント描画に密結合している点を見直す

### 5.6 サブコンポーネントの配置ミスを検出する

children をそのまま描画する形（Phase 2.5）にしたことで、**サブコンポーネントを間違った階層に置いても型エラーにも実行時エラーにもならず、レイアウトだけが静かに壊れる**ようになった。

実例: `combined/VolumeFader` は `<Slider.Thumb>` が `<Slider.Track>` の兄弟のまま残っており、Thumb の `position: absolute` の基準が最も近い配置済み祖先である body になって崩れていた。ビルドもテストも通っていた。

- [ ] `Slider.Track` が「Track の中にいる」ことを示す context を張り、`Slider.Thumb` がそれを見つけられなければ開発ビルドで警告を出す
- [ ] `XYPad.Area` / `XYPad.Thumb` も同様
- [ ] `Knob.SVGRoot` と `ActiveLine` / `InactiveLine` / `Thumb` も同じ関係にあるので対象に含めるか検討する
- [ ] 本番ビルドでは警告のコードごと落とす（`process.env.NODE_ENV !== 'production'` で囲う）

Radix UI も同種の親子チェックを持っている。合成を自由にした代償なので、セットで入れておくのが望ましい。

### 5.7 MIDI の作り込み

Phase 1 で `@tremolo-ui/dom` へ移した部分。移植は「React hook のロジックをそのまま移す」ことを目的にしたので、機能面は当時のままになっている。

- [ ] **対応するイベントを増やす。** 現在 `createMIDIInput` が扱うのは note on / note off / pitch bend の 3 つだけ（`packages/dom/src/midi/input.ts`）。control change やその他のメッセージをどこまで扱うか決める
- [ ] **`createMIDIAccess` のエラーハンドリング方針を決める。** 現在は `NOT_SUPPORTED` / `PERMISSION_DENIED` の 2 値に潰している（`packages/dom/src/midi/access.ts`）。デバイスの着脱（`statechange`）や、権限を後から許可された場合の扱いを含めて整理する

### 5.8 Knob で対数スケールのときに値が飛ぶ

**dom への移行前から知られている問題。** `skew` を設定した Knob をドラッグすると、見た目の値がジャンプすることがある。

- [x] 再現条件を特定する（`skew` と `step` の組み合わせ、どの値域で起きるか）
- [x] 直し方を決める（下記の A / B / C）
- [x] 直して回帰テストを入れる

**対応済み。** `skew` を廃止し、`Scale` インターフェースと 5 つのプリセットに置き換えた（下記「対応した内容」）。

#### 調査結果

**当初の仮説（`step` で丸めた値から正規化し直すと原点がずれる）は外れ。** `relativeMapping` の `origin` はドラッグ開始時に 1 度だけ取り、以降は `state.y`（開始からの**総**移動量）に対して `origin + y / pixelRange` を計算するので、ドラッグ中に丸め誤差は蓄積しない。5px 上げてから 5px 下げると元の値へ正確に戻る（レンジの端で飽和していない限り）。

**原因は `skew` の定義そのもの。** `normalizeValue` / `rawValue` は `value - min` に対する冪乗則で、

```
position(value) = ((value - min) / (max - min)) ^ skew
value(position)  = min + (max - min) * position ^ (1 / skew)
```

`value(position)` の微分は `position = 0` で発散する（`skew > 1`）か 0 になる（`skew < 1`）。ノブの回転角は `position` に比例する（`calcAngles` も同じ `normalizeValue` を使う）ので、**レンジの下端では 1px の回転が巨大な値変化、または完全な無変化になる。**

`pixelRange = 100`（全 travel が 100px）での 1px あたりの値変化:

| 設定 | skew | 下端 | 中央 | 上端 |
| --- | --- | --- | --- | --- |
| dB `-60..6` / center `-12` | 2.177 | **7.96 dB** | 0.44 dB | 0.30 dB |
| freq `20..22000` / center `663` | 0.196 | **0.00 Hz** | 68 Hz | **1097 Hz** |
| linear `0..100` | 1 | 1.00 | 1.00 | 1.00 |

- `skew > 1`: 最小値から 1px 動かすとレンジの 12% が飛ぶ。これが報告されている「ジャンプ」
- `skew < 1`: 逆に下端が不感帯になる。`min=20 / step=1` では 13px 動かして初めて 21Hz になり、そこから急加速する

**あわせて見つかった構造的な問題: 冪乗則が `value - min` に掛かるため、対数スケールになっていない。** 20Hz–22kHz のノブで最初の 1 オクターブ（20→40Hz）が travel の 25% を占め、残り 9 オクターブが 75% に押し込まれる。真の指数スケール `min * (max / min) ^ position` なら 1 オクターブ = 9.9px で均等になる。

| | 20→40 | 40→80 | 80→160 | … | 10240→20480 |
| --- | --- | --- | --- | --- | --- |
| 現行（`skew`） | 25.3px | 6.1px | 5.7px | … | 12.6px |
| 指数スケール | 9.9px | 9.9px | 9.9px | … | 9.9px |

**Knob 固有ではない。** `AxisOptions` は Slider / XYPad も通るので同じ曲線になる。Knob で目立つのは `pixelRange = 100` により 1px の重みが大きいため。また `0e95f89^`（Phase 2.5 以前）の Knob も `normalizeValue` で origin を取り `rawValue(origin - y / 100)` を計算しており、**算術は dom 移行前と完全に同一**。計画本文の「移行前から知られている問題」と整合する。

#### 他フレームワークの値マッピング調査

`skew` は JUCE の `NormalisableRange` を参照して実装したものだが、**冪乗則 skew を持つのは JUCE 系だけで、他のエコシステムでは真の指数写像が主流**だった。

**(1) 冪乗則（tremolo-ui の `skew` と同型）**

| | 式 | 備考 |
| --- | --- | --- |
| JUCE `NormalisableRange` | `pow(p, skew)` / `exp(log(p) / skew)` | `setSkewForCentre` = `log(0.5) / log((centre - start) / (end - start))`。**tremolo-ui の `normalizeValue` / `rawValue` / `skewWithCenterValue` は式まで完全に一致する移植** |
| iPlug2 `ShapePowCurve` | `min + pow(p, mShape) * (max - min)` | 指数が逆数の取り方（`mShape == 1 / skew`） |

**(2) 真の指数写像 `min * (max / min) ^ p`** — こちらが web / DSP 側の主流

| | 式 | min の扱い |
| --- | --- | --- |
| iPlug2 `ShapeExp` | `exp(log(min) + p * log(max / min))` | `min <= 0` なら `1e-8` にクランプ |
| SuperCollider `ExponentialWarp` | `(max / min) ** p * min` | 「minval と maxval は両方非ゼロで同符号」とソースにコメント |
| Faust `[scale:log]` (`LogValueConverter`) | log 空間で線形補間 | `max(DBL_EPSILON, min)` でガード |
| webaudio-controls (`log` 属性) | `log(value / min) / log(max / min)` | ガードなし |
| Web Audio API `exponentialRampToValueAtTime` | — | 正の値のみ（仕様上の制約） |

**(3) 端が縮退しない第 3 の系統** — SuperCollider `CurveWarp`: `value(p) = b - a * e^(curve * p)`（`a = range / (1 - e^curve)`, `b = min + a`）。エンベロープのカーブと同じ族で、**`min = 0` や負値でも使え、両端の微分が有限**。tremolo-ui は `min` に符号の制約を置いていないので、指数写像より素直に嵌まる可能性がある。

**(4) 非対応** — NexusUI の Dial、HTML `<input type="range">`、Radix / Base UI の Slider は線形のみ。

**結論: `skew` の仕様自体は一般的で、問題は「冪乗則しか無いこと」。** JUCE も iPlug2 も冪乗則は複数ある写像の 1 つに過ぎず、必ず脱出口が併設されている。

- JUCE: `NormalisableRange` に `convertFrom0To1Function` / `convertTo0To1Function` のラムダを渡せる。加えて `symmetricSkew`（中央から両端へ skew を掛ける対称版）を持つ
- iPlug2: `ShapePowCurve` と `ShapeExp` が並列

tremolo-ui は冪乗則だけを移植したため、対数スケールが必要な場面で逃げ道が無い。

#### ドラッグ感度の既定値が JUCE の 2.5 倍

JUCE の rotary ドラッグは

```cpp
newPos = owner.valueToProportionOfLength (valueOnMouseDown)
           + mouseDiff * (1.0 / pixelsForFullDragExtent);
```

で、`relativeMapping` と**アルゴリズムまで同一**。ただし `pixelsForFullDragExtent` の既定は **250px**、tremolo-ui の `pixelRange` は **100px**。1px あたりの飛び幅がそのまま 2.5 倍になっている（dB ノブ下端の 7.96 dB/px は 250px なら 3.2 dB/px）。

#### 直し方の選択肢

- **A. 曲線を差し替え可能にする（推奨）。** `AxisOptions` に写像を足す。JUCE のラムダ、iPlug2 の `Shape`、SuperCollider の `Warp` と同じ構造で、`createDragValue` の `axis`（0-1 の位置 → 値）がちょうどその差し込み口になっている。候補は真の指数写像（`min > 0` が前提）と `CurveWarp` 型（符号の制約なし）。`KnobProps` の `skew?: number // | SkewFunction // TODO` は元々この方向を示している。`@tremolo-ui/functions` の `normalizeValue` / `rawValue` は公開 API なので、置き換えではなく追加にする
- **B. 端の劣化だけ緩和する。** 下端付近で実効ステップに下限を設ける等。対症療法で、曲線が対数でない問題は残る
- **C. 仕様として文書化する。** JUCE / iPlug2 の冪乗則と同じ特性であることを明記し、`min` を 0 に近づけないよう案内する
- ~~**D. `pixelRange` の既定を 100 → 250 にする（JUCE に合わせる）。**~~ → **採用しない。** 既定の操作感を変えるだけで 5.8 の原因には触れないため

**A で進める。** B / C / D は採らない。

#### 対応した内容

`@tremolo-ui/functions` に `Scale` インターフェースと 5 つのプリセットを追加し、`skew`（`AxisOptions.skew` と Slider / Knob / XYPad の `skew` prop）を **`scale` に一本化**した。

```ts
export interface Scale {
  normalize: (value: number, min: number, max: number) => number
  denormalize: (position: number, min: number, max: number) => number
}
```

| プリセット | 用途 |
| --- | --- |
| `linearScale`（既定） | 値が既に知覚と線形なもの。dB 値、パン、%、MIDI ノート番号 |
| `exponentialScale` | 比率が意味を持つもの。周波数、フリーランのレート、ディレイタイム。`min`/`max` が非ゼロ同符号であることが必須 |
| `curveScale(curve)` | 汎用テーパー。`min = 0` や 0 をまたぐレンジで使える。`curve > 0` で下端が細かく、`curve < 0` で上端が細かい。`curveWithCenterValue()` と組み合わせる |
| `symmetricSkewScale(skew)` | 中央対称。双極性コントロールで 0 付近を細かくしたいとき（JUCE の `symmetricSkew`） |
| `skewScale(skew)` | JUCE `NormalisableRange` の冪乗則。**JUCE / iPlug2 のパラメータと数値を一致させる互換用。** `skewWithCenterValue()` はこれに対して使う |

**`min` / `max` を保持せず引数で受ける**設計にしたので、`Scale` は状態を持たずモジュールレベルの定数にできる。毎レンダー同じオブジェクトを渡してもコストがかからない。

判断:

- **冪乗則そのものは `skewScale` として残した。** JUCE を WebView で使うケースでは、C++ 側の `NormalisableRange` とノブ位置・オートメーション曲線を一致させる必要があるため。端の縮退も JUCE と同じままにしてある（それが互換の意味）。ドキュメントで「新規設計では `exponentialScale` / `curveScale` を薦める」と案内する
- **`normalizeValue` / `rawValue` から `skew` 引数を外し、線形の写像だけを担わせた。** `scale` に一本化した後、`skew` を渡していたのは `skewScale` だけで、他の呼び出し箇所（`elementMapping` と `usePianoDrag` のピクセル正規化、`NumberInput`）は全て線形だった。曲がりは全て `Scale` 側に置き、この 2 つは公開 API の線形プリミティブとして残す。JUCE 互換の式（`pow` と `exp(log())`）は `skewScale` の中に移してある
- `skewWithCenterValue` も `math.ts` から `scale.ts` の `skewScale` の隣へ移した（挙動は変更なし）。これで `math.ts` に skew の概念が残らない

回帰テスト:

- `packages/functions/__tests__/scale.test.ts` — 5 つ全てについて往復・端点・単調性・範囲外クランプ・空レンジの拒否、各プリセット固有の性質
- `packages/dom/__tests__/pointer/scaleJump.test.ts` — 実際のドラッグ経路で 5.8 の症状を固定。`skewScale` は dB ノブの下端で 1px あたり 8dB 飛び、周波数ノブでは 12px 動かしても値が変わらない。`curveScale` / `exponentialScale` はどちらも起きない

`exponentialScale.normalize` / `curveScale.normalize` は**値をクランプしてから対数を取る**必要がある。範囲外の値では比が負になり、`Math.log` が NaN を返すため（位置をクランプしても手遅れ）。テストで固定してある。

#### フォローアップ: `Slider.Scale` → `Slider.Marks` に改名する

**`Scale` 型と `Slider.Scale`（目盛りを描くサブコンポーネント）で名前が衝突している。** `<Slider.Root scale={…}><Slider.Scale/></Slider.Root>` は紛らわしい。

**`Slider.Marks` へ改名することで決定。対応は別 PR で行う。** 本 PR では `Slider/index.tsx` の `type Scale as ValueScale` による回避に留めてある。

改名時に触る必要があるもの:

- `src/components/Slider/Scale.tsx` → `Marks.tsx`（`ScaleProps` → `MarksProps`）
- `ScaleOption.tsx` → `MarksOption.tsx`（`ScaleOptionProps` / `ScaleOptions` / `ScaleType` も同様）
- `Slider` の namespace オブジェクトと `src/index.ts` の re-export
- `index.css` の `.tremolo-slider-scale*` クラス名、`packages/react/package.json` の `exports`
- `__stories__` / `__tests__` / `site/docs` の参照
- 改名後は `Slider/index.tsx` の `type Scale as ValueScale` を素の `Scale` に戻せる

## 6. 既存コードで見つかった問題

### 6.1 `useDrag` の delta 計算バグ（実バグ）→ **Phase 2 で修正済み**

`packages/react/src/hooks/useDrag.ts`

```ts
if (dragOffsetX.current) {
  deltaX = screenX - dragOffsetX.current
  dragOffsetX.current = screenX
}
```

`dragOffsetX.current` は `undefined` で初期化され、`pointerdown` で `event.screenX` が代入される。**`screenX` が 0（画面左端）だと truthy チェックが false になり、その軸の delta が常に 0 のままになる。** 一度 0 になると更新もされないためドラッグ中ずっと回復しない。Y 軸（画面上端）も同様。

さらに両軸とも 0 の場合、直後の

```ts
if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) return
```

で早期 return するため、`onDrag` 自体が一切呼ばれなくなる。

修正: `!== undefined` で判定する。なお現行コードは `pointerup` で `undefined` に戻すことで「ドラッグ中か」の判定も兼ねているため、`!== undefined` にすればその役割は維持される。コア化時に明示的な `dragging` フラグへ分離するのが望ましい。

### 6.2 `useDrag` のイベント混在（設計上の問題）→ **Phase 2 で解消済み**

`pointerdown`（React 合成イベント）で開始し、移動は window の `mousemove` と要素の `touchmove` を購読、終了は window の `pointerup`。pointer 系と mouse/touch 系が混在している。

ブラウザはペン入力に対して互換マウスイベントを発火するため直ちに壊れるとは限らないが、保守上は Pointer Events への統一が望ましい。`useDragWithElement` は `pointermove` で統一されており、そちらが正しい形。

### 6.3 確認事項（バグとは断定していない）

- ~~`packages/react` の `@tremolo-ui/functions` 依存が `^0.1.6`、実バージョンは 0.2.0~~ → **調査済み・修正済み（意図的ではない）**。0.1.6 のリリースでは `^0.1.5 → ^0.1.6` に更新できているが、0.2.0 のリリース（`86e43e7`）ではバージョンしか上がっていない。publish.sh の `npm i "@tremolo-ui/functions@$NEW_VERSION"` は、その時点でまだ npm に存在しないバージョンを指定するため、レンジ更新が成立しないことがある（`.npmrc` の `min-release-age` は 0.2.0 より後に追加されたので原因ではない）。結果として npm 上の `@tremolo-ui/react@0.2.0` は `@tremolo-ui/functions@^0.1.6` に依存している。ただし functions の v0.1.6→0.2.0 の差分は JSDoc の `@category` タグ削除のみで公開 API は同一のため、実害は出ていない。changesets の `updateInternalDependencies` はローカルのバージョンを見て書き換えるため、この不具合は構造的に解消される
- 両パッケージのトップレベル `"types": "dist/index.d.cts"` が CJS 用の宣言ファイルを指している。`exports` マップ側は require/import で正しく分岐しているため実害は出にくいが、`exports` を見ない古いツールチェーンでは ESM 利用者に CJS の型が渡る。`@arethetypeswrong/core` が devDependencies に入っているので、それで検証するとよい

## 7. 検証状況

**リポジトリを読んで確認済み**: パッケージ構成、両 package.json の依存と exports、`@tremolo-ui/functions` の全公開関数、コンポーネント/hooks の一覧とファイル構成、5つの zustand ストアの `State` 型、`useDrag` / `useDragWithElement` / `useRefCallbackEvent` / `DragObserver` / `WheelObserver` の全文、`PointsEditor/Point.tsx` の前半、`scripts/publish.sh`、`.github/workflows/release.yml`、ルート `package.json`

**未確認**: `AnimationCanvas`（`index.tsx` / `canvas.ts`）、`Piano/index.tsx` と `usePianoDrag`、`Slider/index.tsx`、`XYPad/index.tsx`、`Knob/index.tsx` の本体、`NumberInput/InternalInput.tsx`、各 CSS、テストの実態、`site/` 配下

上記の未確認ファイルは Phase 3〜4 の対象であり、着手時に読む必要がある。特に Piano と AnimationCanvas は本計画で内部を確認していないため、工数見積もりは暫定。

## 8. changesets への移行

`scripts/publish.sh` + タグ駆動 release.yml を廃止し、changesets に置き換える。dom / vue / svelte を追加していく前提では、依存範囲の更新と CHANGELOG 生成が自動化される利点が大きい。**Phase 1 より前に完了させること。**

### 8.1 挙動の変化

| | 現行 | changesets |
| --- | --- | --- |
| バージョン決定 | `publish.sh patch` を手で実行 | 変更ごとに `.changeset/*.md` を追加、集約して自動決定 |
| リリーストリガ | `v0.2.0` タグの push | main への push → "Version Packages" PR → **その PR のマージ** |
| タグ | 単一の `v0.2.0` | パッケージごと（`@tremolo-ui/react@0.3.0` 等） |
| CHANGELOG | なし（site 側に手書き） | 自動生成 |

タグ形式が変わるため、`release.yml` のトリガを `on: push: tags:` から `on: push: branches: [main]` に変更する必要がある。

### 8.2 設定

```jsonc
// .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/changelog-github",  // または "@changesets/cli/changelog"
  "commit": false,
  "fixed": [["@tremolo-ui/*"]],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

- **`fixed`**: グループ内の全パッケージが常に同じバージョンになり、変更がないパッケージも一緒に bump / publish される。これは現行 publish.sh の挙動と同じ。`linked` は「changeset があるパッケージのみ publish」なので**要件に合わない**
- **`access: "public"`**: デフォルトは `restricted`。scoped パッケージなので必須（各 package.json の `publishConfig.access: "public"` は残しておく）
- ルートの `package.json` と `site` は `private: true` なので、デフォルト設定では対象外になる

### 8.3 0.x でのバージョン運用

破壊的変更を入れつつ 0.x に留まりたいので、**破壊的変更でも `major` ではなく `minor` を選ぶ運用**にする。

**検証済み**（`changeset version` をローカルで空打ちして確認）:

| changeset の種類 | functions | react | react の functions 依存 |
| --- | --- | --- | --- |
| `major` | 0.2.0 → **1.0.0** | 0.2.0 → **1.0.0** | `^0.2.0` → `^1.0.0` |
| `minor` | 0.2.0 → 0.3.0 | 0.2.0 → 0.3.0 | `^0.2.0` → `^0.3.0` |

`major` は 0.x を維持せず 1.0.0 になる。また `fixed` が効いており、changeset を付けたのが react だけでも functions が同時に bump され、内部依存のレンジも自動で更新される。

### 8.4 OIDC (trusted publishing) との組み合わせ — 要注意

`changeset publish` は内部で npm の publish を呼ぶため OIDC 自体は機能するが、既知の落とし穴が2つある。

1. **npm CLI 11.5.1 未満だと、認証エラーではなく誤解を招く `E404 Not Found` が返る。** 現行 release.yml の `npm install -g npm@latest` は維持すること
2. **changesets/action + scoped パッケージ + OIDC で E404 になる報告がある**（npm/cli#8976、2026年2月時点で open）。移行後の初回リリースで失敗した場合は、この既知問題を疑う。回避策は npm Automation トークン（`NODE_AUTH_TOKEN`）へのフォールバック

また、trusted publishing は **npm 上にパッケージが既に存在しないと設定できない**。`@tremolo-ui/dom` / `vue` / `svelte` は、いずれも初回だけローカルから手動 publish する必要がある。

npm 側の trusted publisher 設定はワークフローの**ファイル名**に紐づく。`release.yml` という名前を維持すれば既存2パッケージの設定を変更せずに済む。changesets/action は version PR 作成と publish を同一ワークフローで行うため（changesets/action#515）、ワークフローを分割したくなるが、分割すると npm 側の再設定が必要になる点に注意。

### 8.5 タスク

- [x] `@changesets/cli` を devDependencies に追加し `npx changeset init`
- [x] `.changeset/config.json` を上記の内容に設定（この時点では `fixed` は functions / react のみ）
- [x] `scripts/publish.sh` を削除
- [x] `release.yml` をトリガ変更 + `changesets/action` に置換。ファイル名は `release.yml` のまま維持
- [x] `permissions` に `contents: write` と `pull-requests: write` を追加（version PR の作成に必要）。`id-token: write` は維持
- [x] `npm install -g npm@latest` のステップは維持
- [x] CONTRIBUTING に changeset の追加手順を記載
- [x] `packages/react` の `@tremolo-ui/functions": "^0.1.6"` を実バージョンに合わせて修正してから移行する（ずれたまま移行すると `updateInternalDependencies` の挙動が読みにくくなる）
- [x] ダミーの patch changeset で 1 リリース通し、CHANGELOG・タグ・npm 上のバージョンを確認

**移行完了（0.2.1 で実リリース済み）。** 確認できたこと: `fixed` により changeset を付けていない functions も同時に bump / publish される / 内部依存レンジが `^0.2.1` に自動更新され、旧 publish.sh のレンジずれが解消 / タグは `@tremolo-ui/<pkg>@0.2.1` のパッケージ単位に変化 / CHANGELOG はコミットリンクと貢献者付きで生成 / **OIDC trusted publishing は問題なく動作し、7.4 の既知問題（E404）は踏まなかった**（公開物に SLSA provenance が付いている）。
