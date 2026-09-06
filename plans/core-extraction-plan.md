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
2. ~~**NumberInput の扱い**~~ → **Phase 4.1 で決定。Root が持つ state は編集中の draft 1 つだけで、他はレンダー中に導出する**（制御コンポーネント衝突・カーソル位置維持・IME 中間文字列はこれで構造的に解消される）
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

- [x] AnimationCanvas → **4.2** で完了
- [x] NumberInput → **4.1** で完了
- [x] Piano → **4.3** で完了（[5.5](#55-piano-のアーキテクチャ再検討--phase-4-の一部) と一体）

#### 4.3 Piano の再設計

**compound component をやめる。** Phase 2.5 の形（children をそのまま描画）に揃えるのではなく、逆方向に倒す。`WhiteKey` / `BlackKey` / `KeyLabel` を削除し、`Root` が鍵盤を描く。per-key の customize は `keyProps` / `label` の 2 つのコールバックで受ける。

##### 現行の何が成立していないか

| | 内容 |
| --- | --- |
| Key が無いと鳴らない | `onPlayNote` を呼ぶ唯一の場所が `KeyImpl` の `useImperativeHandle`（`key.tsx:90`）。`Root` は `keyRefs.current[i].current.play()` 経由でしか鳴らせない |
| 幾何が二重管理 | `Root` の `notePosition` / `getHitKeyIndex` は自前の `whiteNoteWidth` と定数 `blackPerWhiteWidth = 0.65` / 高さ比 `0.6` で計算する（`index.tsx:155,166,182,183`）が、Key は自分の `width` / `height` prop で描画する（`key.tsx:125-127`）。既定値が一致しているだけで、`<Piano.WhiteKey width={60}>` と書くと**描画だけ 60 になり、位置と当たり判定は 40 のまま**になる |
| 死んでいる prop | `PianoProps.blackNoteWidth`（`index.tsx:58`）はどこでも destructure されず、`...props` 経由で `<div>` に不正な属性として流れる。5.4 の `SVGRoot` の `block` と同種 |
| ref が children の並び順に結合 | `React.Children.map` の index で ref を割り当てる（`index.tsx:129`）ため、children をラップしたり並べ替えると note と ref がずれる |
| ref を毎レンダー作り直す | `keyRefs.current[i] = createRef()` をレンダー本体で実行している（`index.tsx:107-109`） |

一方で `WhiteKey` / `BlackKey` が実際に提供しているのは `bg` / `activeBg` などを CSS 変数としてインラインで書くことだけで、色は既に `index.css` の `.tremolo-piano-white-key` / `.tremolo-piano-black-key` と `--bg` / `--active-bg` で完結している。**上記 5 つを抱える対価に見合っていない。**

##### 決めたこと

- **`Piano = { Root }` にする。** 名前空間オブジェクトの形は他コンポーネントと揃えたまま残す
- **`Root` は children を取らない。** 鍵盤の数は `noteRange` 可変なので、Slider のように children で書かせると最小構成が map のボイラープレートになる
- **幾何は `Root` だけが持つ。** `whiteKeyWidth` / `blackKeyWidthRatio` / `blackKeyHeightRatio` / `keyGap` / `fill` / `height`。`blackNoteWidth` は削除
- **per-key の customize は 2 つのコールバック。** 内容は `label`、見た目と属性は `keyProps`

  ```ts
  export interface KeyState {
    index: number
    keyType: 'white' | 'black'
    active: boolean
    disabled: boolean
  }

  label?: (note: number, state: KeyState) => ReactNode
  keyProps?: (note: number, state: KeyState) => ComponentPropsWithoutRef<'div'>
  ```

  `label` は現行の `(note, index)` から**シグネチャが変わる破壊的変更**（`(_, i) => keys[i]` → `(_, { index }) => keys[index]`）。似た 2 つのコールバックで引数の形が違うのを避けるため揃える。

- **`keyProps` の style は幾何を上書きできない。** `style={{ ...userStyle, left, width, height }}` の順にマージする。per-key コンポーネントに `width` を持たせるのとの決定的な違いがここで、上表の「幾何が二重管理」が構造的に起きなくなる。`className` は `clsx('tremolo-piano-white-key', userClassName)`
- **鍵盤の DOM に `data-note` / `data-note-key` を出す。** 「全部の C だけ濃く」のような静的な条件は CSS だけで済み、コールバックが要らなくなる

  ```html
  <div class="tremolo-piano-white-key" data-note="60" data-note-key="C"
       data-active="true" aria-disabled="false" style="left: …; width: …">
  ```

- **スケールのハイライトは `keyProps` で書く。** 「D メジャーに含まれる 7 つのピッチクラス」は JS の集合であって CSS のセレクタでは計算できないため、静的な CSS だけでは書けない。逆に compound にしても全鍵盤を手で map し直すことになるので、props を返す関数 1 つが最小の解になる

  ```tsx
  keyProps={(note) => ({ 'data-in-scale': inScale(note, root, 'major') })}
  ```

  そのための音楽的スケールを `functions` の `midi.ts` に足した（`scaleIntervals` / `ScaleName` / `inScale` / `scaleNotes`）。**`scales.ts` には入れない。** あちらの `Scale` は値の分布カーブ（`linearScale` / `exponentialScale`、Slider / Knob の `scale` prop）で、同じ語が 2 つの意味を持つのを避けるため。`midi.ts` なら `noteKey` / `noteName` / `noteToFrequency` の隣で、typedoc のページも増えない

- **`renderKey` のような「鍵盤を丸ごと差し替える」入口は作らない。** `label`（content）と `keyProps`（style / 属性）で per-key の需要は埋まる
- **`label` が空文字を返したら描画しない。** `undefined` と同じ扱いにする。`SHORTCUTS.HOME_ROW_NATURAL` は黒鍵の枠を `''` で埋めるので、`label={(_, { index }) => keys[index]}` がそのまま書けないと空のラベル枠が黒鍵に並ぶ

##### キーボードショートカット

`KeyboardShortcuts.keys` は `noteRange.first` からの半音単位の配列で、消費側は `keys.indexOf(e.key)` だけ（`index.tsx:250,261`）。`KeyboardEvent.key` が空文字になることは無いので、**`''` を置いた位置はショートカット無しになる**。

宣言だけで未実装だった `flags.naturalOnly` を削除し、この規則で白鍵だけを鳴らす `SHORTCUTS.HOME_ROW_NATURAL` を足した。黒鍵の位置を `''` で埋めてあるので、`HOME_ROW` と要素の位置が揃う。どちらも `noteRange.first` が C であることを前提にする（元からの前提）。

##### 発音状態を `Root` へ移す

`activeNotes` を `Root`（正確には後述の `createPianoInput`）が持ち、**ポインタ / キーボードショートカット / `PianoMethods.playNote`（MIDI）の 3 経路が全部そこへ集まる**形にする。Key は状態を持たない表示専用になり、「Key が無いと鳴らない」が構造的に解消する。

- **同じ note を複数の source が押さえうるので、source 単位で数える。** マルチタッチでは、ある指が押さえている鍵盤へ別の指がグリッサンドで乗ることがある。`note → Set<source>`（source は `pointerId` / キーボードのキー / `'api'`）で持ち、**source が 0 になったときだけ `onStopNote` を撃つ**
- `KeyMethods`（`play` / `stop` / `played`）は公開 API から削除する。`keyRefs` と `createRef` のループも消える
- `PianoMethods`（`playNote` / `stopNote`）は残す。Web MIDI API の story がこれを使っている

##### なぜ `createDragValue` を使わないか

**旧 5.5 の「`useDragWithElement` との差は pointerdown で発火するかだけで、`updateOnPointerDown` で吸収できる」は誤り。** 2 段階で成立しない。

1. **`createDrag` が単一ポインタ固定。** `drag.ts:130` の `if (pointerId !== null) return` が 2 本目以降の pointerdown を捨てる。ドラッグ状態（`startX` / `lastX` / `moveTarget` / `previousCursor`）も全てインスタンス単位のスカラーで、複数ポインタを保持できない
2. **それを直しても `createDragValue` の意味論が合わない。** `createDragValue` は「位置 → `AxisOptions`（min / max / step / scale）を通したスカラー値」であり、Piano が要るのは x, y → 鍵盤の当たり判定。12 半音が白鍵 7 つ分の幅に乗るので note は x に対して等間隔ではなく、さらに黒鍵は白鍵に**重なる**（y も見て黒鍵を先に判定する必要がある。現行 `getHitKeyIndex` が `[...blackNotes, ...whiteNotes]` の順で走査しているのがこれ）。`axis: { min: first, max: last, step: 1 }` で通すと単に違う鍵盤が鳴る

`updateOnPointerDown` が吸収するのは発火タイミングだけで、マッピングと複数ポインタは別の問題。

##### パッケージ配置

| 出すもの | 行き先 | 備考 |
| --- | --- | --- |
| 鍵盤の幾何（`notePosition` / `pianoWidth` / `noteAt`） | **`@tremolo-ui/functions`**（`piano.ts`） | DOM 非依存の純関数。`isBlackKey` / `noteKey` の隣。Vue / Svelte からも要る |
| 複数ポインタ対応 | 既存の `createDrag` に `multiPointer` を足す | 下記 |
| ポインタ入力と発音状態 | **`@tremolo-ui/dom`**（`createPianoInput`） | 下記 |
| `<div>` の描画・キーボードショートカット | `@tremolo-ui/react` | |

`functions` に `piano.ts` を足すと typedoc の entryPoints が拾う。`unit.ts` で踏んだ「ファイル名の H1 と同名 export の見出しで slug が衝突する」を避けるため、`piano` という名前の export は作らない。

```ts
// packages/functions/src/piano.ts
export interface PianoLayout {
  noteRange: { first: number; last: number }
  whiteKeyWidth: number
  /** @default 1 */
  keyGap?: number
  /** @default 0.65 */
  blackKeyWidthRatio?: number
  /** @default 0.6 */
  blackKeyHeightRatio?: number
}

export function notePosition(note: number, layout: PianoLayout): number
export function pianoWidth(layout: PianoLayout): number
/** 黒鍵を先に判定する。どの鍵盤でもなければ null */
export function noteAt(x: number, y: number, height: number, layout: PianoLayout): number | null
```

これで 5.5 の「当たり判定が座標計算とコンポーネント描画に密結合している」が解ける。

##### `createDrag` の `multiPointer`

新しい `createMultiDrag` は作らない。managed styles・`selectstart` の抑制・pointer capture・capture 失敗時の window フォールバックを二重管理したくないため、`createDrag` を拡張する。

- 内部のスカラー群を `Map<pointerId, { startX, startY, lastX, lastY, moveTarget }>` に置き換え、**単一ポインタは「上限 1 の同じ Map」として同一経路にする**
- `DragState` に `pointerId` を追加する
- `multiPointer` は生成時固定（`createAnimationCanvas` の `relativeSize` と同じ扱い）。ドラッグ中に切り替わる意味が無い
- 既定 `false` なので既存の挙動は変わらない。`cursor` は最初のポインタで適用し、最後のポインタが離れたら戻す

##### `createPianoInput`

```ts
createPianoInput(element, {
  layout: PianoLayout,      // update() で差し替え可
  glissando?: boolean,      // @default true
  midiMax?: number,
  onPlayNote?: (note: number, velocity?: number) => void
  onStopNote?: (note: number) => void
  onActiveNotesChange?: (notes: number[]) => void
})
```

`createDrag({ multiPointer: true })` + `noteAt` の上に、**pointerId → 今押さえている note** と **note → Set\<source\>** を持つ層。glissando（移動で note が変わったら旧 note を stop → 新 note を play）とマルチタッチはここで完結する。

インスタンスは `noteOn(note, { source, velocity })` / `noteOff(note, { source })` を持ち、**キーボードショートカットと `PianoMethods.playNote` もここへ流す**。こうすると「今何が鳴っているか」の所有者が 1 つになり、Vue / Svelte も source 併合を書き直さずに済む。React は `onActiveNotesChange` を `setState` に繋ぐ。

##### 連鎖して片付くもの

- **`__width` / `__note` / `__label` が消滅。** CLAUDE.md が「残っているのは `Piano/key.tsx` と `Piano/KeyLabel.tsx` のみ」と書いている `__` prop が全滅する
- **Phase 5（zustand 除去）の Piano 分。** サブコンポーネントが無くなるので `Piano/context.tsx` ごと不要になり、置換ではなく削除で終わる
- **`index.tsx:238` の空 `// FIXME`。** `usePianoDrag` の呼び出しごと消える
- **`usePianoDrag` と `useRefCallbackEvent`。** 前者は不要になる。後者は `usePianoDrag` からしか使われていないので、`src/hooks/_internal/` から消せる（passive でないリスナが他に要らなければ）

##### タスク

- [x] `functions` の `midi.ts` に音楽的スケールを足した（`scaleIntervals` / `ScaleName` / `inScale` / `scaleNotes`）。major / naturalMinor / harmonicMinor / melodicMinor / 教会旋法 7 つ / majorPentatonic / minorPentatonic / blues / wholeTone / chromatic。`inScale` はオクターブ非依存、引数は `noteNumber` と `noteName` のどちらでも取れる（`isWhiteKey` などと同じ）
- [x] スケールハイライトの story（`ScaleHighlight`）を足した
- [x] `packages/functions/src/piano.ts` に `NoteRange` / `PianoLayout` / `getNoteRangeArray` / `notePosition` / `pianoWidth` / `blackKeyWidth` / `noteAt` を足した（テスト 12 件）。**白鍵の当たり判定は `keyGap` を含む slot 全体にした。** 旧実装は `whiteNoteWidth` だけで判定していたため、鍵盤の間に 1px のどこにも当たらない帯があった
- [x] `createDrag` に `multiPointer` を足した。内部のスカラーを `Map<pointerId, PointerState>` に、リスナは対象ごとに参照カウントで張る（同じ関数を 2 回 `addEventListener` しても 1 つなので、1 本目が離れた時点で 2 本目が死ぬのを防ぐ）。既存 19 件はそのまま通り、新規 7 件を追加
- [x] `packages/dom/src/piano/input.ts` に `createPianoInput` を実装した（テスト 16 件）。`note → Set<NoteSource>` と `pointerId → note` を持ち、`noteOn` / `noteOff` でキーボード・MIDI も同じ経路に入る
- [x] `Piano.Root` を書き直した。`key.tsx` / `KeyLabel.tsx` / `context.tsx` / `usePianoDrag.ts` / `useRefCallbackEvent.ts` を削除（`useRefCallbackEvent` は `usePianoDrag` からしか使われていなかった）
- [x] `keyProps` / `label(note, state)` / `data-note` / `data-note-key` を実装した。**`KeyAttributes` は `Record<`data-${string}`, ...>` との交差にする必要がある**（`data-*` は JSX 構文でだけ許され、オブジェクト型としては通らない。`keyProps` の主用途がこれなので必須）
- [x] `index.css` は変更不要だった。DOM 構造（キー → ラベル wrapper → ラベル）とクラス名・`data-active` / `aria-disabled` を維持したため
- [x] `keyboardShortcuts.ts` の `flags.naturalOnly`（宣言だけで未実装）を削除し、`SHORTCUTS.HOME_ROW_NATURAL` を足した
- [x] `HOME_ROW_NATURAL` の story（`NaturalShortcuts`）を足した
- [x] `Root` の label 描画で、`''` / `null` / `undefined` はラベルの枠ごと出さない（`0` はラベルとして残す）
- [x] `__tests__/Piano/index.test.tsx` を新設した（14 件）
- [x] `__stories__/Piano.stories.tsx` を書き直した（`Styling` は `keyProps` ベース）
- [x] `site/examples/components/piano/basic.tsx` を更新した（`index.mdx` は example を参照するだけなので変更不要）
- [x] `__stories__/combined/WavetableSynth/` を追随させた
- [x] 移行ガイドに載せる破壊的変更を milestone に追記した。changeset は `.changeset/olive-melons-shine.md`
- [x] ブラウザでの目視確認（マルチタッチ、グリッサンド、`fill` のリサイズ、`ScaleHighlight` の active 色）。jsdom ではポインタと `getBoundingClientRect` を偽装しているので実機での確認が要る

#### 4.2 AnimationCanvas

`createAnimationCanvas(canvas, options)` として `@tremolo-ui/dom` へ移した。React 側は「node を state で保持し、インスタンスを 1 回だけ作り、毎レンダー `update()` で最新のハンドラを流し込む」形で、`useDragValue` と同じ構造になっている。

`packages/react/src/components/AnimationCanvas/canvas.ts` は `packages/dom/src/canvas/context.ts` へ移動（`setDprConfig` → `applyDevicePixelRatio`、状態のコピーを `readDrawingState` / `writeDrawingState` に切り出し）。

##### 直したもの

いずれも移行前から存在したバグで、`packages/react/__tests__/AnimationCanvas/index.test.tsx` は**旧実装に対して実際に落ちる**ことを確認してある。

- **毎レンダーでアニメーションが再起動していた。** effect の依存に `draw` / `init` / `options` が入っており、これらはほぼ全ての利用箇所でインラインで書かれるため毎レンダー新しくなる。結果として 2D context・`ResizeObserver`・rAF ループが破棄・再生成され、`init` が繰り返し呼ばれ、`count` と `elapsedTime` が 0 に戻っていた。state を持つコンポーネント（メーター等）の隣では frame 0 から進めない
- **マウント後に `width` / `height` を変えても効かなかった。** effect の依存に入っていないため、canvas の属性だけが書き換わって DPR の transform が再適用されず、描画スケールが狂う
- **`relativeSize` の初回サイズだけ `parent.clientWidth`、以降は observer の `contentRect` だった。** 両者は親の padding 分ずれる。`ResizeObserver` は observe した時点で現在のサイズを通知するので、初回も含めて observer に一本化した

##### 決めたこと

- **`relativeSize` と `contextAttributes` はインスタンス生成時に固定。** 前者は `ResizeObserver` を張るかどうか、後者は context の生成に関わるため、`update()` では受け付けない（`createDragValue` の `mapping` と同じ扱い）
- **`animate` が false のとき、`update()` は 1 フレーム描く。** ループが止まっているので、リサイズと `update()` 以外に新しい描画を canvas へ出す手段が無い。ドキュメントの "Reactive Canvas"（`useState` + `animate={false}`）はこれで成立する。React 側は生成直後の 1 回だけ `update()` を飛ばし、マウント時に同じフレームを 2 度描かないようにしている
- **`options`（`contextAttributes`）は effect の依存に入れない。** インラインで書かれるとインスタンスが毎レンダー作り直されるため、ref 経由で生成時にだけ読む。マウント後の変更は効かない旨を prop の JSDoc に明記した
- **フリッカー抑制用の隠し `<canvas>` は DOM に描画しない。** コアが必要になった時点で `document.createElement` で作る。React 側は fragment が不要になり `<canvas>` 1 つだけを返す
- **サイズはコアが所有する。** React は `width` / `height` 属性を設定せず、`size` オプションとして渡す。これで属性の書き換えと DPR 設定の二重管理が無くなる
- **リサイズ時のスナップショットを解像度を落とさない形に直した。** 旧実装は memo canvas を `scale(1/dpr)` して書き込み、戻すときに context 側の `scale(dpr)` で拡大していた。dpr が打ち消し合うので位置と大きさは正しいが、**dpr > 1 では一度縮小してから拡大するため解像度が落ちていた**

  現在は memo を canvas と同じデバイスピクセル数で取り（`memo.width = canvas.width`、transform は identity なので等倍コピー）、戻すときは **CSS ピクセル座標系のまま「元の CSS サイズ」を指定して描く**（`context.drawImage(memo, 0, 0, previousWidth, previousHeight)`）。context は既に dpr 倍にスケールされているので、dpr が変わらなければデバイスピクセルの 1:1 コピーになり再サンプリングが起きない。dpr が変わった場合（ディスプレイ間の移動など）はフル解像度から 1 回だけ正しくリスケールされる

#### 4.1 NumberInput の再設計

現行の NumberInput は Chakra UI の Input を参考にしており、Phase 2.5 で Slider / Knob / XYPad を揃えた形とはアーキテクチャが違う。**破壊的変更を許容して作り直す。**

##### 現状の何が合っていないか

| 現状 | 問題 |
| --- | --- |
| `variant='outline' \| 'filled' \| 'flushed' \| 'unstyled'` | テーマ prop。5.1 の CSS ヘッドレス化で消える運命。他コンポーネントに対応物が無い |
| `activeColor` / `wrapperClassName` | `--active-color` は CSS 変数で足りる。`wrapperClassName` は Root が wrapper と input の両方を描くせい |
| `InternalInput` が非公開 | **Phase 2.5 で統一した「children をそのまま描画」に唯一従っていない。** children は Stepper 専用で、`<input>` は Root が勝手に描く |
| wrapper に `tabIndex={0}` / input に `tabIndex={-1}` | Tab でフォーカスが行くのは wrapper。テキスト入力なのに逆。`role="spinbutton"` も無い |
| `onChange(value: number, text: string)` | Slider / Knob は `onChange(value)`。引数が違う |
| `value: number \| string` | *Number*Input なのに string を受ける |
| `keepWithinRange` / `clampValueOnBlur` / `blurOnEnter` / `selectWithFocus` | Chakra から個別に持ってきた挙動 prop が 4 つ。責務の階層が混ざっている |
| zustand ストアが `value: string` を保持 + `useEffect(..., [props])` | Phase 2.5 で Slider / Knob から潰したのと同じ不具合（値が変わったフレームで古い値を返す）。`selectionStart` の手動復元というカーソル維持ハックも生んでいる |

##### 核心: テキストと値の所有権

これが「NumberInput は他と性質が違う」の正体。整理するとこうなる。

- **`value` は `number`。表示テキストは常に `format(value)` の派生。**
- **例外は「編集中」だけ。** タイプしている間の文字列（draft）は `value` の写しではなく、input の一時的な state。

つまり **Root が持つ state は draft 1 つだけ**で、他は全部レンダー中に導出できる。

```
Root の state:  draft: string | null      // null = 非編集
表示テキスト:    draft ?? format(value)
```

| 入力源 | draft | onChange |
| --- | --- | --- |
| タイプ | `draft = text` | `parse(text)` が有限なら発火。**clamp しない**（`max=100` で "1500" が打てなくなるため） |
| blur / Enter | `draft = null` | `clampValue` なら clamp して発火 |
| Stepper / wheel / keyboard / drag | `draft = null` | clamp 済みの値で発火 |

draft が必要な理由は 2 つ。(1) `value=1500` / `units=[['Hz',1],['kHz',1000]]` のとき、"15" とタイプした瞬間に `format` が走ると画面が "15Hz" に書き換わって続きが打てない。(2) `"1."` `"-"` `""` は parse できない/しても値が変になる中間状態で、それを保持する場所がどこかに要る。

これにより `selectionStart` の手動復元も IME 中間文字列の問題も構造的に消える。他は全てレンダー中の導出になるので、**zustand は Phase 5 を待たずにこの作業で落ちる**（Phase 2.5 と同じ React context へ）。

##### 新しい API

```jsx
<NumberInput.Root value={v} min={0} max={100} units="Hz" onChange={setV}>
  <NumberInput.InputField />
  <NumberInput.Stepper>
    <NumberInput.IncrementStepper />
    <NumberInput.DecrementStepper />
  </NumberInput.Stepper>
</NumberInput.Root>
```

```ts
export interface NumberInputProps {
  /** 値。表示は format(value) の派生で、編集中だけ draft が優先される */
  value: number

  min?: number
  max?: number
  step?: number
  skew?: number                        // 新規（index.tsx の TODO）

  // 表示
  units?: string | Units               // 既定の format / parse を組み立てる
  digit?: number
  format?: (value: number) => string   // 指定すると units / digit より優先
  parse?: (text: string) => number

  // 操作（null で無効）
  wheel?: InputEventOption | null      // 既定 ['raw', 1]。フォーカス時のみ有効（5.9）
  keyboard?: InputEventOption | null   // 既定 ['raw', 1]
  drag?: number | null                 // 新規。Stepper 上。1 step あたりの px、既定 1

  /** 確定時と Stepper / wheel / keyboard / drag で min-max に丸める @default true */
  clampValue?: boolean

  disabled?: boolean
  readonly?: boolean
  onChange?: (value: number) => void
  children: ReactNode                  // 必須。フォールバック無し
}
```

- `Root`: `<div>` のみ。フォーカス不可。context を配り、wheel を張る。**children 必須**（Slider / Knob / XYPad の前例）
- `InputField`: draft の所有者。唯一の tab stop。`selectWithFocus` / `blurOnEnter` / 素の `onFocus` / `onBlur` はここへ移す
- `Stepper`: ドラッグ領域。`Increment` / `Decrement` はクリック + 長押しリピート領域

props の処遇:

| 現状の prop | 変更後 |
| --- | --- |
| `variant` | **削除** → ドキュメントでデモ CSS を配る（5.1） |
| `activeColor` / `wrapperClassName` | **削除** → CSS 変数 / `Root` の `className` |
| `keepWithinRange` + `clampValueOnBlur` | `clampValue?: boolean`（既定 true）に統合 |
| `selectWithFocus` / `blurOnEnter` | `InputField` の prop へ |
| `onFocus` / `onBlur`（独自シグネチャ） | `InputField` に素の DOM ハンドラとして通す |
| `Stepper` の `dynamic` | **削除** → デモ CSS 側でホバー表示を実装 |
| `Increment` / `DecrementStepper` の `size` | **削除** → `--stepper-icon-size`（Slider.Thumb の `--thumb-size`、Knob の `--knob-size` と同じ扱い） |

##### DOM / ARIA

| | 現状 | 変更後 |
| --- | --- | --- |
| tab stop | wrapper (`tabIndex={0}`)、input は `-1` | **input のみ。** wrapper は `tabIndex` 無し |
| role | 無し | `<input type="text" inputMode="decimal" role="spinbutton">` |
| ARIA | `aria-disabled` / `aria-readonly` | + `aria-valuenow` / `aria-valuemin` / `aria-valuemax` / `aria-valuetext` |
| 範囲外の表現 | `data-error` | `data-out-of-range`（`clampValue={false}` か、範囲外の `value` を渡されたとき。draft がある間は判定しない） |
| `readonly` | `aria-readonly` のみ | `readOnly` 属性も付ける |
| `disabled` | `aria-disabled` のみ | 変更なし（「見た目だけ、readonly と併用」という Slider の方針を維持。input としては驚きがあるのでドキュメントに書く） |

`index.tsx` の TODO にある `numberMode`（フォーカス時だけ `type="number"`）は**採用しない**。スピナーとロケールの問題を持ち込むだけで、モバイルのキーボードは `inputMode="decimal"` で足りる。

##### Stepper のドラッグ

`createDrag` は要素に `user-select: none` / `touch-action: none` を**インスタンスの生存中ずっと**当てるため、`<input>` に付けるとテキスト選択が死ぬ。よってドラッグは `Stepper`（コンテナ）に限定する。

**感度は固定**（`drag` px の移動で 1 `step`、既定 1）。`createDragValue` + `relativeMapping` で Knob と同じ「フルレンジを一定 px で舐める」形にすると、`min` / `max` が両方無いと成立しない（既定の `MIN/MAX_SAFE_INTEGER` で正規化されるため 100px 動かしても実質ゼロ）。NumberInput は範囲を持たない使い方が普通にあるので、そこで no-op になるのは実用的でない。

- `Stepper` に `useDrag`（`threshold: 1`、`cursor: 'ns-resize'`）
- 値は `applyDelta(originValue, steps, ['raw', step], range)` で求める。**wheel / キーボードと完全に同じ経路**を通るので、`createDragValue` を使わなくても算出が分岐しない
- `steps` はドラッグ開始時からの総移動量から毎回求める（`relativeMapping` と同じ理由で、差分を積むと丸め誤差が溜まる）
- **原点は pointerdown ではなく最初の移動で取る。** `Increment` / `DecrementStepper` は pointerdown で ±step するため、pointerdown 時点の値を原点にするとそのクリック分が捨てられる
- `Increment` / `DecrementStepper` は従来どおり pointerdown で ±step + 長押しリピート
- `createDrag` の `onDragStart` は threshold ではなく **pointerdown で発火する**ので、リピートの停止は「ドラッグが実際に値を動かした時点」で行う

長押しリピートは当面 React の `useLongPress` のまま。`createLongPress` として dom へ出すのは Vue / Svelte 着手時でよい。

##### パッケージ配置

| 出すもの | 行き先 | 備考 |
| --- | --- | --- |
| `parseValue` / `selectUnit` / `Units` | **`@tremolo-ui/functions`** | 純粋関数。`dbToGain` の隣が自然で、Vue / Svelte からも要る |
| `applyDelta` / `ValueRange` | **`@tremolo-ui/functions`** | 下記 |
| wheel / drag | 既存の `createWheel` / `createDragValue` | 新規実装なし |

`<input>` の制御そのものはコアに出さない。controlled / `v-model` / `bind:value` はフレームワークごとに流儀が違いすぎる。

##### `applyDelta`: `updateValueByEvent` の 4 コピーを 1 つにする

`updateValueByEvent` は Slider / Knob / XYPad / NumberInput に 4 つある。Slider と Knob は完全に同一、XYPad は同じものを `[axis]` で添字アクセスしているだけ。**NumberInput だけ 3 点ずれている。**

| | Slider / Knob / XYPad | NumberInput |
| --- | --- | --- |
| `skew` | 渡す | 渡さない（prop 自体が無い） |
| `raw` モードの clamp | する | **しない**（`keepWithinRange` は Stepper 側だけで見ている） |
| min / max の必須チェック | なし（必須 prop） | `if (!min \|\| !max) throw`（→ 6.4 の実バグ） |

`createDragValue` の値算出パイプライン（`reverse` → `rawValue` → `stepValue` → `clamp`）と同じ順序・同じ型に揃える。

```ts
// packages/functions/src/math.ts
export interface ValueRange {
  min: number
  max: number
  /** 省略すると丸めない（createDragValue の AxisOptions と同じ規則） */
  step?: number
  /** @default 1 */
  skew?: number
}

/**
 * wheel / キーボードの増減を値へ適用する。
 * 算出順序は createDragValue と同一: skew → step → clamp。
 */
export function applyDelta(
  value: number,
  /** 向きと回数。大きさは option[1] が決める（通常 +1 / -1） */
  direction: number,
  [mode, amount]: InputEventOption,
  { min, max, step, skew = 1 }: ValueRange,
): number {
  const x = direction * amount
  const next =
    mode === 'normalized'
      ? rawValue(normalizeValue(value, min, max, skew) + x, min, max, skew)
      : value + x
  return clamp(step ? stepValue(next, step) : next, min, max)
}
```

`dom` の `AxisOptions` は `ValueRange` を継承する形にする。ドラッグとキー / ホイールが同じ型・同じ順序を通ることが型に出る（`dom` は既に `functions` に依存しているので依存の向きも問題ない）。

```ts
// packages/dom/src/pointer/dragValue.ts
export interface AxisOptions extends ValueRange {
  reverse?: boolean
}
```

各コンポーネントに残るのは**「どのキー / どの `deltaY` を ±1 のどちらに割り当てるか」だけ**になる（Slider は `reverse` で反転、XYPad は軸判定、NumberInput は上下キーのみ）。ここはコンポーネント固有なので共通化しない。

NumberInput は `clampValue === false` のとき `min` / `max` に `MIN/MAX_SAFE_INTEGER` を渡す。この組み合わせでは `normalized` モードは意味を持たない（元々 min / max が要るため）。

##### 実装して変わった点

- **`units.ts` ではなく `unit.ts`（単数）にした。** typedoc はファイル名をページの H1 にするため、`units.ts` だと `# units` と `### Units` の slug が衝突し、`[Units](#units)` が壊れたアンカーになって `build:docs` が警告を出す。`math.ts` / `midi.ts` / `util.ts` と同じ単数形に揃えた
- **`parseValue` を 2 つに割った。** 旧 `parseValue` は `{ rawValue, formatValue, unit }` を返す parse と format の合体で、draft 方式では両者を別々に呼ぶ必要がある。`formatValue(value, units?, digit?)` と `parseValue(text, units?)` にした
- **`selectWithFocus='number'` の実装を変えた。** 旧実装は `formatValue.length - unit.length` で単位の長さを引いていたが、任意の `format` では単位の長さが分からない。表示テキストの先頭の数値部分を正規表現で取る形にしたので、どんな format でも動く
- **`Increment` / `DecrementStepper` に `aria-label` を付けた。** `role="button"` で中身が矢印 SVG だけのため、アクセシブルな名前が無かった（旧実装からの問題）。`{...props}` が後なので利用者が上書きできる
- **`stepperButton.tsx` に共通化した。** `IncrementStepper` と `DecrementStepper` は「どちらへ動かすか」と「どちらの矢印か」しか違わない。`components/**/index.{ts,tsx}` だけが typedoc の entryPoint なので、この分割は API ページに影響しない
- **Stepper の増減も `applyDelta` を通るので step の倍数に丸まる。** 旧実装は `value + step` をそのまま使っていた。0.5 の状態で `step=1` の + を押すと 1.5 ではなく 2 になる。Slider / Knob と同じ規則になった

##### タスク

- [x] `applyDelta` / `ValueRange` を `@tremolo-ui/functions` に追加し、テストを書く
- [x] Slider / Knob / XYPad / NumberInput の `updateValueByEvent` を `applyDelta` に置き換える（同じ変更にまとめる。一時的にも 2 経路を作らない）
- [x] `dom` の `AxisOptions` を `ValueRange` の継承に変える
- [x] `parseValue` / `selectUnit` / `Units` を `functions` へ移し、`formatValue` / `parseValue` に分割する。テストも移す（`functions/__tests__/unit.test.ts`）
- [x] `NumberInput/context.tsx` の zustand を React context に置き換える（state は draft のみ）
- [x] `InternalInput` を `InputField` として公開し、`Root` は children をそのまま描画する形にする
- [x] `Root` から `variant` / `activeColor` / `wrapperClassName` / `keepWithinRange` / `clampValueOnBlur` を削除、`clampValue` / `skew` / `format` / `parse` / `drag` を追加
- [x] `selectWithFocus` / `blurOnEnter` / `onFocus` / `onBlur` を `InputField` へ移す
- [x] tab stop を input に移し、`role="spinbutton"` と `aria-value*` を付ける。`data-error` → `data-out-of-range`
- [x] `Stepper` にドラッグを足す（`useDrag` + `applyDelta` の固定感度、`threshold: 1`、値が動いた時点で長押しリピートを止める）
- [x] `Stepper` の `dynamic` と `Increment` / `DecrementStepper` の `size` を削除し、CSS 変数へ
- [x] `index.css` を新しい DOM 構造に合わせる（`variant` のセレクタを外し、フォーカス表示は input の `:focus` か wrapper の `:focus-within` に統一）
- [x] stories を書き直す（`Variant` は削除、`SelectWithFocus` は `SelectOnFocus` に、`ClampValue` / `CustomFormat` を追加）。`__stories__/combined/` と `useWheel.stories.tsx`、`Piano` / `PointsEditor` / `Slider` の stories も追随済み
- [x] `site/examples/components/number-input/basic.tsx` を更新する（`site/docs/components/NumberInput/index.mdx` は例を参照するだけなので変更不要）
- [x] ブラウザでの目視確認（IME での入力、モバイルのキーボード、Stepper のドラッグと長押しの切り分け）

### Phase 5: zustand 除去

**完了。** `zustand` は `packages/react/package.json` から削除した。

当初は「`useSyncExternalStore` でセレクタ購読に置換する」計画だったが、実際に 5 コンポーネントを見直した結果、**外部ストアそのものが要らなかった**。ストアに入っていたのは全て `Root` の props から導出できる設定で、レンダーごとに計算し直しても問題無いものだった。Phase 2.5 で決めた「値は store に持たない」がそのまま効いている。

- [x] Slider / Knob / XYPad — Phase 2.5 で素の React context へ
- [x] NumberInput — 4.1 で context ごと削除（Root が持つ state は編集中の draft 1 つだけ）
- [x] Piano — 4.3 で context ごと削除（`Root` が全ての鍵盤を描くので配る相手がいない）
- [x] PointsEditor — 下記の通り素の React context へ
- [x] `zustand` を dependencies から削除
- [x] `SliderProvider` の `useEffect(..., [props])`（props が毎レンダー新しいオブジェクトのため毎回 `setState` が走っていた）は Phase 2.5 で消滅

zustand の置き換えとしては `useSyncExternalStore` を 1 つも使っていない。**外から変わる値を購読する必要が無い**（ポインタもホイールも、コアのインスタンスがコールバックで通知してくる）ため。唯一使っているのは `useMIDIAccess` で、こちらは Phase 1 の時点から `createMIDIAccess` の `subscribe` / `getState` を購読している。**権限の許可とデバイスの着脱という、React の外から非同期に変わる状態**なので、ここだけは購読が要る。

#### PointsEditor の zustand 除去と wheel / keyboard の配線

Phase 5 の最後の 1 つ。zustand の除去だけでなく、触ったついでに 5.9 で見つかっていた「宣言されているだけの prop」も片付けた。

#### 直したもの

- **zustand を素の React context へ。** Slider / Knob / XYPad と同じ形（`PointsEditorProvider = Context.Provider` + オーバーロードした `usePointsEditorContext`）に揃えた
- **`Container` がレンダー中に `setContainerElementRef()` を呼んでいた**（レンダー中の副作用）。しかも `useRef` を毎マウント作り直して store へ流し込んでいた。`XYPad.Area` と同じく、`Root` が `containerRef` を持ち `Container` は `useComposedRefs` で合成するだけにした
- **`readonly` / `disabled` が `Root` から `Point` に伝わっていなかった**（実バグ）。`Point` はコンテキストから `__readonly` を読んでいたのに、ドラッグのガードは**ローカルの prop しか見ていなかった**ので、`<PointsEditor.Root readonly>` を書いても点は動かせた。`_readonly ?? rootReadonly` に統一し、ARIA 属性とガードで同じ値を使う
- **`wheel` / `keyboard` を配線した。** 5.9 で「型にもドキュメントにも出るが何も起きない」と記録していたもの。`Root` に置いたまま `Point` が継承し、`Point` 側で上書きできる形にした（`disabled` / `readonly` と同じ）。`null` は「イベントを起こさない」という意味を持つので、継承は `??` ではなく `=== undefined` で判定する
  - キーボード: 矢印キー。**y は下向きに増える**ので ArrowUp は y を減らす
  - ホイール: XYPad と同じ規約（shift で x 軸）。フォーカスが無ければ何もしないので 5.9 の方針にも従う
  - 既定値は `['normalized', 0.01]`。点の値は両軸とも 0..1 なので、ピクセルサイズによらず 100 ステップで端から端まで動く

#### 複数の点があるときのホイールの配り方

Slider / XYPad と違い、PointsEditor には**動かせる点が複数ある**。最初の実装は各 `Point` が自分の要素にリスナを張って `requireFocus: true` を渡していたが、これだと

- ホイールイベントは**カーソル下の要素にしか届かない**
- `requireFocus` は「その点自身にフォーカスがあるか」を見る

の 2 つが重なり、**「カーソルがその点の上」かつ「その点にフォーカス」が同時に成立しないと何も起きなかった**。既定の点は 16px なので、クリック直後は効いていてもマウスが数ピクセル外れた瞬間に無言で止まる。Slider / XYPad は Root にリスナがあり `root.contains(activeElement)` を見るので「サムにフォーカスがあればコントロール上のどこでも効く」であり、PointsEditor だけ条件が厳しかった。

**各 `Point` がリスナを Container に張り、`activeElement === 自分の要素` で自己フィルタする形にした。** 全ての点がイベントを見て、ちょうど 1 つだけが反応する。

- 判定は `contains` ではなく**厳密一致でなければならない**。`contains` にすると全ての点が「Container 内にフォーカスがある」で一致してしまい、**全部が同時に動く**
- レジストリ（点を context に登録させる仕組み）は作らなくてよい。各点は自分の要素を持っているので比較するだけで済む。Piano 4.3 で ref 配列のレジストリを消したのと同じ判断
- `useWheel` に `target?: RefObject<Element | null>` を足した（公開 API の追加）。「返した ref コールバックの先」ではなく「既に別の場所で管理されている要素」に張るための受け口。ref は effect の中で読むので、親が入れる ref でも間に合う（React は ref を子から先に付け、passive effect はその後に走る）
- 副作用として、**点にフォーカスがある間はエディタ上でページがスクロールしなくなった**（`preventDefault` が呼ばれるため）。Slider / XYPad は既にこの挙動なので揃う方向
- `Point` を `Container` の外に置くとホイールが効かなくなるが、ドラッグは元から `containerRef` を基準にしているのでその使い方は既に成立していない
- **`grid` prop を削除した。** TODO のまま未実装で、`Root` で分割代入もされていなかったため `...props` 経由で `<div grid="4">` として DOM に漏れていた（Piano の `blackNoteWidth` と同じ）
- **`children` を型で必須にした。** Slider / Knob / XYPad / Piano と揃える。既定の描画へのフォールバックは元から無い
- `Root` に `aria-disabled` / `aria-readonly` を付けた（CSS の状態セレクタの規約）。`index.css` に足すのは `[aria-readonly='true'] { cursor: default }` だけにした

  最初は XYPad の Thumb に合わせて `[aria-disabled='true']` の背景色と `[aria-readonly='false']:focus` のフォーカスリングも足したが、**既存の利用者の見た目を変えてしまう**ので外した。`__stories__/styles/PointsEditor.module.css` の ADSR の点は `background: none` の透明な 30px の円で、中の 4px のドットだけを見せている。そこにフォーカスリングが乗ると、透明な円の外周にハロが出る。story 側は `.point:focus .pointInner` で独自のフォーカス表現を既に持っていたので二重にもなっていた。

  `[aria-disabled='true']` の背景色にも同じ問題がある。セレクタの詳細度が `.tremolo-points-editor-point[aria-disabled='true']`（0,2,0）で、利用者の `.point { background: none }`（0,1,0）に**打ち勝ってしまう**。

  **フォーカスの表示自体は課題として残る。** 元から `outline: none` が入っていて既定のフォーカスリングを潰しているのに、代わりが無い。矢印キーを配線した今は「どの点にフォーカスがあるか」が見えないと操作できないので、5.1 の CSS ヘッドレス化で「パッケージはスタイルを配らず、デモの CSS をドキュメントからコピーさせる」と決めるときに一緒に片付ける

#### PointsEditor での公開 API 変更

| 変更 | 内容 |
| --- | --- |
| 削除 | `PointsEditorProps.grid`（未実装。DOM に漏れていた） |
| 必須化 | `PointsEditorProps.children` |
| 追加 | `PointProps` の `wheel` / `keyboard`（`Root` の値を上書きする） |
| 追加 | `usePointsEditorContext` / `PointsEditorContextValue` / `PointsEditorBackgroundProps` / `PointsEditorContainerProps` を `src/index.ts` から export |
| 追加 | `useWheel` の `target` オプションと `UseWheelOptions` 型 |
| 挙動 | `Root` の `readonly` / `disabled` が `Point` に伝わるようになった（**それまで無視されていた**） |
| 挙動 | `Root` の `wheel` / `keyboard` が実際に効くようになった |

`usePointsEditorContext` は zustand のセレクタ必須から、`useSliderContext` / `useXYPadContext` と同じ「セレクタ省略可」のオーバーロードになった。セレクタ付きの呼び出し方はそのまま動く。

#### テスト

`packages/react/__tests__/PointsEditor/index.test.tsx` を新規追加（21 件）。PointsEditor は専用テストが無かった。ドラッグが「動いた距離」ではなく「指した位置」を返すこと、`min` / `max` のクランプ、`readonly` / `disabled` の継承と上書き、矢印キーの向き、ホイールのフォーカス要求、`Container` の ref 合成、`Root` の外での例外までを見る。点が 2 つある場合のホイールの配り先（フォーカス中の点が動き、カーソル下の点は動かない / 反応するのは 1 つだけ）も含む。

- [x] `npm run lint` / `npm run test` / `npm run build:sb` / `npm run build:docs`
- [x] ブラウザでの目視確認（`KeyboardAndWheel` と `ADSRWithSlope`。ADSR の点の見た目が変わっていたのを受けて `index.css` に足したフォーカスリングと disabled 背景色を外した）

### Phase 6: Vue / Svelte

`plans/milestone.md` へ移動。1.0 に向けたマイルストーンとして管理する。

## 5. コア化と並行して片付けるもの

Phase の順序に組み込みきれないが、1.0 までに決着させる項目。

### 5.1 CSS の完全ヘッドレス化 — **完了**

Radix UI / Base UI と同じ方針にする。パッケージはスタイルを配らず、**ドキュメント上でデモの CSS を公開**して、利用者が Tailwind / CSS Modules / plain CSS を自由に選べる形にする。

- [x] **完全に消す方を採った。** opt-in の「デフォルトテーマ」として別 export に残す案は採らない。残すと「配らない」と言いながら実質デフォルトのままになり、クラス名と CSS の両方を我々が持ち続けることになる
- [x] `package.json` の `exports` から `./styles/*.css` を全て削除した。`src/index.ts` の import も外したので `dist/index.css` は生成されなくなった（Phase 6 の「CSS の配布方法を再検討」はこの項目に統合）
- [x] **状態を表す属性は足りていた。** `[aria-disabled]` `[aria-readonly]` `[data-dragging]` に加えて `[data-vertical]` `[data-active]` `[data-out-of-range]` があり、移した CSS 自身がこの 6 つだけで状態を表現できていたことが確認になっている。`styling.mdx` に一覧を載せた
- [x] ドキュメントサイトに、デモで使っている CSS をコピーできる形で載せた

#### 置き場

`site/src/css/tremolo/<Name>.css`。**コピー元として公開する場所と、実際に読み込む場所を 1 つにした。** ドキュメントサイトは `docusaurus.config.ts` の `customCss` で、Storybook は `.storybook/preview.tsx` から相対パスで、同じファイルを読む。2 箇所に置くと必ずずれる。

`styling.mdx` は `raw-loader` で 6 ファイルの全文をタブに出しているので、CSS を書き足せばドキュメントにも自動で載る。

#### 書き直したドキュメント

`styling.mdx` は「デフォルトのスタイルを適用する」→「dist/index.css をコピーして上書きする」という構成だったので、丸ごと入れ替えた（en / ja）。クラス名の付き方、状態属性の一覧、テーマ全文、CSS Modules の例。`getting-started.mdx` の手順 3 も同様。

**破壊的変更なので移行ガイドに載せた。**

### 5.2 `tremolo-user-select-none` / `tremolo-cursor-*` をどうするか — **完了**

ドラッグ中に body へクラスを付け外しする仕組み（`src/styles/global.css` + `src/components/_util/index.ts`）。Knob / Slider / XYPad / PointsEditor の 4 コンポーネントが `externalStyles` prop 経由で使っている。**CSS をヘッドレス化すると、このグローバル CSS だけがパッケージに残ることになるため、5.1 と同時に決める。**

選択肢:

1. コア（`@tremolo-ui/dom`）が `element.style` を直接操作する（クラス不要になり CSS を配らなくて済む）
2. `data-*` 属性を body に付けるだけにして、スタイルは利用者に任せる
3. 現状維持（グローバル CSS だけは配り続ける）

`createDrag` は既に `touch-action` / `user-select` / `-webkit-user-select` / `-webkit-touch-callout` を要素に直接適用し、ドラッグ中は `selectstart` をキャンセルしているので、1 と整合性が取りやすい。

#### 対応した内容

**1 を採った。** ただし今回動かしたのは React 側の `_util` で、`document.body.style` に直接 `user-select` / `-webkit-user-select` を当てる形にした。**`@tremolo-ui/dom` へ移すのは Phase 6 に回す。** Vue / Svelte を作るときに同じものが要るので置き場はコアが正しいが、今それをやると `createDrag` の API を広げる判断（ドラッグ中にページ全体へ何かを当てる責務をコアが持つか）が要り、5.1 のブロッカーではない。

- [x] `.tremolo-cursor-*` と `setCursorStyle` / `resetCursorStyle` を削除した。ドラッグ中の cursor は `createDrag` の `cursor` オプションが要素へ直接当てるので、body を触る必要が無かった。`Cursor` 型は `externalStyles.cursor` が使うので残してある
- [x] `.tremolo-user-select-none` をインラインスタイルに置き換え、`src/styles/global.css` ごと削除した
- [x] **カウンタを持たせた。** クラスの付け外しは冪等だが、インラインスタイルの保存・復元はそうではない。2 本指で 2 つのコンポーネントを同時にドラッグしたとき、先に離した方が復元してしまうと、残っている方がテキストを選択し始める。`__tests__/util/userSelect.test.ts` で固定した

`-webkit-user-select` はテストで表明していない。jsdom の `CSSStyleDeclaration` は知らないプロパティを落とすので `setProperty` が無言で効かないため。

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

**設計は 4.3 に集約した。タスクもそちらにある。** ここには経緯だけ残す。

当初の想定「`usePianoDrag` を `createDragValue` ベースに置き換える。差は pointerdown で発火するかだけで `updateOnPointerDown` で吸収できる」は**誤りだった**（理由は 4.3「なぜ `createDragValue` を使わないか」）。マルチタッチには `createDrag` 側の拡張が要り、当たり判定は軸のマッピングでは表せない。

`index.tsx:193` の TODO（マルチタッチには TouchEvent が必要そう）については、**Pointer Events が `pointerId` で複数ポインタを区別できるため TouchEvent は不要**、という判断で変わらない。

### 5.6 サブコンポーネントの配置ミスを検出する — **完了**

children をそのまま描画する形（Phase 2.5）にしたことで、**サブコンポーネントを間違った階層に置いても型エラーにも実行時エラーにもならず、レイアウトだけが静かに壊れる**ようになった。

実例: `combined/VolumeFader` は `<Slider.Thumb>` が `<Slider.Track>` の兄弟のまま残っており、Thumb の `position: absolute` の基準が最も近い配置済み祖先である body になって崩れていた。ビルドもテストも通っていた。

`src/components/_util/placement.tsx` に 2 つ置いた。

- `<Placement name="Slider.Track">` — 「ここから下は Track の中」と印を付けるだけの context provider
- `useCheckPlacement('Slider.Thumb', 'Slider.Track')` — 直近の印が期待と違えば `console.warn`

- [x] `Slider.Track` / `Slider.Thumb`
- [x] `Slider.Marks` / `Slider.MarksOption`
- [x] `XYPad.Area` / `XYPad.Thumb`
- [x] `Knob.SVGRoot` / `ActiveLine` / `InactiveLine` / `Thumb` — 対象に含めた。`<path>` を `<svg>` の外に置くと React も「The tag `<path>` is unrecognized」と言うが、**どのコンポーネントが間違っているかは言えない**
- [x] `PointsEditor.Container` / `PointsEditor.Point` — Point は `containerRef` を基準にドラッグするので、外に置くとドラッグごと効かない
- [x] 本番ビルドでは警告を出さない

#### 決めたこと

- **エラーではなく警告にした。** 描画自体は成功するので、投げると「今まで動いていたものが動かなくなる」破壊的変更になる。位置がずれるだけなので警告で足りる
- **間違った親の名前も出す。** `Slider.Thumb` が `Slider.Marks` の中にあれば「but it is inside Slider.Marks」と言う。単に「Track の中に置け」と言われるより原因に近い
- **`process.env.NODE_ENV` は `try` の中にインラインで書く。** ここは推測せず esbuild で実測した（`--minify --define:process.env.NODE_ENV='"production"'`）。

  | 書き方 | 本番バンドルから消えるか |
  | --- | --- |
  | `if (process.env.NODE_ENV !== 'production' && ...)` をインライン | **消える** |
  | `isProduction()` のようなヘルパー経由 | **残る** |
  | モジュール先頭の `const development = ...` | **残る** |
  | 上記インラインを `try` で囲む | **消える** |

  バンドラがやるのは `process.env.NODE_ENV` という**式そのものの文字列置換**なので、関数やモジュール定数を挟むと畳めなくなる。最初ヘルパーにしていたが、実際に本番バンドルを作ると `console.warn` もメッセージ文字列もそのまま残っていた。

  `try` で囲むのは `process` が**存在しない**可能性があるため。`platform: 'neutral'` でビルドしているので、CDN から ESM を直接読むページには `process` が無く、裸の参照は `ReferenceError` になる。囲めば畳み込みは維持したまま安全になり、バンドラが置換しない環境では警告が出ないだけで済む。

  実測結果: 本番バンドルでは `useCheckPlacement` が空の `useEffect` だけになり、メッセージ文字列は 1 つも残らない
- **`_util/` に置いたので typedoc には出ない。** `site/docusaurus.config.ts` の `exclude` に `components/_util/**` が既に入っている

#### テスト

`packages/react/__tests__/util/placement.test.tsx`（9 件）。正しく置いたときに黙ること、5 種類の配置ミスそれぞれで警告が出ること、間違った親の名前が出ること、本番ビルドで黙ることを見る。

### 5.7 MIDI の作り込み — **完了**

Phase 1 で `@tremolo-ui/dom` へ移した部分。移植は「React hook のロジックをそのまま移す」ことを目的にしたので、機能面は当時のままだった。

#### 見つかったバグ

- **デバイスの着脱に追随していなかった（実バグ）。** `createMIDIMessage` が `const inputs = [...midiAccess.inputs.values()]` と**生成時に 1 回だけ配列を取って**いたため、権限を許可した後に接続したキーボードにはリスナが張られず、**再マウントするまで何も鳴らなかった**。`statechange` を購読して、接続されたら張り、外れたら外す形にした
- **pitch bend の引数名が逆（実バグ）。** `onPitchBendEvent(msb, lsb)` に `(data[1], data[2])` を渡していたが、pitch bend の 2 バイトは**下位 7 bit が先**で、他のメッセージと並びが逆。`data[1]` は LSB なので名前が入れ替わっていた
- **React hook が毎レンダーで購読し直していた。** `useMIDIInput` / `useMIDIMessage` は effect の依存にハンドラを入れており、インラインで書くと毎レンダー新しい関数になるため、リスナを張り直していた。Phase 2 以降のドラッグ系と同じ形（インスタンスに `update()` を足し、React 側は `useRef` で最新を流す）に揃えた

#### 増やしたもの

- [x] **チャンネルボイスメッセージを全部扱う。** note on / note off / pitch bend の 3 つだけだったのを、control change / program change / polyphonic aftertouch / channel pressure まで広げた。システムメッセージ（`0xf0`〜）はチャンネルを持たないので `createMIDIInput` では復号せず、`createMIDIMessage` に任せる
- [x] **チャンネルを捨てなくなった。** `status & 0xf0` で種類だけ取ってチャンネルの下位ニブルを捨てていた。全ハンドラの最後の引数として 0-15 で渡す
- [x] **pitch bend を 14 bit の 1 つの値にした。** `(msb, lsb)` の生バイト 2 つではなく 0-16383。中央値は `PITCH_BEND_CENTER`（8192）として export した。範囲が非対称（下に 8192、上に 8191）なので、最大値の半分ではない
- [x] **`createMIDIAccess` のエラーを分けた。** すべての reject を `PERMISSION_DENIED` に潰していたのを、`DOMException` の `name` で振り分ける。`SecurityError` / `NotAllowedError` → `PERMISSION_DENIED`、`NotSupportedError` → `NOT_SUPPORTED`、それ以外（`AbortError` など）→ 新しい `UNAVAILABLE`。「ユーザーが断った（もう一度聞けばよい）」と「ブラウザが対応していない（聞いても無駄）」は区別が要る
- [x] **`sysex` を渡せるようにした。** `request({ sysex: true })`。ブラウザは sysex を別の、より強い権限として扱うので既定は off
- [x] **接続中の入力を state に載せた。** `MIDIAccessState.inputs`。`statechange` で更新されるので、デバイス一覧の UI が自分で購読しなくてよい

#### 公開 API の変更

| 変更 | 内容 |
| --- | --- |
| 破壊的 | `useMIDIInput(access, onNoteOn, onNoteOff, onPitchBend)` の位置引数をやめ、`useMIDIInput(access, handlers)` のオブジェクトにした。ハンドラが 7 つになったので位置引数では持たない |
| 破壊的 | `onPitchBendEvent` が `(msb, lsb)` から `(value, channel)` に |
| 破壊的 | `useMIDIAccess().request` が `(options?: MIDIAccessOptions)` を取るようになった。`onClick={request}` と直接渡していると `MouseEvent` が `options` に入るので `onClick={() => request()}` にする |
| 追加 | 全ハンドラの末尾に `channel`（0-15） |
| 追加 | `onControlChangeEvent` / `onProgramChangeEvent` / `onAftertouchEvent` / `onChannelPressureEvent` |
| 追加 | `PITCH_BEND_CENTER` / `UNAVAILABLE` / `MIDIAccessOptions` / `MIDIInputHandlers` |
| 追加 | `MIDIAccessState.inputs`、`useMIDIAccess()` の戻り値の `inputs` |
| 追加 | `createMIDIInput` / `createMIDIMessage` に `update()` |

#### テスト

`packages/dom/__tests__/midi/` を書き直した（access 13 / input 13 / message 7）。着脱の追随、pitch bend の 14 bit 化とバイト順、チャンネルの取り出し、システムメッセージを無視すること、エラーの振り分けを見る。`packages/react/__tests__/hooks/useMIDIInput.test.tsx`（3 件）でインラインハンドラが張り直されないことを見る。

ドキュメントは `site/docs/hooks/web-midi-api/index.mdx` を書き直した。

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
- **`ValueRange.skew` を `scale` にした。** #141 が `ValueRange` と `applyDelta` を新設していたので、`AxisOptions extends ValueRange` の構造に乗せる形で統合した。ドラッグと wheel / keyboard の nudge が 1 つのスケール記述を共有する
- **`ValueRange` / `applyDelta` を `math.ts` から `scale.ts` へ移した。** `ValueRange` が `Scale` を参照し、`applyDelta` が `linearScale` を実行時に使うため、`math.ts` に置いたままだと math → scale → math の循環 import になる。公開名は変わらない
- **`normalizeValue` / `rawValue` から `skew` 引数を外し、線形の写像だけを担わせた。** `scale` に一本化した後、`skew` を渡していたのは `skewScale` だけで、他の呼び出し箇所（`elementMapping` と `usePianoDrag` のピクセル正規化、`NumberInput`）は全て線形だった。曲がりは全て `Scale` 側に置き、この 2 つは公開 API の線形プリミティブとして残す。JUCE 互換の式（`pow` と `exp(log())`）は `skewScale` の中に移してある
- `skewWithCenterValue` も `math.ts` から `scales.ts` の `skewScale` の隣へ移した（挙動は変更なし）。これで `math.ts` に skew の概念が残らない
- **ファイル名は `scale.ts` ではなく `scales.ts`。** typedoc は `router: 'module'` でモジュールごとに 1 ページ出すため、`scale.ts` だとページ見出しの `# scale` と export した `Scale` インターフェースがどちらも `scale` スラッグを取り合い、後から出る `### Scale` が `scale-1` になる。結果 typedoc が生成する `[Scale](#scale)` が壊れたリンクになり、docusaurus のビルドが broken anchor を報告していた。複数形にして衝突を外してある

回帰テスト:

- `packages/functions/__tests__/scales.test.ts` — 5 つ全てについて往復・端点・単調性・範囲外クランプ・空レンジの拒否、各プリセット固有の性質
- `packages/dom/__tests__/pointer/scaleJump.test.ts` — 実際のドラッグ経路で 5.8 の症状を固定。`skewScale` は dB ノブの下端で 1px あたり 8dB 飛び、周波数ノブでは 12px 動かしても値が変わらない。`curveScale` / `exponentialScale` はどちらも起きない

`exponentialScale.normalize` / `curveScale.normalize` は**値をクランプしてから対数を取る**必要がある。範囲外の値では比が負になり、`Math.log` が NaN を返すため（位置をクランプしても手遅れ）。テストで固定してある。

#### フォローアップ: `Slider.Scale` → `Slider.Marks` に改名する

**`Scale` 型と `Slider.Scale`（目盛りを描くサブコンポーネント）で名前が衝突している。** `<Slider.Root scale={…}><Slider.Scale/></Slider.Root>` は紛らわしい。

**対応済み。`Slider.Marks` へ改名した。**

| 変更前 | 変更後 |
| --- | --- |
| `Slider.Scale` / `Slider.ScaleOption` | `Slider.Marks` / `Slider.MarksOption` |
| `ScaleProps` / `ScaleOptionProps` | `MarksProps` / `MarksOptionProps` |
| `ScaleOptions` / `ScaleType` | `MarksOptions` / `MarksType` |
| `.tremolo-slider-scale*` | `.tremolo-slider-marks*` |

`Slider/index.tsx` の `type Scale as ValueScale` は素の `Scale` に戻した。

`packages/react/package.json` の `exports` は**変更不要**だった。`./styles/Slider.css` はコンポーネント単位の指定で、CSS ファイル自体は移動していないため（変わったのはクラス名だけ）。`site/docs` にも `Slider.Scale` の記述は無く、i18n に残る `ScaleProps` / `ScaleOptionProps` は typedoc の生成物なので `docs:wtr` で再生成される。

### 5.9 wheel はフォーカス時のみ発火させる — 全コンポーネント — **完了**

現在 wheel を持つのは Slider / Knob / XYPad / PointsEditor / NumberInput の 5 つで、**いずれもホバーしているだけで発火し、`event.preventDefault()` でページスクロールを奪う。** 長いフォームやドキュメントの上をスクロールしていて、たまたま通過したコントロールの値が変わる事故が起きる。Base UI / Chakra v3 も NumberField は「フォーカス時のみ」にしている。

- [x] `createWheel` に「要素の中にフォーカスがあるときだけ発火する」オプションを足す（`requireFocus`。あわせて `update()` も追加）
- [x] Slider / Knob / XYPad / NumberInput をそれに切り替える（**PointsEditor は対象外**。`wheel` / `keyboard` prop を宣言しているだけで、どこからも使っていない。下記参照）
- [x] 移行ガイドに載せる（挙動の破壊的変更）→ `site/docs/guides/migration.mdx` の 0.5.0 に *The wheel only acts while the focus is inside* として載っている

#### 判定は `activeElement` そのものではなく `contains` で行う

素直に「wheel を張った要素がフォーカスされているか」で判定すると壊れる。**フォーカス可能な要素はサブコンポーネントの既定描画の中にしかない**ためで、利用者が children を差し替えると tab stop が消える。

| | wheel を張る要素 | `tabIndex={0}` を持つ要素 |
| --- | --- | --- |
| Slider | `Root`（`tabIndex={-1}`） | `Thumb` の**既定描画のみ**（`children` を渡すと消える） |
| XYPad | `Root`（`tabIndex={-1}`） | `Thumb` の既定描画のみ（同上） |
| Knob | `Root`（`tabIndex={0}`） | Root 自身 |
| PointsEditor | container | `Point` |
| NumberInput | `Root` | `InputField`（4.1 で input へ移す） |

そこで判定は `element.contains(element.ownerDocument.activeElement)` にする。`Root` は `tabIndex={-1}` でもクリックでフォーカスを受けられるので、Thumb を完全に差し替えられていても動く。

```ts
// packages/dom/src/pointer/wheel.ts
export interface WheelOptions {
  /**
   * 要素の中にフォーカスがあるときだけ発火する。
   * ホバーしただけでページスクロールを奪わないようにするためのもの。
   * @default false
   */
  requireFocus?: boolean
}
```

React 側ではなくコアに置くのは、Vue / Svelte でも同じ判定が要るため。

#### PointsEditor の `wheel` / `keyboard` は配線されていない → **Phase 5 で配線した**

切り替え作業中に判明した。`PointsEditorProps` は `wheel` / `keyboard` を宣言していて型にもドキュメントにも出るが、`index.tsx` は `useWheel` を呼んでおらず、キー操作も実装していない。**渡しても何も起きない。**

- [x] 配線するか、prop を削除するかを決める → **配線した。** 実際の操作対象は `Root` ではなく `Point` なので、`Root` の値を `Point` が継承して上書きできる形にした（Phase 5）

### 5.10 緩い等価（`==` / `!=`）をやめる — **完了**

ESLint に `eqeqeq` を設定しておらず、`==` / `!=` がリポジトリ全体に散っていた。大半は TypeScript で型が付いていて両辺が同じ型なので実際に型強制は起きておらず、**バグは 1 件も見つからなかった**が、

- 意図して nullish をまとめて見ている箇所（`drag == null` など）と、単に型が同じもの（`key == 'Enter'` など）が**見分けられない**。`== null` は「null と undefined の両方」という意図の表明として有用なのに、周りが全部 `==` だとその情報が消える
- 実際に `Piano/KeyLabel.tsx` のラベル判定で「`undefined` は入っているのか」が読んで分からない状態になっていた（4.3 で明示的な比較に直した）

- [x] `eslint.config.js` に `eqeqeq: ['error', 'always']` を追加した。**`null: 'ignore'` は選ばなかった。** 除外されるのは `== null` の 7 件だけで（`!= undefined` は `null: 'ignore'` の対象外）、しかもその 7 件こそ「null なのか undefined なのか」を明示したい箇所だったため、緩めても読みやすさが上がらない
- [x] 98 件を修正した（`packages/*/src` + `site/src` + `__stories__` + `.storybook` + `scripts`）。**autofix が効いたのは 15 件だけ**で、残り 83 件は手で見た
- [x] 1 回の変更でまとめて直した。段階的にやると新旧が混在した状態が長く残り、どちらが意図的なのか余計に分からなくなる

#### nullish をどう開いたか

「その型が実際に取りうる方だけを書く」で統一した。`=== null || === undefined` と両方書くのは、片方しか起こり得ない箇所では嘘になる。

| 箇所 | 型 | 直した形 |
| --- | --- | --- |
| `animation.ts` の `frameId` | `number \| null` | `!== null` / `=== null` |
| `NumberInput` の `draft` | `string \| null` | `!== null` / `=== null` |
| `NumberInput` の `drag`（context 経由） | `number \| null` | `=== null` |
| `NumberInput` の `min` / `max` | `number \| undefined` | `!== undefined` |
| `unit.ts` の `digit` | `number \| undefined` | `!== undefined` |
| `GitHubLink` の `isFile` | `boolean \| undefined` | `=== undefined` |

`site/src/theme` は `eslint.config.js` の `ignores` に入っているので対象外。`Playground/parser.ts` にコメントアウトされた `magicComment == 'expand alt'` が残っているが、これも触っていない。

### 5.11 修飾キー（shift / alt）の同時押しに対応する — drag / wheel / keyboard

DAW のノブやフェーダーは、shift で細かく、alt（option）で既定値に戻す、といった修飾キーの規約を持っている。tremolo-ui には**その仕組みが無い**。

現状で修飾キーを見ているのは 2 箇所だけで、しかも用途が違う。

- `XYPad/index.tsx` の wheel: `event.shiftKey` で x 軸を選ぶ
- `PointsEditor/Point.tsx` の wheel: 同上

どちらも「軸の切り替え」であって「感度の切り替え」ではない。ドラッグとキーボードには修飾キーの経路そのものが無い。

- [ ] **何を割り当てるか決める。** よくある規約は shift = 微調整（fine）、alt/option = 既定値へリセット、ctrl/cmd = ステップ無視。既に `Knob` はダブルクリックで既定値に戻す（`enableDoubleClickDefault`）ので、alt との役割分担を決める必要がある
- [ ] **XYPad / PointsEditor の shift = 軸切り替えとぶつかる。** 2 次元のコンポーネントでは shift の意味が既に埋まっている。軸切り替えを別のキーに移すか、2 次元だけ規約を変えるかを決める
- [ ] **`InputEventOption` の形を見直す。** 現在 `['normalized' | 'raw', number]` の 1 組しか持てないので、修飾キーごとに別の量を渡せない。`{ default: [...], shift: [...], alt: 'reset' }` のような形にするか、感度の倍率だけ別 prop にするか
- [ ] **どの層で扱うか決める。** キーボードと wheel は React 側のハンドラで `event.shiftKey` を読めるが、**ドラッグは `@tremolo-ui/dom` の `createDragValue` が値を計算している**ので、`DragState` に修飾キーの状態を載せるか、`createDragValue` 自体が感度を切り替えるかを決める必要がある。`DragState.event` に `PointerEvent` は入っているので読めなくはないが、`onChange` は既に計算後の値しか渡さない
- [ ] **ドラッグ中に修飾キーを押した/離した場合をどうするか。** ポインタが動かない限り `pointermove` は来ないので、押した瞬間には反映されない。`keydown` / `keyup` も見るか、次の移動から効けばよしとするか
- [ ] 全コンポーネント（Slider / Knob / XYPad / NumberInput / PointsEditor）で規約を揃える。片方だけ対応すると余計に分かりにくい

### 5.12 Knob が場所不足で潰れる

`.tremolo-knob` は `display: inline-block` に `width: var(--knob-size); height: var(--knob-size)`（既定 50px）だけを指定している。**縦横比を保つ指定が無い。**

flex / grid コンテナの中で幅が足りないと、`flex-shrink` の既定値が 1 なので `width` が縮む。一方 `height` は縮まないため、**中の SVG が引き伸ばされて円が楕円になる。** `viewBox="0 0 100 100"` の SVG が `preserveAspectRatio` の既定でボックスに合わせるので、潰れ方がそのまま見える。

- [ ] `aspect-ratio: 1` を入れて、片方だけ縮んでも比率を保つ
- [ ] `flex-shrink: 0` を入れるか、`min-width` / `min-height` を置くかを決める。**縮ませない**のと**比率を保ったまま縮む**のとで挙動が違うので、どちらが望ましいか決める
- [ ] `size` prop を渡したときと `--knob-size` を書き換えたときで同じ結果になることを確認する。現在 `size` は `style` の `width` / `height` に直接入るので、CSS 変数を経由しない
- [x] 5.1 との関係は決着した。**パッケージは CSS を配らなくなったので、この修正は `site/src/css/tremolo/Knob.css`（デモのテーマ）に入る。** 潰れるかどうかは利用者の CSS 次第になるが、`aspect-ratio` を知らずに書くと必ず踏むので、テーマ側で示しておく価値はある。`size` prop が `style` の `width` / `height` に直接入る点だけはコンポーネント側の話として残る

### 5.13 NumberInput の上下キーでカーソル位置を保つ

`InputField` の上下キーは `nudge()` で値を変え、`value` が `format(value)` で作り直される。**制御された `<input>` の `value` が置き換わるとキャレットが末尾へ飛ぶ**ので、`1234.5` の `2` の位置にキャレットを置いて上下キーを連打すると、1 回目で末尾に移動してしまう。

桁を選んで上下キーで動かす（DAW や CAD でよくある操作）ができない。

- [ ] **オプションとして足す。** 既定の挙動を変えると既存利用者の見た目が変わるので、`InputField` の prop にする（名前は `keepCaretOnStep` など）
- [ ] **単にオフセットを復元するだけでは足りない。** 桁数が変わると位置がずれる（`9.9` → `10.0` で 1 文字増える、`10` → `9` で減る）。末尾からのオフセットで測るか、小数点からの相対位置で測るかを決める
- [ ] **「キャレットのある桁を動かす」まで踏み込むかを決める。** 位置を保つだけなら表示の話だが、桁を見て刻み幅を変える（小数第 1 位にいれば 0.1 ずつ）なら `keyboard` の `InputEventOption` と競合する。5.11 の修飾キーとも関係する
- [ ] IME 変換中は触らない。`compositionstart` / `compositionend` の間はキャレットを動かさない

### 5.14 NumberInput の `units` / `digit` をやめ、`format` に一本化する

現在 `NumberInput.Root` は `units` / `digit` と `format` / `parse` の**2 系統**を持ち、`format` が渡されていればそちらが勝つ。`units` は `@tremolo-ui/functions` の `formatValue` / `parseValue` / `selectUnit` に支えられている。

2 系統あることで、

- 「`units` を渡したのに効かない」（`format` も渡していた）が起きる
- `parse` だけ渡すと `format` は `units` 由来のまま、といった噛み合わない組み合わせが型で防げない
- `Units`（`[string, number][]`）は SI 接頭辞の表を毎回手で書かせる形になっている（`[['Hz', 1], ['kHz', 1000]]`）

#### `digit` も一緒に消す

`digit` は `toFixed` の引数をそのまま渡すだけで、**組み込みフォーマッタにしか効かない**（`format` を渡すと無視される）。`units` を消すなら `digit` のためだけに組み込みフォーマッタを残すことになり、「2 系統ある」という動機がそのまま残る。

現状の挙動を確認した結果:

- **表示専用で値には触らない。** `digit={0}` `step={0.1}` で値 1.6 のとき、表示は `2` → `3` → `4` と 1 ずつ増えるのに実際の値は 1.6 → 2.6 → 3.6。`digit` と `step` は互いを知らない
- 編集中は `format` を通らない（`text = draft ?? format(value)`）ので、入力中だけ丸めが外れる
- `toFixed` の癖をそのまま被る。`(1.005).toFixed(2)` は `"1.00"`、`(-0.4).toFixed(0)` は `"-0"`、1e21 以上で指数表記になる
- 丸めた表示が値になることがある。入力欄に触ると draft が立ち、`commitDraft` が **draft の文字列**を parse するので、`"2"` を編集して戻すと値が 1.6 から 2 になる

**ただし表示と値のズレは `digit` を消しても直らない。** `format={(v) => v.toFixed(0)}` でも同じことが起きる。原因は「表示の桁と `step` が互いを知らない」ことなので 5.15 に分けた。

- [ ] `units` / `digit` / `Units` / `formatValue` / `parseValue` / `selectUnit` を削除し、`format` / `parse` だけにする。破壊的変更なので移行ガイドに載せる
- [ ] `units` を使っている example / story / ドキュメントを全部書き換える

#### 既存ライブラリの調査

**JS の単位・数値整形ライブラリを一通り見たが、そのまま真似できるものは無かった。**

| ライブラリ | 単位の扱い | 参考になる点 |
| --- | --- | --- |
| `Intl.NumberFormat` | `style: 'unit'` は**認可された 45 単位のみ**。`Intl.supportedValuesOf('unit')` に **`hertz` も `decibel` も無い** | オーディオでは使えないことの確認。`notation: 'engineering'` は `299.792E6` の指数表記で SI 接頭辞ではない |
| React Aria / Base UI の NumberField | `formatOptions` / `format` に `Intl.NumberFormatOptions` を渡すだけ。**関数を取らない** | 最も近い既存コンポーネントが単位の抽象化を持っていない。Hz / dB は利用者が外でやる前提 |
| `d3-format` | `format('s')` は**値ごとに接頭辞を選び、精度は有効数字**。`formatPrefix(spec, 基準値)` は**接頭辞を固定し、精度は小数桁** | この 2 つが別 API に分かれている。micro は `µ`、範囲は y(10⁻²⁴)〜Y(10²⁴)、`~` で末尾のゼロを落とす |
| `mathjs` | 単位定義ごとに `prefixes: 'none' \| 'short' \| 'long' \| 'binary_short' \| 'binary_long'` を宣言する。`dB` は単位として定義されている | **「この単位は接頭辞を取らない」を宣言で表す**という形。dB 問題の答えがここにある |
| `UnitMath` | `autoPrefix: 'auto' \| 'always' \| 'never'`、`prefixMin: 0.1` / `prefixMax: 1000`、`prefixesToChooseFrom: 'common' \| 'all'` | **接頭辞を切り替える閾値**を設定で持つ。表示される数が 0.1〜1000 に収まるように選ぶ |
| JUCE / webaudio-controls | 単位系そのものが無い。`stringFromValue` / `valueFromString`、`conv` / `rconv` の**関数 2 つ** | オーディオ領域の慣行は「関数 2 つ」。`format` / `parse` 一本化はこれと一致する |

**`format` / `parse` に一本化する方向はオーディオ領域の慣行と一致している。** 我々の価値は便利コンストラクタの質にあり、そこは d3-format / mathjs / UnitMath から borrow できる。

#### 便利コンストラクタ

- [ ] **名前は `siUnit` にしない。** SI でない単位（dB / % / cent / semitone）を接頭辞なしで素通しさせる以上、名前が嘘になる。`unitFormat` を推す
  - 返すのは `{ format, parse }` の対なので、名前は「何であるか」ではなく「何を作るか」を言うべき
  - `createUnit` は避ける。mathjs で「単位系に単位を定義する」という別の意味を持っており、かつ `@tremolo-ui/dom` では `create*` が「`destroy()` を持つ命令的インスタンス」を指す
  - `unit` は短いが、`clamp` / `mapValue` と並ぶ export としては汎用的すぎる
  - `NumberInput` が要求する 2 つの props をそのまま返すので、スプレッドで渡せる形になる

    ```tsx
    <NumberInput.Root {...unitFormat('Hz', { digits: 2 })} value={v} onChange={setV}>
    ```

- [ ] **`basePlace` は位置引数ではなくオプションに入れる。** つまみが 3 つあり、しかも**性質が違う**ので、位置引数だと確実に混同する

  | | 何を決めるか | 先例 |
  | --- | --- | --- |
  | `base` | **保存されている値**がどの接頭辞か（ms で持っている） | 無し。d3 も mathjs も「値は基本単位」前提。**我々の追加** |
  | 接頭辞の選び方 | 値ごとに動的か、固定か、付けないか | d3 の `s` / `formatPrefix`、UnitMath の `autoPrefix` |
  | 精度 | 小数桁（**A 採用**）か有効数字か | d3 は API ごとに違う |

  ```ts
  unitFormat('Hz')                                  // 1234 -> '1.23kHz'
  unitFormat('s', { base: 'm' })                    // 値は ms。1500 -> '1.5s'
  unitFormat('s', { base: 'm', digits: 2 })         // 1500 -> '1.50s'
  unitFormat('dB', { prefixes: false, digits: 1 })  // -6.25 -> '-6.3dB'
  ```

- [ ] **桁数は `digits`（小数桁）で持つ。** 5.13 の議論で A を採用した。`step` から既定値を導く案（B）は、`format` が `(value) => string` の純粋関数である以上 `Root` 側に暗黙の組み立てを足すことになり、「書式は 1 箇所を見れば分かる」という一本化の眼目を削るため採らない
- [ ] **接頭辞を取らない単位を宣言で表す。** mathjs の `prefixes: 'none'` と同じ考え方。`prefixes: false` で素通し
- [ ] **接頭辞を切り替える閾値を決める。** 現在の `selectUnit` は「値以下で最大のスケール」なので、0.0005 は `0.0005Hz` のままになる。UnitMath は**表示される数が 0.1〜1000 に収まる**ように選ぶ。この規則を採るかどうか
- [ ] **`0` を特別扱いする。** 対数で接頭辞を選ぶと `0` が扱えない。基本単位で出す
- [ ] **どの接頭辞まで使うか決める。** UnitMath の `prefixesToChooseFrom: 'common' | 'all'` と同じ問題。`p n µ m (なし) k M G` あたりに絞るのが実用的で、`yocto` や `yotta` は要らない
- [ ] **`parse` を対で受け渡す。** 片方だけ差し替えられると噛み合わなくなるので、`{ format, parse }` を返して両方一度に渡す形にする

#### parse 側の落とし穴（調査で判明）

- [ ] **`dB` に接頭辞を付けてはいけない。** `d` は deci なので、`unitFormat('B')` にすると `-6dB` が「-6 デシ B」と解釈される。mathjs も `dB` を独立した単位として定義している
- [ ] **micro の文字が 2 種類ある。** d3 が使う `µ`（U+00B5 MICRO SIGN）と `μ`（U+03BC GREEK SMALL LETTER MU）は見た目が同じで別コードポイント。**parse は `µ` / `μ` / `u` の 3 通りを全部受ける**（キーボードから `µ` は打てない）。format 側でどちらを出すかも決める
- [ ] **大文字小文字を潰さない。** `m` は 10⁻³、`M` は 10⁶
- [ ] **単位記号の前の 1 文字だけを接頭辞として剥がす。** 単位記号自体が接頭辞と同じ文字で始まる場合（`m` = メートル に対する `mm`）に誤読しないよう、単位記号を先に照合してから残りを見る

### 5.15 表示の桁と `step` が互いを知らない

5.14 の調査中に判明した。`NumberInput` の表示桁（現 `digit`、将来の `digits`）と `step` の間に関係が無いため、**両者が矛盾しても何も警告されない。**

`digit={0}` `step={0.1}` で値 1.6 のとき、上下キーを押すと表示は `2` → `3` → `4` と 1 ずつ増えるのに、`onChange` が渡す値は 1.6 → 2.6 → 3.6 になる。ユーザーには「2 から 1 ずつ足した」ようにしか見えない。

`digit` を消しても直らない（`format={(v) => v.toFixed(0)}` で同じことが起きる）ので、5.14 とは別に扱う。

- [ ] **そもそも防ぐべきかを決める。** 「表示は粗く、値は細かく」が正当な要求である場面もある（内部は連続値、表示は丸め）
- [ ] 防ぐなら、開発ビルドで警告するのが妥当か（5.6 の `useCheckPlacement` と同じ形）。ただし `format` は任意の関数なので、**表示桁を機械的に知る方法が無い**
- [ ] `step` から表示桁の既定値を導く案（5.14 の B 案）は一本化の眼目と衝突するため採らない。別の解き方が要る
- [ ] 5.13（上下キーでカーソル位置を保つ）と関係する。桁を選んで動かす操作を入れるなら、表示桁と `step` の関係を先に決める必要がある

### 5.16 NumberInput のフォーカス時に書式を外すオプション

`InputField` が表示するのは `text = draft ?? format(value)` なので、**フォーカスしただけでは書式が付いたまま**になる。`1.23kHz` と出ている欄を編集するには、単位ごと選び直すか、単位文字列の中にキャレットを置いて数字だけ直すことになる。DAW のパラメータ欄は、フォーカスすると素の数値になって打ち直せるものが多い。

`selectOnFocus='number'` は先頭の数字部分だけを**選択**するので近いことはできるが、**表示自体は書式付きのまま**なので、キーで選択を外すと単位の中を編集する羽目になる。

- [ ] **どの数を出すか決める。** ここが本質。`format` が接頭辞を選ぶと、表示上の数と保存されている値が違う
  - 値をそのまま出す（`1.23kHz` → `1230`）… 桁が跳ねるので見た目の変化が大きいが、`parse` との往復が正確
  - 表示から数字部分だけを取る（`1.23kHz` → `1.23`）… 変化は小さいが、**単位が消えた時点で 1.23 が何なのか分からなくなる**。この状態で blur すると `parse('1.23')` が 1.23 になり、値が 1000 分の 1 になる

  **前者を採る。** 後者は往復で値が壊れる。

- [ ] **`digits` で丸めた表示のまま編集させない。** 5.14 で見つけた「丸めた表示が値になる」（`digit={0}` で 1.6 が `2` と出ている欄に触れると値が 2 になる）は、フォーカス時に**丸めていない値**を出せば起きなくなる。このオプションはその対策も兼ねる
- [ ] **prop をどこに置くか。** `selectOnFocus` / `blurOnEnter` と同じく `InputField` に置く（`Root` ではない）。名前は `unformatOnFocus` あたり
- [ ] **`selectOnFocus` との関係を決める。** 書式を外すなら `'number'` と `'all'` の区別が無くなる（全部が数字になるため）。両立させるのか、`unformatOnFocus` を立てたら `'number'` は `'all'` と同じ扱いにするのかを決める
- [ ] **既定値は off。** 現在の見た目が変わるため
- [ ] **キャレットの位置。** フォーカス時にテキストを差し替えるとキャレットが末尾へ行く。`selectOnFocus` を併用しない場合にどこへ置くかは 5.13 と同じ問題
- [ ] **draft の扱い。** フォーカス時に「素の値」を draft として立てるのか、表示だけ差し替えて draft は null のままにするのかを決める。draft を立てると、**何も編集せずに blur しただけで `commitDraft` が走る**（現在は `draft === null` で早期 return している）
- [ ] IME 変換中にフォーカスが移る場合を壊さない

### 5.17 テストと story を実装コードと同じディレクトリに置く — **完了**

`plans/milestone.md` の「2. テスト整備」から移動。全コンポーネントに専用テストが揃った（Piano は 4.3、PointsEditor は Phase 5、XYPad は 5.7 と同時）ので、残るのは配置の話。

現在は `src/` の外に `__tests__/` と `__stories__/` を並べる構成になっている。1 つのコンポーネントに対応するものは `src/components/<Name>/` へ移す。

**複数のコンポーネントにまたがるものは `__tests__/` / `__stories__/` に残す**（`__tests__/drag.test.tsx`、`__tests__/Slider/compose.test.tsx`、`__tests__/util/placement.test.tsx`、`__stories__/combined/` など）。story 用のスタイルとヘルパー（`__stories__/lib/`、`__stories__/styles/`、`public/`、`intro.mdx`）も残す。

移すときに必要な作業:

- [x] **`package.json` の `files` から test と story を除いた。** `files` に `src` を入れているので、そのままだと publish されてしまう。`!` の否定パターンとブレース展開が使える
  ```jsonc
  "files": ["dist", "src", "!src/**/*.test.{ts,tsx}", "!src/**/*.stories.{ts,tsx}"]
  ```
  `npm pack --dry-run` で tarball に `.test.` / `.stories.` が 1 つも入らないことを確認した
- [x] **`.storybook/main.ts` の `stories` に `../src/**/*.stories.*` を足した。** 全 story が明示的な `title` を持っているのでサイドバーの並びは変わらない。ビルドした `index.json` で 23 タイトル 63 エントリが揃っていること（56 が `src/` 由来、7 が `__stories__/` 由来）を確認した
- [x] **`site/docusaurus.config.ts` の typedoc の `exclude` に足した。** `src/**/*.test.{ts,tsx}` と `src/**/*.stories.{ts,tsx}` の 2 行。**効くのは hooks 側だけ**で、`entryPoints` が `src/hooks/**/*.{ts,tsx}` と全ファイルを取るため。components 側は `index.{ts,tsx}` しか拾わないので元から影響しないが、`entryPoints` が後で変わったときのために同じ 1 行で両方を除いてある
- [x] **jest は変更不要だった。** `testMatch` が `**/*.test.[jt]s?(x)` で場所を問わず、`roots` は既定（`rootDir`）なので `src/` も走査する
- [x] **サイドバーの翻訳キーは衝突しなかった。** `exclude` で test / story のページ自体が生成されないため。`build:docs` を en / ja 両方で通してある

#### 残ったもの

`__stories__/styles/PointsEditor.module.css` は `PointsEditor.stories.tsx` 専用になったが、「story 用のスタイルは `__stories__/styles/` に残す」に従って置いたままなので、import が `../../../__stories__/styles/...` になっている。**`styles/Slider.module.css` の方は `combined/VolumeFader` が使っている**ので残るのが正しく、1 ファイルだけ移すかどうかは別途。

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

### 6.4 NumberInput の `normalized` モードが `min={0}` で例外を投げる（実バグ）→ **Phase 4.1 で修正済み**

`packages/react/src/components/NumberInput/InternalInput.tsx`

```ts
if (!min || !max) {
  throw new Error(
    '[NumberInput] "min" and "max" are required when InputEventOption[0] is set to "normalized".',
  )
}
```

`min={0}` は `!0 === true` なので、**min / max を正しく指定していても `wheel={['normalized', ...]}` / `keyboard={['normalized', ...]}` にすると例外が飛ぶ。** 6.1 の `useDrag` の delta バグと同じ「0 を falsy で弾く」型。

修正: `applyDelta` への置き換えで消えた。回帰テストは `packages/functions/__tests__/applyDelta.test.ts` と `packages/react/__tests__/NumberInput/draft.test.tsx` にある。

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
