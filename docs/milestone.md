# 1.0 リリースまでのマイルストーン

対象リポジトリ: `m1m0zzz/tremolo-ui`

1.0 を出すために必要な作業をまとめる。詳細な手順は各リンク先で管理する。

現在: 全パッケージ 0.5.0。破壊的変更を入れつつ 0.x に留まるため、changeset では `major` ではなく `minor` を選ぶ運用（[core-extraction-plan.md 8.3](./core-extraction-plan.md)）。

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
| 5 章: CSS ヘッドレス化・修飾キー・単位の扱い など | 5.1 / 5.2（CSS ヘッドレス化）、5.12（Knob が潰れる）、5.14（`format` 一本化）、5.17（テストと story の配置）が完了。5.16（フォーカス時に書式を外す）と 5.11 の wheel / keyboard も完了。5.13（上下キーでキャレット位置を保つ）、5.15（表示桁と `step`）、5.18（ドラッグの修飾キー）、5.19（浮動小数の誤差）、5.20（ドラッグ中のポインタ固定）、5.21（PointsEditor の複数選択）、5.22（見た目に関わる props）、5.23（`clsx` 除去と tree shaking）も完了。**5 章は全て完了。** 5.21 で残っていた `PointsEditor` のドキュメントページも書いた |

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
- [x] `.changeset/config.json` の `fixed` は `[["@tremolo-ui/*"]]` のグロブなので**変更不要**
- [x] `packages/<name>/LICENSE` を置く場合、`.oxfmtrc.json` の `ignorePatterns` に `LICENSE` があること（`.prettierignore` から移行済み。oxfmt は知らない拡張子を黙って飛ばすので、prettier のときのように pre-commit が落ちることは無いはず）
- [ ] Storybook を持つパッケージなら、`packages/react/wrangler.jsonc` に倣って Worker と `tremolo-ui.mimoz.dev/i/storybook-<name>*` の Route を足し、`ci.yml` と `pull-request.yml` の**両方**にビルドとデプロイの手順を足す
- [x] CSS の配布方法は決着した。**パッケージは CSS を配らない**ので、各パッケージで重複させるかという問題自体が無くなった（core-extraction-plan.md 5.1）。デモのテーマは `shared/css/` にあり、Vue / Svelte を足しても、各パートが `className` を受け取り同じ `data-*` 属性を出していれば同じものが使える

## 4. ドキュメント整備

- [x] **`@tremolo-ui/dom` のドキュメントを追加する。** typedoc の 3 つ目の plugin として追加し、サイドバーに `@tremolo-ui/dom` のカテゴリを足した。

  **サイドバーの翻訳キーはラベルから作られ、それが 1 つのサイドバー内で衝突するとビルドが落ちる。** typedoc はページのラベルにモジュールパスの**最後のセグメントだけ**を使うので、`dom` を足した時点で `midi/input` と `piano/input` が両方 `input` になり、さらに `dom/piano` と `functions/piano` が衝突した。`sidebars.ts` の `withKeys()` で doc id（既に一意）を `key` に入れて解決している。パッケージが増えるたびに起きるので、新しい typedoc plugin を足すときはこれを通すこと。

  あわせて `packages/dom/src/piano/input.ts` を `piano/index.ts` に改名した（`dom` の公開 API は `exports` が `.` だけなので影響なし）。
