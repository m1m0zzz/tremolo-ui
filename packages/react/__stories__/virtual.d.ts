// Lives here rather than next to `.storybook/main.ts`, which declares the
// module: tsc's default include skips dot-directories, so a declaration there
// would never reach the program.
declare module 'virtual:tremolo-prop-types' {
  /** Prop name to the type the checker resolved, keyed by the component. */
  const propTypes: Map<unknown, Record<string, string>>
  export default propTypes
}
