// Lives here rather than next to `.storybook/main.ts`, which declares the
// module: tsc's default include skips dot-directories, so a declaration there
// would never reach the program.
declare module 'virtual:tremolo-type-aliases' {
  /** Type alias name to what the TypeScript checker prints for it. */
  const aliases: Record<string, string>
  export default aliases
}