- [x] **CSS のデモを公開する形に作り替えた。** `site/docs/tutorials/styling.mdx` を書き直し、`shared/css/` の 6 ファイルを `raw-loader` で全文タブ表示している。コピー元と、サイト / Storybook が実際に読み込むファイルは同一（core-extraction-plan.md 5.1 / 9.4）
- [x] **`PointsEditor` のドキュメントページを書く。** `site/docs/components/PointsEditor/` に追加した。複数選択（core-extraction-plan.md 5.21）と `SelectionBox` にも触れている
- [ ] **hooks のドキュメントを充実させる。** 現在 `site/docs/hooks/` には `web-midi-api` しかない。`useDrag` / `useWheel` / `useDragValue` は typedoc の自動生成のみ
- [ ] **Vue / Svelte を足したときのドキュメント構成を決める。** 現在の `site/docs/components/<Name>/index.mdx` は React 前提で、live code block も `@tremolo-ui/react` をスコープに入れている（`site/src/theme/ReactLiveScope/index.tsx`）。フレームワークごとにタブを分けるのか、サイト自体を分けるのか
- [x] **`site/i18n` の typedoc サイドバー翻訳キーを掃除した。** `sidebar.typedocSidebar.*` を en / ja とも**全て削除**した（114 キー → 7 キー）。

  残骸を選り分けるつもりで調べたところ、**107 キーのうち翻訳されているものが 1 つも無かった**（`message` が全てラベルと同一）。しかも typedoc のラベルはモジュールパスとシンボル名（`math`、`useDrag`、`components/Slider`）で、**そもそも翻訳する対象ではない**。消してもラベルにフォールバックするだけなので表示は変わらず、ja の翻訳ファイルには「実際に翻訳が要る 7 個」だけが残る。

  `docusaurus write-translations` を走らせると再び追加されるが、それは翻訳が要るという意味ではない。API リファレンスのラベルは触らない方針。

- [x] `site/docs/support/CHANGELOG.md` の二重管理をやめた。中身は「TODO: record from version 1.0.0」のスタブのままだったので、各パッケージの `CHANGELOG.md` と GitHub リリース、移行ガイドへのリンクに置き換えた
- [x] **その GitHub へのリンクをやめ、リリースノートをサイトに載せた。** `site/scripts/changelog.mjs` が `packages/*/CHANGELOG.md` を front matter 付きで `site/docs/changelog/<pkg>.md` に写す。typedoc の `docs/api/` と同じ扱いで、生成物はコミットしない（`site/.gitignore`。手書きの `index.md` だけ `!` で除外を戻す）
  - **`format: md` を front matter に入れるのが要点。** Docusaurus 3 の既定は `.md` も MDX として読むので、changesets が書いた文章に `<` や `{` が 1 つ紛れ込むだけでビルドが落ちる。生成物にだけ効かせられるので、サイト全体の `markdown.format` は触っていない
  - 生成は `site/package.json` の `start` / `start:fast` / `build` の頭に `npm run changelog` として書いた。npm の `pre*` に頼ると、`start:fast` のようにスクリプトが増えたときに付け忘れる
  - ja ロケールは翻訳が無いので既定ロケール（en）にフォールバックする。changesets が書くのは英語なので、そのままでよい
  - サイドバーの `Support` カテゴリは無くなり、`Changelog` カテゴリの index が手書きの説明ページ（`/docs/changelog/`）、その下にパッケージごとの 3 ページという形にした
  - **`autogenerated` は、カテゴリが `link` に指定している doc を一覧から外してくれない。** 外れるのは、ジェネレータ自身がフォルダから作ったカテゴリの場合だけ。手書きのカテゴリに `dirName` を渡すと `index.md` が一覧の末尾にもう 1 度出る（`sidebar_position` が無いので最後に回る）。`items` にパッケージの 3 ページを直接並べて解決した。生成元の `site/scripts/changelog.mjs` も同じパッケージ一覧を持っているので、増減は 2 箇所を一緒に直す
  - `write-translations` / `i18n:ja` にも `npm run changelog` を付けた。doc id を直接書いたので、生成前に docs を読ませると「そんな doc は無い」で落ちる
  - 生成ページには `custom_edit_url: null` も入れた。GitHub 上に編集先が無いため（`docs/api/` は同じ理由で edit リンクが 404 のままになっている。別途）
  - パッケージごとに 1 ページ。バージョンは 3 つとも揃うので**バージョン単位で 1 ページにまとめる**手もあるが、`Updated dependencies` の行を落とす前処理が要る割にサイトの体験は大きく変わらないので見送った
