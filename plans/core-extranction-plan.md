# tremolo-ui コア切り出し計画

対象リポジトリ: `m1m0zzz/tremolo-ui`
目的: React 依存のロジックを framework-agnostic なコアへ切り出し、React / Vue / Svelte のラッパーを提供できる構成にする。

---

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

**これらは changesets へ置き換える（第7章参照）。**

---

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

---

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

---

## 4. 作業タスク

### Phase 0: 準備

- [x] `packages/react` の依存 `@tremolo-ui/functions": "^0.1.6"` が実バージョン 0.2.0 とずれている。意図的か確認し、必要なら修正
- [x] devDependencies の `eslint-plugin-lit-a11y` が Web Components 中止により不要か確認、不要なら削除
- [x] 現行の React 公開 API のスナップショットを残す（破壊的変更の差分を後から説明するため）
- [x] **changesets への移行を先に完了させる（第7章）**。dom 追加より前にやること

### Phase 1: `@tremolo-ui/dom` の器を作り、MIDI だけ移す

ロジックの複雑さ抜きでパッケージ分割の配線を検証するのが目的。MIDI 系はコンポーネントと無関係な Web MIDI API ラッパーなので最適。

- [x] `packages/dom` を作成。`package.json` は functions のものを雛形にする（`type: module`, tsdown, `exports` の require/import 分岐）
- [x] ルート `package.json` の `workspaces` に `packages/dom` を追加
- [x] `useMIDIAccess` / `useMIDIInput` / `useMIDIMessage` のロジックを `createMIDIAccess` 等としてコアへ移植
- [x] `@tremolo-ui/react` 側は同名 hook を維持し、内部でコアを呼ぶだけにする
- [x] ~~`.changeset/config.json` の `fixed` に `@tremolo-ui/dom` を追加~~ → 変更不要。`fixed` は `[["@tremolo-ui/*"]]` のグロブなので dom を自動的に含む（`changeset status` で確認済み）
- [x] `build.yml` にも dom を追加
- [ ] **`@tremolo-ui/dom` の初回 publish はローカルから手動で行う**（trusted publishing は npm 上にパッケージが存在しないと設定できないため）
- [ ] npm の `@tremolo-ui/dom` 設定で trusted publisher を登録（org/user・repo・ワークフローファイル名。既存2パッケージと同じ workflow を指す）
- [ ] 実際に 1 リリース通して npm 上で依存が解決できることを確認

**現状**: コードは実装・検証済み（dom のテスト15件、`npm run test` / `lint` / `build:package` / `build:docs` すべて green。react の dist は `@tremolo-ui/dom` を外部依存として保持し、attw / publint も通る）。
**ただし changeset はまだ追加していない。** dom が npm 上に存在しない状態でリリースが走ると publish に失敗するため、上の手動 publish と trusted publisher 登録が済むまで changeset を追加しないこと。手順:

1. ローカルから `npm publish -w packages/dom`（現在 0.2.1）
2. npm の `@tremolo-ui/dom` 設定で trusted publisher を登録（repo: `m1m0zzz/tremolo-ui`, workflow: `release.yml`）
3. `npm run changeset` で changeset を追加して push → version PR をマージ（全パッケージが 0.2.2 へ）

### Phase 2: `createDrag` / `createWheel`

- [ ] `useDrag` のバグ修正（後述）を反映した `createDrag` をコアに実装
- [ ] Pointer Events に一本化（現行の `useDrag` は `pointerdown` + `mousemove` + `touchmove` + `pointerup` の混在）
- [ ] `setPointerCapture` を使い、window への `mousemove` / `pointerup` 購読を不要にする
- [ ] `createWheel` は現行 `useRefCallbackEvent('wheel', ..., { passive: false })` の挙動を踏襲する
- [ ] `DragObserver` / `WheelObserver` / `useDrag` / `useDragWithElement` をコア呼び出しに差し替え
- [ ] 既存の Storybook で回帰確認

### Phase 3: `createDragValue`

