# 1.0 リリースまでのマイルストーン

対象リポジトリ: `m1m0zzz/tremolo-ui`

1.0 を出すために必要な作業をまとめる。詳細な手順は各リンク先で管理する。

現在: 全パッケージ 0.4.0（Phase 3 をマージ済みで、次のリリースで 0.5.0）。破壊的変更を入れつつ 0.x に留まるため、changeset では `major` ではなく `minor` を選ぶ運用（[core-extraction-plan.md 8.3](./core-extraction-plan.md)）。

## 1. dom 切り出し

React 依存のロジックを framework-agnostic なコアへ切り出し、Vue / Svelte のラッパーを作れる状態にする。

詳細: **[core-extraction-plan.md](./core-extraction-plan.md)**

| | 状態 |
| --- | --- |
| Phase 0: 準備（changesets 移行を含む） | 完了 |
| Phase 1: `@tremolo-ui/dom` の器 + MIDI 移植 | 完了（0.3.0 でリリース済み） |
| Phase 2: `createDrag` / `createWheel` | 完了 |
| Phase 2.5: Slider / Knob / XYPad の実装統一 | 完了 |
| Phase 3: `createDragValue` | 完了 |
| Phase 4: Piano / AnimationCanvas / NumberInput | 完了（NumberInput [4.1](./core-extraction-plan.md) / AnimationCanvas [4.2](./core-extraction-plan.md) / Piano [4.3](./core-extraction-plan.md)） |
| Phase 5: zustand 除去 | 完了（`zustand` を dependencies から削除済み。`useSyncExternalStore` は使わずに済んだ） |
| 5 章: CSS ヘッドレス化・修飾キー・単位の扱い など | 5.1 / 5.2（CSS ヘッドレス化）、5.12（Knob が潰れる）、5.14（`format` 一本化）、5.17（テストと story の配置）が完了。5.16（フォーカス時に書式を外す）と 5.11 の wheel / keyboard も完了。5.13（上下キーでキャレット位置を保つ）、5.15（表示桁と `step`）、5.18（ドラッグの修飾キー）、5.19（浮動小数の誤差）、5.20（ドラッグ中のポインタ固定）、5.21（PointsEditor の複数選択）、5.22（見た目に関わる props）、5.23（`clsx` 除去と tree shaking）も完了。**5 章は全て完了。** 残るのは `PointsEditor` のドキュメントページ（5.21）だけ |

着手前に決める必要がある未確定事項（同ドキュメント 2 章）:

1. ~~値の所有者~~ → **Phase 3 で決定。ラッパーが持ち、コアは必要なときだけ `getValue()` で読む**
2. ~~NumberInput の扱い~~ → **Phase 4.1 で決定。Root が持つ state は編集中の draft 1 つだけ**
3. `@tremolo-ui/dom` の公開範囲（`createDrag` / `createWheel` を公開 API にするか）

> 3 については、Phase 2 の時点で `createDrag` / `createWheel` を `@tremolo-ui/dom` の公開 API として export 済み。Phase 3 で `createDragValue` / `elementMapping` / `relativeMapping` も加わった。追認するか、内部専用へ戻すかを決める。

## 2. テスト整備

- [x] **dom 移行前からテストが無い部分にテストを足す。** 全コンポーネントに専用のテストが揃った（Piano は 4.3、PointsEditor は Phase 5、XYPad は 5.7 と同時に追加）。`__tests__/drag.test.tsx` と `__tests__/Slider/compose.test.tsx` は複数コンポーネントにまたがるものとしてそのまま残す
- [x] **テストと story を実装コードと同じディレクトリに置く。** → [core-extraction-plan.md 5.17](./core-extraction-plan.md) で完了

## 3. Vue / Svelte

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
- [ ] `packages/<name>/LICENSE` を置く場合、`.oxfmtrc.json` の `ignorePatterns` に `LICENSE` があること（`.prettierignore` から移行済み。oxfmt は知らない拡張子を黙って飛ばすので、prettier のときのように pre-commit が落ちることは無いはず）
- [ ] Vercel の Storybook プロジェクトのビルドコマンドは `npm run build:sb`（全ワークスペースをビルドしてから Storybook をビルドする）であること
- [x] CSS の配布方法は決着した。**パッケージは CSS を配らない**ので、各パッケージで重複させるかという問題自体が無くなった（core-extraction-plan.md 5.1）。デモのテーマは `site/src/css/tremolo/` にあり、Vue / Svelte を足してもクラス名と状態属性さえ揃っていれば同じものが使える