- [x] `format` に一本化するときに、`units` / `digit` を使っている example / story / ドキュメントを全部書き換えた（core-extraction-plan.md 5.14）
- [x] **テンプレートをモノレポに移す。** 別リポジトリ（`m1m0zzz/tremolo-ui-example-next-ts` / `m1m0zzz/tremolo-ui-example-vite-react-ts`）にあったものを、0.5.0 の API で書き直して `templates/` に入れた（決まりごとは `templates/README.md`）。破壊的変更のたびに追随を忘れる場所が増えるので、`templates/` としてこのリポジトリに入れ、**ドキュメントでは `degit` などで取り出す形をアナウンスする**（`npx degit m1m0zzz/tremolo-ui/templates/vite-react-ts`）。CI で少なくともビルドは通しておくと、破壊的変更の当たり判定になる
- [ ] **複数のタブ（ファイル）を持てる Playground を作る。** 現状の `site/src/theme/Playground/` は 1 ファイルの live code が前提で、CSS Module のような 2 つ目のファイルは `externalFiles` で外部 Playground に書き出すときにしか渡らない。iframe 化（[core-extraction-plan.md 9.7](./core-extraction-plan.md)）と一緒に検討する
- [x] **bug: styling ページの CSS Modules の部分**（`site/docs/tutorials/styling.mdx`）。例のノブが 0×0 で表示されていなかった。コンポーネントが書くのは `--knob-size` だけで、`width` / `height` はテーマ側が持つのに、例の `my-knob.module.css` にそれが無かった。ダークモードの `.dark` も `:global` が無く、module にリネームされて効いていなかった
- [x] **各コンポーネントのページに `data-*` の説明を置く。** あわせて styling ページの `data-*` の一覧表（`🚦State`）は消し、各ページへのリンクにした
- [ ] **API（props）の一部をコンポーネントのページへ移す。** typedoc の API ページは残したまま、主要な props の説明をコンポーネントのページでも読めるようにする

## 5. 開発基盤とホスティング

**いずれも 1.0 の必須ではない。** リリースを止める理由にはしないが、置き場所としてここに残す。

### デプロイ先を Cloudflare Workers / `tremolo-ui.mimoz.dev` へ移す

**構成は調査のうえ確定した。** 静的アセットだけを配る Worker を 2 つ立て、GitHub Actions からデプロイする。

```
本番     tremolo-ui.mimoz.dev/                    -> tremolo-ui-docs      (Custom Domain)
         tremolo-ui.mimoz.dev/i/storybook-react*  -> tremolo-ui-sb-react  (Route)
preview  <branch>-tremolo-ui-docs.<sub>.workers.dev
         <branch>-tremolo-ui-sb-react.<sub>.workers.dev   ... 両方 Access で保護
CI       ci.yml (push) / pull-request.yml (PR)。PR は versions upload --preview-alias
```

**なぜこの形か**（いずれも無料プランの制約から来ている）:

- **ルーティング用の Worker スクリプトを書かない。** 静的アセットへのリクエストは無料かつ無制限だが、スクリプトが起動した分は 100,000 req/day にカウントされ、**無料プランは超過時に静的アセットへフォールバックせず 429 を返す**。1 つのホスト名に 2 つのサイトを載せるのに自前のルータを挟むと、この制限をまともに受ける
- **Worker を 2 つに分けるのは `html_handling` が Worker 単位の設定だから。** docs は `trailingSlash: true` なので `force-trailing-slash` が要る一方、Storybook は `iframe.html` を拡張子付きで直接読む。同居させるとストーリー表示のたびに 307 を踏む
- **同一ホスト名で Route は Custom Domain より優先される**ので、上の 2 段構成が成立する。Route には proxied な DNS レコードが必須だが、**docs 側の Custom Domain がそれを自動で作る**ので追加作業は無い
- **Workers Builds ではなく GitHub Actions を使う。** Workers Builds だと Worker 2 つ × push ごとにモノレポ全体を 2 回ビルドし、無料枠（3,000 分/月・同時 1）を食う。ワークフローは既に全部ビルドしているので、`wrangler` を足すだけでよい
- **preview は `--preview-alias` の workers.dev URL をそのまま使う。** preview URL は workers.dev 専用で、`preview.tremolo-ui.mimoz.dev` のような独自サブドメインには**現状できない**。自作するとルータ Worker が 1 つ増えるうえ、元の workers.dev URL も別途 Access で塞ぐ必要があり、得られるのは URL の見た目だけ

