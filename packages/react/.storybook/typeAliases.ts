import path from 'node:path'

import ts from 'typescript'

/**
 * The type aliases of this repository, as the TypeScript checker prints them:
 * `{ InputEventOption: '["normalized" | "raw", number]' }`.
 *
 * react-docgen only records a type as it was written, so a prop typed with an
 * alias shows the alias name and nothing else. This is what fills that in.
 *
 * Generic aliases are left out: their definition is written in terms of type
 * parameters (`XYInput<T> = T | readonly [T, T]`), so substituting the name for it
 * would produce nonsense. A name declared more than once with different
 * definitions is left out too, since there is no telling which one a summary
 * means.
 */
export function collectTypeAliases(
  entryPoints: string[],
): Record<string, string> {
  const program = ts.createProgram(entryPoints, {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
  })
  const checker = program.getTypeChecker()

  const found = new Map<string, string | null>()

  for (const source of program.getSourceFiles()) {
    const file = source.fileName
    if (!file.includes(`${path.sep}packages${path.sep}`)) continue
    if (file.includes('node_modules')) continue

    ts.forEachChild(source, (node) => {
      if (!ts.isTypeAliasDeclaration(node)) return
      if (node.typeParameters?.length) return

      const symbol = checker.getSymbolAtLocation(node.name)
      if (!symbol) return

      const printed = checker.typeToString(
        checker.getDeclaredTypeOfSymbol(symbol),
        undefined,
        ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias,
      )

      const name = node.name.text
      // Ambiguous once two files disagree about what the name means.
      found.set(
        name,
        found.has(name) && found.get(name) !== printed ? null : printed,
      )
    })
  }

  return Object.fromEntries(
    [...found].filter(
      (entry): entry is [string, string] =>
        entry[1] != null && entry[1] !== entry[0],
    ),
  )
}