- [ ] `useDragWithElement`（要素の bounding rect に対する正規化）をコアへ移植
- [ ] `createDragValue` として、座標写像を差し替え可能な形にまとめる
- [ ] Knob / Slider / XYPad / PointsEditor を `createDragValue` ベースに差し替え
- [ ] Phase 2/3 の時点で「値の所有者」を確定させ、全コンポーネントで `value` / `onChange` の意味論（step の丸め、範囲外の扱い）を揃える

### Phase 4: 残りのコンポーネント

- [ ] Piano（マルチタッチ、グリッサンド。`usePianoDrag` が該当）
- [ ] AnimationCanvas（rAF + ResizeObserver + DPR。`canvas.ts` と `index.tsx` 計 約280行）
- [ ] NumberInput（テキスト入力はラッパー担当、ドラッグ/矢印キー増減はコア、パース・フォーマット・clamp・step は純粋関数）

### Phase 5: zustand 除去

- [ ] 5コンポーネントのストア内容の方針を統一（設定のみ / 値も持つ）
- [ ] コアのインスタンスが同等の情報を持つようにする
- [ ] React 側は `useSyncExternalStore` でセレクタ購読に置換
- [ ] `zustand` を dependencies から削除
- [ ] `SliderProvider` の `useEffect(..., [props])` は props が毎レンダー新しいオブジェクトのため毎回 `setState` が走る。置換時に解消する

### Phase 6: Vue / Svelte

- [ ] `@tremolo-ui/svelte`（action ベース。コアのシグネチャとほぼ同型なので最も薄い）
- [ ] `@tremolo-ui/vue`（composable または directive）
- [ ] CSS の配布方法を再検討（現状 react の `exports` に `./styles/*.css` がコンポーネント単位で並んでいる。共通化するか各パッケージで重複させるか）

---

## 5. 既存コードで見つかった問題

### 5.1 `useDrag` の delta 計算バグ（実バグ）

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

### 5.2 `useDrag` のイベント混在（設計上の問題）

`pointerdown`（React 合成イベント）で開始し、移動は window の `mousemove` と要素の `touchmove` を購読、終了は window の `pointerup`。pointer 系と mouse/touch 系が混在している。

ブラウザはペン入力に対して互換マウスイベントを発火するため直ちに壊れるとは限らないが、保守上は Pointer Events への統一が望ましい。`useDragWithElement` は `pointermove` で統一されており、そちらが正しい形。

### 5.3 確認事項（バグとは断定していない）

- ~~`packages/react` の `@tremolo-ui/functions` 依存が `^0.1.6`、実バージョンは 0.2.0~~ → **調査済み・修正済み（意図的ではない）**。0.1.6 のリリースでは `^0.1.5 → ^0.1.6` に更新できているが、0.2.0 のリリース（`86e43e7`）ではバージョンしか上がっていない。publish.sh の `npm i "@tremolo-ui/functions@$NEW_VERSION"` は、その時点でまだ npm に存在しないバージョンを指定するため、レンジ更新が成立しないことがある（`.npmrc` の `min-release-age` は 0.2.0 より後に追加されたので原因ではない）。結果として npm 上の `@tremolo-ui/react@0.2.0` は `@tremolo-ui/functions@^0.1.6` に依存している。ただし functions の v0.1.6→0.2.0 の差分は JSDoc の `@category` タグ削除のみで公開 API は同一のため、実害は出ていない。changesets の `updateInternalDependencies` はローカルのバージョンを見て書き換えるため、この不具合は構造的に解消される
- 両パッケージのトップレベル `"types": "dist/index.d.cts"` が CJS 用の宣言ファイルを指している。`exports` マップ側は require/import で正しく分岐しているため実害は出にくいが、`exports` を見ない古いツールチェーンでは ESM 利用者に CJS の型が渡る。`@arethetypeswrong/core` が devDependencies に入っているので、それで検証するとよい

---

## 6. 検証状況

