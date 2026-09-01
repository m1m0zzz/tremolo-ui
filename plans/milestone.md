# 1.0 リリースまでのマイルストーン

対象リポジトリ: `m1m0zzz/tremolo-ui`

1.0 を出すために必要な作業を 3 つにまとめる。詳細な手順は各リンク先で管理する。

現在: 全パッケージ 0.3.0。破壊的変更を入れつつ 0.x に留まるため、changeset では `major` ではなく `minor` を選ぶ運用（[core-extraction-plan.md 7.3](./core-extraction-plan.md)）。

---

## 1. dom 切り出し

React 依存のロジックを framework-agnostic なコアへ切り出し、Vue / Svelte のラッパーを作れる状態にする。

詳細: **[core-extraction-plan.md](./core-extraction-plan.md)**

| | 状態 |
| --- | --- |
| Phase 0: 準備（changesets 移行を含む） | 完了 |
| Phase 1: `@tremolo-ui/dom` の器 + MIDI 移植 | 完了（0.3.0 でリリース済み） |
| Phase 2: `createDrag` / `createWheel` | 実装完了。**ブラウザでの手動回帰確認が未実施** |
| Phase 3: `createDragValue` | 未着手 |
| Phase 4: Piano / AnimationCanvas / NumberInput | 未着手 |
| Phase 5: zustand 除去 | 未着手 |
| 4.5: CSS ヘッドレス化・内部ユーティリティ削除・Knob 描画修正 | 未着手 |

着手前に決める必要がある未確定事項（同ドキュメント 2 章）:

1. 値の所有者（コアが `value` を保持するか、ラッパーが保持するか）— Phase 3 で必要
2. NumberInput の扱い（`<input>` のテキストが値の裏付けであり他と性質が異なる）— Phase 4 で必要
3. `@tremolo-ui/dom` の公開範囲（`createDrag` / `createWheel` を公開 API にするか）

> 3 については、Phase 2 の時点で `createDrag` / `createWheel` を `@tremolo-ui/dom` の公開 API として export 済み。追認するか、内部専用へ戻すかを決める。

---

## 2. Vue / Svelte

コア切り出しが Phase 3 まで進み、`createDragValue` の形が固まってから着手する。

- [ ] `@tremolo-ui/svelte`（action ベース。`use:drag={handlers}`。コアのシグネチャとほぼ同型なので最も薄い）
- [ ] `@tremolo-ui/vue`（composable または custom directive）

ラッパーの形はフレームワークごとに変えてよく、統一しない。

### 新パッケージを追加する際の手順（Phase 1 で確立）

順序を守らないと CI が落ちる。

1. **コードを main に入れる前に**、ローカルから手動 publish（`npm publish -w packages/<name>`）
2. npm 側で trusted publisher を登録（repo: `m1m0zzz/tremolo-ui`、workflow: `release.yml`）
3. その後にコードを push し、changeset を追加

理由: `changesets/action` は `publish-script` を渡してあると **changeset が無いときにこそ publish を実行する**ため、npm 上に存在しない新パッケージが main に入った時点で E404 で落ちる。

あわせて必要になるもの:

- [ ] ローカル publish には npm へのログインが必要（普段の publish は CI の OIDC 経由なので、ローカルの authToken が失効していることがある。scoped パッケージでは未認証でも 401 ではなく E404 が返るため `npm whoami` で切り分ける）
- [ ] `.changeset/config.json` の `fixed` は `[["@tremolo-ui/*"]]` のグロブなので**変更不要**
- [ ] `packages/<name>/LICENSE` を置く場合、`.prettierignore` に `LICENSE` があること（追加済み）
- [ ] Vercel の Storybook プロジェクトのビルドコマンドは `npm run build:sb`（全ワークスペースをビルドしてから Storybook をビルドする）であること
- [ ] CSS の配布方法を決めてから着手する（各パッケージで重複させるか、共通パッケージにするか）。core-extraction-plan.md 4.5.1 と一体

---

## 3. ドキュメント整備

- [ ] **`@tremolo-ui/dom` のドキュメントを追加する。** 現在 typedoc の対象は `functions` と `react` のみで（`site/docusaurus.config.ts` の `typedocPlugins()`）、dom は API リファレンスにすら載っていない
- [ ] **CSS のデモを公開する形に作り替える。** Radix UI / Base UI と同じく、パッケージはスタイルを配らず、ドキュメント上でデモの CSS をコピーできるようにする（core-extraction-plan.md 4.5.1）
- [ ] **hooks のドキュメントを充実させる。** 現在 `site/docs/hooks/` には `web-midi-api` しかない。`useDrag` / `useWheel` / `useDragWithElement` は typedoc の自動生成のみ
- [ ] **Vue / Svelte を足したときのドキュメント構成を決める。** 現在の `site/docs/components/<Name>/index.mdx` は React 前提で、live code block も `@tremolo-ui/react` をスコープに入れている（`site/src/theme/ReactLiveScope/index.tsx`）。フレームワークごとにタブを分けるのか、サイト自体を分けるのか
- [ ] **移行ガイドを書く。** 0.x の間に入れた破壊的変更（`useDrag` / `useDragWithElement` の戻り値変更、`DragObserver` / `WheelObserver` の削除、CSS の配布方法変更）をまとめる
- [ ] `site/docs/support/CHANGELOG.md` は手書きだが、changesets 移行により各パッケージの `CHANGELOG.md` が自動生成されるようになった。二重管理をやめる
- [ ] 1.0 時点で `README.md` の「*tremolo-ui is now WIP*」と「An unstable version (0.x) has been released.」を更新する

---

## 1.0 の基準

以下が揃った時点で 1.0 とする。

- [ ] コア切り出しが Phase 5 まで完了し、`@tremolo-ui/react` が薄いラッパーになっている
- [ ] Vue / Svelte のいずれかが公開されている（コアが framework-agnostic であることの実証）
- [ ] CSS の配布方法が確定し、移行ガイドがある
- [ ] 公開 API が安定し、以降の破壊的変更に `major` を使う運用へ切り替えられる
