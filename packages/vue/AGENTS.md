# AGENTS.md（packages/vue）

`@tremolo-ui/vue` の中だけで効く決まりごと。スタイリング（`data-*` / ARIA / テーマ）と、`dom` / `functions` を re-export しないことは、他のパッケージにもまたがるのでルートの `AGENTS.md` にある。方針（名前の形、React と同じ一式を揃えること）は `docs/milestone.md` の 3 章。

## 書き方

- **SFC（`.vue`）ではなく、TypeScript の `defineComponent` と `h()` で書く。** Headless UI の Vue 版と同じ形。ビルドを dom / react と同じ tsdown に揃えられ、`.vue` 用のビルド（`vue-tsc` / プラグイン）を持たずに済む
- 名前はフラットにし、Root はコンポーネント名そのもの（`Knob` / `KnobThumb`）。ドット付きの名前はグローバル登録・Nuxt の auto-import・in-DOM テンプレートで使えないため
- 対応するのは Vue 3.5 以降（`useTemplateRef` / `useId` を使う）

## dom との関係

- **ロジックは dom に書き、ここには Vue への橋渡しだけを置く。** React の実装を読んで書き写さないこと。足りないものがあれば、先に dom に足して React / Svelte からも使う
- composables は dom の `create*` を包むだけ。要素は `MaybeRefOrGetter` で受けて、変わったら作り直す。オプションの変化は `update()` で渡し、作り直さない（ドラッグの途中で切れる）。共通の形は `composables/useInstance.ts`

## テスト

- dom と同じく `__tests__/` に `src` と同じ構成で置く