**実測（origin/main 時点）**: docs 296 ファイル / 14 MB、Storybook 93 ファイル / 9 MB。無料プランの上限 20,000 ファイル・1 ファイル 25 MiB に対して余裕がある。

- [x] `site` / Storybook それぞれに wrangler の設定を置く（`assets` のみ、`main` 無し）。docs は `force-trailing-slash`、Storybook は既定のまま
- [x] Storybook は `viteFinal` で vite の `base` を `/i/storybook-react/` にし、成果物も `i/storybook-react/` 配下に出す。**本番ビルドのみ**（dev に掛けるとローカルの URL が変わる）。この配置なら preview URL でも本番と同じパスになり、base path 起因の差異が出ない
- [x] `docusaurus.config.ts` は `url` を差し替えるだけ。**サブドメイン直下なので `baseUrl: '/'` のままでよく、i18n（`/ja/`）との組み合わせも変わらない**
- [x] ワークフローを trigger ごとに分ける。`pull-request.yml` は `wrangler versions upload --preview-alias <branch>`、`ci.yml`（main への push）は `wrangler deploy`
  - alias は**小文字・数字・ハイフンのみ、先頭は小文字**。ブランチ名の `/` はサニタイズが要る。さらに `alias + Worker 名` が **63 文字以内**（DNS 制約）
  - **fork からの PR には secrets が渡らないので preview は出ない。** Access を掛ける以上どのみち外部の人は見られないので実害は無い（`pull_request_target` は使わない）
  - preview URL は `marocchino/sticky-pull-request-comment`（`header: preview`）で PR に貼る。job に `pull-requests: write` が要る
  - API token は Account -> Workers Scripts:Edit と、Zone -> Workers Routes:Edit（`mimoz.dev`）
- [x] preview を Cloudflare Access で保護する。**Zero Trust の無料プランで 50 シートまで**。Worker の Access タブから「preview URL のみ」を選べる
  - preview URL は **`workers_dev` が有効なときだけ出る**（無効にすると preview も消える）ので、`workers_dev = true` のまま Access で塞ぐ
  - Worker レベルの Access は WebSocket 非対応だが、静的サイトなので影響しない
- [x] `mimoz.dev` は既に Cloudflare の zone（`ignat` / `june` の NS）。`tremolo-ui.mimoz.dev` のレコードは docs の Custom Domain が作成した
- [x] リンクの書き換え: `README.md`（4 箇所。うち 2 つは `deploy-badge.vercel.app` のバッジで、**Cloudflare 版の同等品が無い**ので素のリンクか shields.io に置き換える）、`SECURITY.md`、`CONTRIBUTING.md`、`site/README.md`、`docusaurus.config.ts` の navbar / footer、`site/i18n/*/docusaurus-theme-classic/footer.json`
- [x] Vercel はリダイレクトとして残す。**`*.vercel.app` はデプロイが存在しないとリダイレクトを返せない**ので、プロジェクト自体は維持したうえで push ごとの再ビルドを止める。Ignored Build Step ではなく Git 連携を切る形にした（`vercel-redirect/README.md`）

### ツールチェーンの見直し

**実施済み**

- [x] **jest → vitest。** 
- [x] **eslint / prettier → oxlint / oxfmt。** 

## 6. 公開 API の整理