## 4. ドキュメント整備

- [x] **`@tremolo-ui/dom` のドキュメントを追加する。** typedoc の 3 つ目の plugin として追加し、サイドバーに `@tremolo-ui/dom` のカテゴリを足した。

  **サイドバーの翻訳キーはラベルから作られ、それが 1 つのサイドバー内で衝突するとビルドが落ちる。** typedoc はページのラベルにモジュールパスの**最後のセグメントだけ**を使うので、`dom` を足した時点で `midi/input` と `piano/input` が両方 `input` になり、さらに `dom/piano` と `functions/piano` が衝突した。`sidebars.ts` の `withKeys()` で doc id（既に一意）を `key` に入れて解決している。パッケージが増えるたびに起きるので、新しい typedoc plugin を足すときはこれを通すこと。

  あわせて `packages/dom/src/piano/input.ts` を `piano/index.ts` に改名した（`dom` の公開 API は `exports` が `.` だけなので影響なし）。
- [x] **CSS のデモを公開する形に作り替えた。** `site/docs/tutorials/styling.mdx` を書き直し、`site/src/css/tremolo/` の 6 ファイルを `raw-loader` で全文タブ表示している。コピー元と、サイト / Storybook が実際に読み込むファイルは同一（core-extraction-plan.md 5.1）
- [ ] **`PointsEditor` のドキュメントページを書く。** `site/docs/components/` に存在しない唯一のコンポーネント。複数選択（core-extraction-plan.md 5.21）で書くことが増えた
- [ ] **hooks のドキュメントを充実させる。** 現在 `site/docs/hooks/` には `web-midi-api` しかない。`useDrag` / `useWheel` / `useDragValue` は typedoc の自動生成のみ
- [ ] **Vue / Svelte を足したときのドキュメント構成を決める。** 現在の `site/docs/components/<Name>/index.mdx` は React 前提で、live code block も `@tremolo-ui/react` をスコープに入れている（`site/src/theme/ReactLiveScope/index.tsx`）。フレームワークごとにタブを分けるのか、サイト自体を分けるのか
- [x] **移行ガイドを書く。** `site/docs/guides/migration.mdx`。新しいものから順に、変更前後のコードを並べて書く。CSS の配布方法変更（5.1）も Unreleased に載せたので、「Still to come」に残っている項目は無い
- [x] **`site/i18n` の typedoc サイドバー翻訳キーを掃除した。** `sidebar.typedocSidebar.*` を en / ja とも**全て削除**した（114 キー → 7 キー）。

  残骸を選り分けるつもりで調べたところ、**107 キーのうち翻訳されているものが 1 つも無かった**（`message` が全てラベルと同一）。しかも typedoc のラベルはモジュールパスとシンボル名（`math`、`useDrag`、`components/Slider`）で、**そもそも翻訳する対象ではない**。消してもラベルにフォールバックするだけなので表示は変わらず、ja の翻訳ファイルには「実際に翻訳が要る 7 個」だけが残る。

  `docusaurus write-translations` を走らせると再び追加されるが、それは翻訳が要るという意味ではない。API リファレンスのラベルは触らない方針。

- [x] `site/docs/support/CHANGELOG.md` の二重管理をやめた。中身は「TODO: record from version 1.0.0」のスタブのままだったので、各パッケージの `CHANGELOG.md` と GitHub リリース、移行ガイドへのリンクに置き換えた
- [x] **その GitHub へのリンクをやめ、リリースノートをサイトに載せた。** `site/scripts/changelog.mjs` が `packages/*/CHANGELOG.md` を front matter 付きで `site/docs/support/changelog-*.md` に写す。typedoc の `docs/api/` と同じ扱いで、生成物はコミットしない（`site/.gitignore`）
  - **`format: md` を front matter に入れるのが要点。** Docusaurus 3 の既定は `.md` も MDX として読むので、changesets が書いた文章に `<` や `{` が 1 つ紛れ込むだけでビルドが落ちる。生成物にだけ効かせられるので、サイト全体の `markdown.format` は触っていない
  - 生成は `site/package.json` の `start` / `start:fast` / `build` の頭に `npm run changelog` として書いた。npm の `pre*` に頼ると、`start:fast` のようにスクリプトが増えたときに付け忘れる
  - ja ロケールは翻訳が無いので既定ロケール（en）にフォールバックする。changesets が書くのは英語なので、そのままでよい
  - パッケージごとに 1 ページ。バージョンは 3 つとも揃うので**バージョン単位で 1 ページにまとめる**手もあるが、`Updated dependencies` の行を落とす前処理が要る割にサイトの体験は大きく変わらないので見送った
