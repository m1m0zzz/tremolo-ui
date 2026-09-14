# templates

`npx degit m1m0zzz/tremolo-ui/templates/<name>` で取り出して使うテンプレート。取り出し方の案内はドキュメントの Templates ページ（`site/docs/tutorials/templates.mdx`）にある。

**別リポジトリ（`m1m0zzz/tremolo-ui-example-*`）から移したのは、破壊的変更に追随し忘れるため。** 別リポジトリのままだと 0.0.x の API で止まっていた。

## 決まりごと

- **npm workspaces に入れてある。** `@tremolo-ui/*` の `^0.x` は手元のパッケージに symlink されるので、CI でテンプレートをビルドすれば、テンプレートが追随していない破壊的変更で落ちる。changesets がバージョンを上げたときは、依存の範囲も一緒に書き換わる
- **`src/theme/` は `packages/shared/css/` のコピー。** degit で取り出したテンプレートが単体で動くようにするため。正本は `packages/shared/css/` で、CI が `cmp` で一致を確かめている。テーマを直したらコピーも直す
- テーマはページの `.dark` / `[data-theme='dark']` を読む。テンプレートは OS の設定に従うので、`Components.tsx` で `prefers-color-scheme` を `<html>` の `data-theme` に写している
- 各テンプレートの `README.md` は取り出した利用者が読むもの。英語で書く
