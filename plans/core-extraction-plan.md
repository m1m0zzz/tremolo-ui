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

`useSyncExternalStore` は結局どこにも入れていない。**外から変わる値を購読する必要が無い**（ポインタもホイールも MIDI も、コアのインスタンスがコールバックで通知してくる）ため、使う理由が無かった。

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

`packages/react/__tests__/PointsEditor/index.test.tsx` を新規追加（17 件）。PointsEditor は専用テストが無かった。ドラッグが「動いた距離」ではなく「指した位置」を返すこと、`min` / `max` のクランプ、`readonly` / `disabled` の継承と上書き、矢印キーの向き、ホイールのフォーカス要求、`Container` の ref 合成、`Root` の外での例外までを見る。点が 2 つある場合のホイールの配り先（フォーカス中の点が動き、カーソル下の点は動かない / 反応するのは 1 つだけ）も含む。

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

**設計は 4.3 に集約した。タスクもそちらにある。** ここには経緯だけ残す。

当初の想定「`usePianoDrag` を `createDragValue` ベースに置き換える。差は pointerdown で発火するかだけで `updateOnPointerDown` で吸収できる」は**誤りだった**（理由は 4.3「なぜ `createDragValue` を使わないか」）。マルチタッチには `createDrag` 側の拡張が要り、当たり判定は軸のマッピングでは表せない。

`index.tsx:193` の TODO（マルチタッチには TouchEvent が必要そう）については、**Pointer Events が `pointerId` で複数ポインタを区別できるため TouchEvent は不要**、という判断で変わらない。

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

### 5.9 wheel はフォーカス時のみ発火させる — 全コンポーネント

現在 wheel を持つのは Slider / Knob / XYPad / PointsEditor / NumberInput の 5 つで、**いずれもホバーしているだけで発火し、`event.preventDefault()` でページスクロールを奪う。** 長いフォームやドキュメントの上をスクロールしていて、たまたま通過したコントロールの値が変わる事故が起きる。Base UI / Chakra v3 も NumberField は「フォーカス時のみ」にしている。

- [x] `createWheel` に「要素の中にフォーカスがあるときだけ発火する」オプションを足す（`requireFocus`。あわせて `update()` も追加）
- [x] Slider / Knob / XYPad / NumberInput をそれに切り替える（**PointsEditor は対象外**。`wheel` / `keyboard` prop を宣言しているだけで、どこからも使っていない。下記参照）
- [ ] 移行ガイドに載せる（挙動の破壊的変更）

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

### 5.10 緩い等価（`==` / `!=`）をやめる

ESLint に `eqeqeq` を設定しておらず、`==` / `!=` がリポジトリ全体に散っている。**現時点で `eqeqeq: ['error', 'always']` を掛けると 88 件**（`packages/*/src` + `site/src` + `__stories__`。内訳は `packages/react/src` 39 / `packages/functions/src` 26 / `packages/react/__stories__` 21 / `packages/dom/src` 8 / `site/src` 5）。

大半は TypeScript で型が付いていて両辺が同じ型なので、実際に型強制は起きていない。**現状で動いているバグは見つかっていない**が、

- 意図して nullish をまとめて見ている箇所（`drag == null`、`min != undefined` など 14 件ほど）と、単に型が同じもの（`key == 'Enter'`、`typeof note == 'string'` など）が**見分けられない**。`== null` は「null と undefined の両方」という意図の表明として有用なのに、周りが全部 `==` だとその情報が消える
- 実際に `Piano/KeyLabel.tsx` のラベル判定で「`undefined` は入っているのか」が読んで分からない状態になっていた（4.3 で明示的な比較に直した）

- [ ] `eslint.config.*` に `eqeqeq` を足す。`null: 'ignore'` を付けるか、`always` で厳密にするかを決める（`null: 'ignore'` にしても減るのは 7 件だけ。`!= undefined` は対象外なので実質ほぼ変わらない）
- [ ] 88 件を潰す。**`eqeqeq` の autofix は 1 件も効かない**（ESLint の fixer は両辺の型を確実に判定できるときしか出ないため、実測で fixable 0 件）ので全て手で見る
- [ ] nullish をまとめて見たい箇所は `== null` を残すのか、`=== null || === undefined` に開くのか、`?? ` / optional chaining に書き換えるのかを決めて統一する
- [ ] 1 回の変更でまとめて直す。段階的にやると新旧が混在した状態が長く残り、どちらが意図的なのか余計に分からなくなる

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