- [x] **story を args で操作できる形に揃えた。** 素の関数のまま export していた story（`AnimationCanvas` 3 / `Piano` 6 / `PointsEditor` 2 / `Slider` 3 / `XYPad` 1 / `NumberInput` 3）を Story オブジェクトにして、直書きしていた prop を args へ移した。`value` は state のまま
  - `{...args}` を撒いてある story は、args に書いていない prop も docgen 経由で Controls に出る。足りていなかったのは「素の関数で args が届いていなかったもの」だけ
  - 複数のインスタンスを並べている story は共通のものだけを args にした（`Slider` の `Flex` の `vertical`、`ConfigScale` の 3 段目の `min` / `max` / `step` は主題なので残す）
  - `src/hooks/*.stories.tsx` の 5 つは meta に `component` が無く、args を束ねる相手がいないので素の関数のまま
  - ビルドした Storybook を Playwright で全 48 story 開いて、描画されること・Storybook のエラーパネルが出ないこと・console error と pageerror が 0 件であることを確認した
  - **Controls には prop でない値も出せる。** args に入れたキーは Storybook がそのまま拾うので、`Root` 以外のパートをマウントするかどうかを args に置き、`render` で分割代入して取り出せば Controls から切り替えられる。`ComponentProps<typeof X.Root> & Parts` を `Meta` / `StoryObj` に渡し、`table: { category: 'Parts' }` で本物の prop と別の欄にまとめる。**`render` で取り出さずに `{...args}` を撒くと DOM に渡ってしまう**ので、分割代入は必須
  - 入れたのは各コンポーネントの `Basic` だけ（`Knob` の 3 パート、`NumberInput` の `Stepper`、`Slider` の `Thumb` / `Marks`、`XYPad` の `Thumb`、`PointsEditor` の `Background`）。**argTypes を meta ではなく story 側に書いた**ので、主題が別にある story の Controls は汚れない
  - **`Slider.Marks` の `options` に `'step'` を渡してはいけない場面がある。** 目盛りは `max / per - min / per + 1` 本作られるので、`['step', …]` は `step` に比例して増える。0-100 で既定の `step` = 1 なら 101 本、Controls で `step` を 0.1 にされたら 1001 本。`Basic` では固定間隔（`[25, 'mark-number']`）にした

- [ ] **`functions` を汎用な関数だけにする。** 破壊的変更。詳細: **[functions-scope.md](./functions-scope.md)**

  全 63 export を「このライブラリを使わない人が使うか」で見直したところ、**入力イベントの解釈**（modifier 一式 + `applyDelta`）と**描画された鍵盤の幾何**（`piano.ts`）という汎用でない 2 つの塊が入っていた。どちらも `dom` へ移す。あわせて使用箇所ゼロの `isEmpty` / `mod` など 6 つの公開をやめる。

  移動後、`functions` は 値の分布 / 数値変換 / 音楽理論 / 表示 の 4 本になる。

