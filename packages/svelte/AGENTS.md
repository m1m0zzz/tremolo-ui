# AGENTS.md（packages/svelte）

`@tremolo-ui/svelte` の中だけで効く決まりごと。スタイリング（`data-*` / ARIA / テーマ）と、`dom` / `functions` を re-export しないことは、他のパッケージにもまたがるのでルートの `AGENTS.md` にある。方針（名前の形、React と同じ一式を揃えること）は `docs/milestone.md` の 3 章。

## 対応するバージョン

**Svelte 5 だけ。** runes を前提にし、Svelte 4 の書き方（`export let`、store、`$:`）は使わない。context は `createContext` を使うので、peer は `^5.40.0`。

## dom との関係

- **ロジックは dom に書き、ここには Svelte への橋渡しだけを置く。** React の実装を読んで書き写さないこと。足りないものがあれば、先に dom に足して React からも使う
- **actions は dom の `create*` を包むだけ。** 引数が変わったら `update()` で渡し、インスタンスを作り直さない。作り直すとドラッグの途中で切れる
- runes を使う実装は `.svelte.ts` に置く。hook 相当（`useMIDIAccess` など）はコンポーネントの初期化中に呼ぶ関数にし、**変わりうる引数は getter 関数で受ける**（`() => midi.midiAccess`）。値で受けると、呼んだ時点の値に固定されてリアクティブにならない

## ファイルとビルド

- **相対 import には `.js` を付ける**（`./actions/drag.js`、`.svelte.ts` なら `./hooks/useMIDIAccess.svelte.js`）。`svelte-package` は import を書き換えないので、拡張子が無いと Node の ESM 解決で落ちる
- テストは dom と同じく `__tests__/` に `src` と同じ構成で置く。`src` に置くと `svelte-package` が `dist` に写してしまう。runes を使うテストは `.svelte.test.ts` にする
- `build:package` は `svelte-check` を通してから `svelte-package` する。`tsc` は `.svelte` を読めない