- [x] `format` に一本化するときに、`units` / `digit` を使っている example / story / ドキュメントを全部書き換えた（core-extraction-plan.md 5.14）
- [ ] **テンプレートをモノレポに移す。** 現在は別リポジトリ（`m1m0zzz/tremolo-ui-example-next-ts` / `m1m0zzz/tremolo-ui-example-vite-react-ts`）にある。破壊的変更のたびに追随を忘れる場所が増えるので、`templates/` としてこのリポジトリに入れ、**ドキュメントでは `degit` などで取り出す形をアナウンスする**（`npx degit m1m0zzz/tremolo-ui/templates/vite-react-ts`）。CI で少なくともビルドは通しておくと、破壊的変更の当たり判定になる
- [ ] 1.0 時点で `README.md` の「*tremolo-ui is now WIP*」と「An unstable version (0.x) has been released.」を更新する

## 5. 開発基盤とホスティング

**いずれも 1.0 の必須ではない。** リリースを止める理由にはしないが、置き場所としてここに残す。

### デプロイ先を Cloudflare Workers / `mimoz.dev` へ移す

- [ ] `mimoz.dev/tremolo-ui/` にドキュメントサイト、`mimoz.dev/tremolo-ui/i/storybook-react` に Storybook
- [ ] Vercel はリダイレクトとして残す
- [ ] preview は Cloudflare Access で保護する
- [ ] **Vercel のビルド回数制限（24 時間の rate limit）から抜けられるのが実利。** stacked PR で 3 レイヤ同時に上げると 6 デプロイが走って制限に当たり、プレビュー URL が出なくなっていた
- [ ] サブパス配信になるので、Docusaurus の `baseUrl` と Storybook の base path を確認する。i18n（`/ja/`）との組み合わせも

### ツールチェーンの見直し

いずれも「可能であれば」。**移行そのものが目的ではないので、詰まったら現状維持でよい。**

- [x] **jest → vitest。** `packages/*/vitest.config.ts` に `globals: true` と `environment` だけを置いた。`testMatch` の指定は不要（vitest の既定の `include` が `*.test.*` のみを拾うので、`__tests__` のヘルパーを掴まない）。`@tremolo-ui/*` の解決は vite が workspace の symlink 越しに `dist` を見るだけで、設定は要らなかった
  - `functions` は `environment: 'node'`。DOM を一切触らないので jsdom を作る必要がない
  - jest / ts-jest / jest-environment-jsdom / `@types/jest` が消えて **`node_modules` のパッケージが 2252 → 1908（-344）**
  - **速くはならなかった。** 全 502 件のルートからの実測で jest 6.4s / vitest 6.6s。実利は速度ではなく、ts-jest の transform 設定が消えること・ESM をそのまま扱えること・Storybook と同じ vite の設定を共有できること・watch がある（`test:watch`）ことの 4 つ
  - `react` は所要 4.3s のうち **63% が jsdom の生成**（1 ファイルにつき 1 つ、27 回）。vitest は `isolate: false` を勧めてくるが、**入れると 1 件落ちる**（`<body>` のインラインスタイルなど、ファイルをまたいで残るグローバルがある）ので既定のまま
  - `@types/jest` を落とすと `jest.Mock` / `jest.SpyInstance` の代わりが要る。`vi.fn` / `vi.spyOn` はグローバルだが型はグローバルではないので、`import type { Mock, MockInstance } from 'vitest'` を 8 ファイルに足した
  - **`jest-environment-jsdom` が連れてきていた `@types/jsdom` が `DOM.Iterable` を有効にしていた。** 外すと `tsc` が落ちるので、ルートの `tsconfig.json` の `lib` に明示した
