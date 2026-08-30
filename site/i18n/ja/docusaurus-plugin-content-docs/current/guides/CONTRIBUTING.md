# コントリビューション ガイド

まず最初に、これまでのプログラムがあなたの環境でも正常に動作することを確認します。

もし、正常に動かない場合は、[Issues](https://github.com/m1m0zzz/tremolo-ui/issues/new?template=bug_report.md) でバグを報告して下さい。

```bash npm2yarn
npm i
npm run test
npm run build:package
```

## コンポーネントに貢献する

Storybook を起動します。

```bash npm2yarn
npm run sb -w packages/react
```

そして、ブラウザでコンポーネントを確認します。

## 機能(functions)に貢献する

ソースコードに変更を加え、テストを行ってください。

```bash npm2yarn
npm run test -w packages/functions
```

特定のテストファイルのみを実行するためには、第一引数にパスを追加します。

```bash npm2yarn
cd packages/functions
npm run test  __tests__/any.test.ts
```

追加した機能を `react` で使用するためには、パッケージをビルドする必要があります。

```bash npm2yarn
npm run build:package -w packages/functions
```


## Changeset

リリースに含めたい変更をした場合は、changeset を追加します。

```bash npm2yarn
npm run changeset
```

`.changeset/` 以下にマークダウンファイルが作られるので、変更と一緒にコミットしてください。

bump の種類は次のように選びます。

- `patch` — バグ修正
- `minor` — 新機能、**および破壊的変更**（このプロジェクトは `0.x` を維持するため。`major` を選ぶと `1.0.0` になります）
- `major` — 当面は使いません

`@tremolo-ui/functions` と `@tremolo-ui/react` は常に同じバージョンでリリースされるため、
片方だけを選んでも両方が bump されます。

リリースは自動化されています。変更が `main` に入ると "Version Packages" プルリクエストが
作成（または更新）され、それをマージした時点で npm への publish と CHANGELOG の生成が行われます。

## セキュリティの問題

[脆弱性を報告する](../SECURITY/) を参照してください。

## その他の問題、バグなど