- [x] **`NumberInput` の `InputField` の props を `Root` に集めた。** 破壊的変更。

  現状は非対称になっている。**`Stepper` の設定（`drag` / `dragSensitivity` / `pointerLock`）は `Root` にあるのに、`InputField` の設定（`selectOnFocus` / `unformatOnFocus` / `keepCaretOnStep` / `blurOnEnter`）だけ `InputField` にある。** `Stepper` 自身が持つのは `className` / `style` / `children` / `ref` だけで、振る舞いは 1 つも無い。

  **story を書いていて表に出た。** `Stepper` の story は主題の `drag` が `StoryObj<typeof NumberInput.Stepper>` に無いので Controls に出せず、`Root` に対して型付けして回避した。`InputField` の story は逆に `InputField` に対して型付けしないと `keepCaretOnStep` を args に書けない。**同じ「自分のコンポーネント名で型付けすると主題の prop が出ない」問題を、2 つのサブコンポーネントが逆向きに抱えている。**

  `Root` に寄せる根拠:

  - **`Root` は context に `inputRef` を 1 つしか持たない。** `InputField` は自分の ref をそこへ合成するので、1 つの `Root` に `InputField` を 2 つ置くと後から mount した方で上書きされ、`NumberInputMethods.focus()` の行き先も変わる。実質「`Root` ごとに field は 1 つ」であり、field の設定を `Root` に置いても表現力は落ちない
  - 下書きの状態（`text` / `editing` / `setDraft` / `commitDraft`）は既に `Root` の context にある。`InputField` は表示と入力を受けているだけ
  - 他のコンポーネントの形とも揃う。`Slider.Track` / `Knob.Thumb` などのサブコンポーネントは見た目のパートで、振る舞いの設定は `Root` にある

  代償と決めること:

  - 移行ガイドに載せる。`<NumberInput.InputField unformatOnFocus />` → `<NumberInput.Root unformatOnFocus>`
  - `NumberInputProps` が 18 → 22 になる。`Root` が「値の設定」と「各パートの設定」の両方を持つことになるので、**JSDoc でどのパートに効くのかを書く**（`drag` は既にそうなっている）
  - `className` / `style` / `ref` はパートごとの話なのでサブコンポーネントに残す
  - 逆向き（`drag` 系を `Stepper` へ移す）も一応ある。ただし `Stepper` が無ければドラッグ自体が存在しないので、**`Stepper` を置くかどうかと `drag` をいくつにするかが別の場所に散る**。`Root` に集約する方を採る

  やったこと:

  - 4 つの prop を `NumberInputProps` へ移し、JSDoc にどのパートに効くのかを書いた。`Root` が context で渡し、`InputField` は読むだけ。`NumberInputFieldProps` は `className` / `style` だけになった
  - **移行ガイドは changeset に書いた。** `keepCaretOnStep` / `unformatOnFocus` は未リリースなので、足したときの changeset の主語を `Root` に書き換えただけ。リリース済みの `selectOnFocus` / `blurOnEnter` についてだけ、移行用の changeset を足した
  - `InputField` の story も `Root` に対して型付けし、`Stepper` の story と揃えた。サブコンポーネントの story が主題の prop を Controls に出すには `Root` で型付けする、で統一される

## 7. コンポーネントと story の追加

- [ ] `FileInput` コンポーネント
- [ ] `DropZone` コンポーネント
- [x] **WavetableSynth の story を作り込む**（`packages/react/__stories__/combined/WavetableSynth/`）
  - [x] octave のコントロール
  - [x] velocity のコントロール
  - [x] MIDI キーボード
  - 鍵盤まわりを `KeyboardSection` に切り出した。octave は `noteRange` を 12 半音ずつずらす（Z / X でも動く）。velocity はマウスと PC キーボードで弾いたときの値で、MIDI キーボードは自分の velocity を使う（C / V で ±20）。どちらも `AmplitudeEnvelope.triggerAttack` の velocity に渡す
  - **MIDI は `Piano.playNote` を経由させた。** 鍵盤が光り、マウスと MIDI で同じノートを押しても 1 回だけ鳴る。Piano のコアは `noteRange` の外のノートも拒まないので、表示範囲の外を MIDI で弾いても鳴る。そのためエンベロープと音源は `noteRange` からの添字ではなくノート番号で持ち、初めて弾いたときに作る

## 8. コードベース

- [ ] **コード内のコメントとテストの説明（`describe` / `it`）を日本語にする。** 内部向けの文書と揃える。ただし公開 API の JSDoc は typedoc の API ページと IDE の補完に出て、公開ドキュメント（英語）の一部になるので、対象に含めるかを先に決める

## 1.0 の基準

以下が揃った時点で 1.0 とする。

- [x] コア切り出しが Phase 5 まで完了し、`@tremolo-ui/react` が薄いラッパーになっている
- [ ] Vue / Svelte のいずれかが公開されている（コアが framework-agnostic であることの実証）
- [x] CSS の配布方法が確定し、移行ガイドがある（5.1 / 5.2。パッケージは CSS を配らず、テーマはドキュメントで公開する）
- [ ] 公開 API が安定し、以降の破壊的変更に `major` を使う運用へ切り替えられる
