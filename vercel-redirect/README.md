# vercel-redirect

**ホスティングは Cloudflare Workers（`tremolo-ui.mimoz.dev`）に移行済み。** ここに残っているのは、Vercel 時代の URL を新しいドメインへ 308 で飛ばすためだけの設定。

| ディレクトリ | Vercel プロジェクト | 旧 URL |
| --- | --- | --- |
| `docs/` | `tremolo-ui-docs` | `https://tremolo-ui.vercel.app/` |
| `storybook/` | `tremolo-ui-sb-react` | `https://tremolo-ui-sb-react.vercel.app/` |

## なぜ消せないか

**旧 URL は publish 済みの 0.x のパッケージの README に焼き付いている。** Vercel プロジェクトを消すと npm のページからのリンクが全部 404 になるので、リダイレクトだけ生かしてある。`*.vercel.app` はデプロイが存在しないとリダイレクトを返せないため、プロジェクト自体も残す必要がある。

## なぜリポジトリのルートに置かないか

**カバーオールのリダイレクトだから。** ルートに `vercel.json` があると、将来このリポジトリを Vercel に import し直したときに「何をデプロイしても全部 308 で飛ぶ」という壊れ方をする。Vercel が読むのはプロジェクトの Root Directory にある `vercel.json` だけなので、ここに置いてあれば事故らない。

プロジェクトが 2 つある以上、ルートの 1 ファイルでは表現できないという事情もある。

`.github/workflows/ci.yml` と `pull-request.yml` の `paths` フィルタでは `vercel-redirect/**` を除外してある。ビルドにもテストにも関わらないため。

## 更新のしかた

**Vercel の Git 連携は切ってある**（push ごとのビルドと PR への bot コメントを止めるため）。再デプロイは CLI から。

```bash
cd vercel-redirect/docs
npx vercel link                  # 既存プロジェクト tremolo-ui-docs を選ぶ
npx vercel --prod --skip-domain  # ドメインは向けずに本番ビルドを作る
# 中身を確認してから
npx vercel promote <deployment-url>
```

`--skip-domain` を挟むのは、壊れたものをいきなり本番ドメインに向けないため。

**`vercel.json` の `framework` / `buildCommand` / `installCommand` / `outputDirectory` は消さないこと。** プロジェクト側の Build Command はモノレポ時代のもの（`npm run build:docs:production`）が残っていて、ここを空にしておかないとそれが走り、`package.json` が無くて落ちる（実測。exit 254）。Vercel のドキュメントが "Skip Build Step" として案内している「framework を Other、Build Command を空」を、デプロイ単位で指定している。ダッシュボード側の設定は触っていない。

`index.html` は保険で、リダイレクトが先に効くため通常は配信されない。

`storybook/vercel.json` にルールが 2 本あるのは、**移行の途中で `tremolo-ui-sb-react.vercel.app/i/storybook-react/` が見えていた期間があった**ため。そこをブックマークした人でもパスが二重にならないよう、先に個別ルールで受けている。

## 確認

```bash
curl -sI https://tremolo-ui.vercel.app/docs/guides/CONTRIBUTING
curl -sI https://tremolo-ui-sb-react.vercel.app/
curl -sI https://tremolo-ui-sb-react.vercel.app/i/storybook-react/
```

いずれも 308 と、対応する `tremolo-ui.mimoz.dev` の URL が返れば正しい。