- [x] **eslint / prettier → oxlint / oxfmt。** `.oxlintrc.json` と `.oxfmtrc.json` の 2 つになり（devDependency も oxlint / oxfmt の 2 つ）、`eslint.config.js` / `.prettierrc.json` / `.prettierignore` と devDependency 10 個（eslint 本体 + プラグイン 5 + typescript-eslint + prettier + 型 2）が消えた。**lint が 9.2s → 0.33s、format は 2.5s → 15ms**（リポジトリ全体、手元での実測）。`node_modules` のパッケージは 1908 → 1774（-134）で、vitest 分と合わせて main から **-478**
  - **争点だった `import/order` は oxlint に無い。** 代わりに **oxfmt の `sortImports`** が持つ（eslint-plugin-perfectionist と同じアルゴリズム）。`@tremolo-ui/**` は `customGroups` で external の直後に置き、`type` と `style` を最後にすれば今までと同じ並びになる。`packages/*/src` で動いたのは、CSS module の import が最後に来ていなかった `PointsEditor.stories.tsx` の 1 ファイルだけ（eslint は見落としていた）。あとは eslint が `ignores` に入れていた `site/examples` と `site/src/theme`
  - **`partitionByComment: true` が要る。** 既定では import の間のコメントを越えて並べ替えるので、`site/examples/*` の `// expand begin` / `// expand end`（ドキュメントの折りたたみ範囲）の外に import が飛び出す。`.storybook/preview.tsx` の CSS の塊も同じ理由で崩れた
  - `--migrate=prettier` で `.prettierrc.json` と `.prettierignore` をそのまま移せる。**整形結果の非互換はリポジトリ全体で 2 ファイルだけ**で、どちらも union 型の改行（`A | B | C` を先頭 `|` で縦に割る）
  - **`eslint-plugin-storybook` に相当するものは oxlint に無い。** 実際に `flat/recommended` を全 21 story + `main.ts` に当てて（warn の 3 つも error に上げて）測ったところ**指摘は 0 件**で、内訳は以下
    - **3 つは `no-restricted-imports` で取り戻した。** `no-renderer-packages` / `use-storybook-testing-library` / `use-storybook-expect`。glob は前方一致ではないので `@storybook/react` は落ちて `@storybook/react-vite` は通る。**Vue / Svelte を足すと `@storybook/vue3` と `@storybook/vue3-vite` を取り違える余地が実際に生まれる**ので、ここが実質の本命
    - **1 つは最初から適用されていなかった。** `no-uninstalled-addons` は `files` が `.storybook/main.@(js|cjs|mjs|ts)` とルート直下にアンカーされていて、`packages/react/.storybook/main.ts` にマッチしない。`**/` を足すと存在しないアドオン名をちゃんと error で捕まえるので、**モノレポでは黙って無効になるルール**。失ったのではなく元から無かった
    - **2 つは不発。** `await-interactions` / `context-in-play-function` は **play 関数が 1 つも無い**ので判定対象が存在しない（取り戻した 3 つのうち storybook/test 系の 2 つも、今は同じ理由で不発）
    - **代替が無いのは残り 5 つ。** `default-exports` / `story-exports` / `hierarchy-separator` / `no-redundant-story-name` / `prefer-pascal-case` で、いずれも CSF の書き方の統一
    - 代わりに vitest プラグインが入り、`test.only` の消し忘れなどを見るようになった
  - oxlint 固有の指摘は 23 件。実バグが 1 件（`expect(() => { expect(...) })` と入れ子になっていて内側に matcher が無い）、残りは `unicorn/no-useless-spread` と React Compiler 系の 3 ルールで、いずれも意図的な書き方だったので設定で切った
  - **oxlint は `eslint-disable` コメントも読む**が、名前空間が違う（`@typescript-eslint/x` → `typescript/x`）ので `oxlint-disable` に書き換えた。書き換えないと、後でそのルールを有効にしたときに黙って効かなくなる
  - **lint-staged には `--no-error-on-unmatched-pattern` が要る。** oxlint も oxfmt も、渡されたパスが全て ignore に当たると「対象が無い」で非ゼロ終了する（oxlint 1 / oxfmt 2）。`.md` だけのコミットが pre-commit で落ちるので、両方に付ける
  - ついでに CI に `lint` と `format:check` を足した。**今まで CI は lint を一度も回していなかった**（pre-commit の lint-staged だけ）。import の並び順が formatter 側に移ったので、`format:check` まで無いと同じところを見ていることにならない

## 1.0 の基準

以下が揃った時点で 1.0 とする。

- [x] コア切り出しが Phase 5 まで完了し、`@tremolo-ui/react` が薄いラッパーになっている
- [ ] Vue / Svelte のいずれかが公開されている（コアが framework-agnostic であることの実証）
- [x] CSS の配布方法が確定し、移行ガイドがある（5.1 / 5.2。パッケージは CSS を配らず、テーマはドキュメントで公開する）
- [ ] 公開 API が安定し、以降の破壊的変更に `major` を使う運用へ切り替えられる