**リポジトリを読んで確認済み**: パッケージ構成、両 package.json の依存と exports、`@tremolo-ui/functions` の全公開関数、コンポーネント/hooks の一覧とファイル構成、5つの zustand ストアの `State` 型、`useDrag` / `useDragWithElement` / `useRefCallbackEvent` / `DragObserver` / `WheelObserver` の全文、`PointsEditor/Point.tsx` の前半、`scripts/publish.sh`、`.github/workflows/release.yml`、ルート `package.json`

**未確認**: `AnimationCanvas`（`index.tsx` / `canvas.ts`）、`Piano/index.tsx` と `usePianoDrag`、`Slider/index.tsx`、`XYPad/index.tsx`、`Knob/index.tsx` の本体、`NumberInput/InternalInput.tsx`、各 CSS、テストの実態、`site/` 配下

上記の未確認ファイルは Phase 3〜4 の対象であり、着手時に読む必要がある。特に Piano と AnimationCanvas は本計画で内部を確認していないため、工数見積もりは暫定。

---

## 7. changesets への移行

`scripts/publish.sh` + タグ駆動 release.yml を廃止し、changesets に置き換える。dom / vue / svelte を追加していく前提では、依存範囲の更新と CHANGELOG 生成が自動化される利点が大きい。**Phase 1 より前に完了させること。**

### 7.1 挙動の変化

| | 現行 | changesets |
| --- | --- | --- |
| バージョン決定 | `publish.sh patch` を手で実行 | 変更ごとに `.changeset/*.md` を追加、集約して自動決定 |
| リリーストリガ | `v0.2.0` タグの push | main への push → "Version Packages" PR → **その PR のマージ** |
| タグ | 単一の `v0.2.0` | パッケージごと（`@tremolo-ui/react@0.3.0` 等） |
| CHANGELOG | なし（site 側に手書き） | 自動生成 |

タグ形式が変わるため、`release.yml` のトリガを `on: push: tags:` から `on: push: branches: [main]` に変更する必要がある。

### 7.2 設定

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

### 7.3 0.x でのバージョン運用

破壊的変更を入れつつ 0.x に留まりたいので、**破壊的変更でも `major` ではなく `minor` を選ぶ運用**にする。

**検証済み**（`changeset version` をローカルで空打ちして確認）:

| changeset の種類 | functions | react | react の functions 依存 |
| --- | --- | --- | --- |
| `major` | 0.2.0 → **1.0.0** | 0.2.0 → **1.0.0** | `^0.2.0` → `^1.0.0` |
| `minor` | 0.2.0 → 0.3.0 | 0.2.0 → 0.3.0 | `^0.2.0` → `^0.3.0` |

`major` は 0.x を維持せず 1.0.0 になる。また `fixed` が効いており、changeset を付けたのが react だけでも functions が同時に bump され、内部依存のレンジも自動で更新される。

### 7.4 OIDC (trusted publishing) との組み合わせ — 要注意

`changeset publish` は内部で npm の publish を呼ぶため OIDC 自体は機能するが、既知の落とし穴が2つある。

1. **npm CLI 11.5.1 未満だと、認証エラーではなく誤解を招く `E404 Not Found` が返る。** 現行 release.yml の `npm install -g npm@latest` は維持すること
2. **changesets/action + scoped パッケージ + OIDC で E404 になる報告がある**（npm/cli#8976、2026年2月時点で open）。移行後の初回リリースで失敗した場合は、この既知問題を疑う。回避策は npm Automation トークン（`NODE_AUTH_TOKEN`）へのフォールバック

また、trusted publishing は **npm 上にパッケージが既に存在しないと設定できない**。`@tremolo-ui/dom` / `vue` / `svelte` は、いずれも初回だけローカルから手動 publish する必要がある。

npm 側の trusted publisher 設定はワークフローの**ファイル名**に紐づく。`release.yml` という名前を維持すれば既存2パッケージの設定を変更せずに済む。changesets/action は version PR 作成と publish を同一ワークフローで行うため（changesets/action#515）、ワークフローを分割したくなるが、分割すると npm 側の再設定が必要になる点に注意。

### 7.5 タスク

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
