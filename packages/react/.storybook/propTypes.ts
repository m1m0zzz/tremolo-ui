import path from 'node:path'

import ts from 'typescript'

/** The props of one component, as the TypeScript checker prints them. */
export type ComponentPropTypes = {
  /** The module the component is exported from. */
  module: string
  /** Its exported name, and the member of it where the component is nested. */
  exportName: string
  member?: string
  props: Record<string, string>
}

const IN_ALIAS =
  ts.TypeFormatFlags.InTypeAlias | ts.TypeFormatFlags.NoTruncation

/**
 * Resolve the type of every prop of every component.
 *
 * react-docgen records a type as it was written, so a prop typed with an alias
 * shows the alias name and nothing else, and a generic one (`XYInput<number>`)
 * shows no more than that. Only the checker knows what those stand for, so
 * this runs at build time and hands the result to `preview.tsx`.
 *
 * Props declared outside this repository are left out: a component spreads the
 * attributes of the element it renders, and those are neither ours to document
 * nor small enough to print.
 */
export function collectPropTypes(entryPoints: string[]): ComponentPropTypes[] {
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

  const ours = (file: string) =>
    file.includes(`${path.sep}packages${path.sep}`) &&
    !file.includes('node_modules')

  /**
   * Write a type out without the names standing in for it.
   *
   * `InTypeAlias` only drops the name of the type it is given, so a union is
   * taken apart and its members written out one by one. `undefined` is dropped
   * along the way: an optional prop is marked as such by the table already.
   */
  function print(type: ts.Type, depth = 0): string {
    if (type.isUnion() && depth < 2) {
      const parts = type.types
        .filter((member) => !(member.flags & ts.TypeFlags.Undefined))
        .map((member) => print(member, depth + 1))

      // `boolean` is a union of its two literals, which is not how anyone
      // writes it.
      const t = parts.indexOf('true')
      const f = parts.indexOf('false')
      if (t !== -1 && f !== -1) {
        parts.splice(Math.max(t, f), 1)
        parts.splice(Math.min(t, f), 1, 'boolean')
      }

      return parts.join(' | ')
    }
    return checker.typeToString(type, undefined, IN_ALIAS)
  }

  /** The props of a component value, or null where it is not one. */
  function propsOf(
    symbol: ts.Symbol,
    at: ts.Node,
  ): Record<string, string> | null {
    const signature = checker
      .getTypeOfSymbolAtLocation(symbol, at)
      .getCallSignatures()[0]
    const parameter = signature?.getParameters()[0]
    if (!parameter) return null

    const props: Record<string, string> = {}
    for (const prop of checker
      .getTypeOfSymbolAtLocation(parameter, at)
      .getProperties()) {
      const declaration = prop.declarations?.[0]
      if (!declaration || !ours(declaration.getSourceFile().fileName)) continue
      props[prop.name] = print(
        checker.getTypeOfSymbolAtLocation(prop, declaration),
      ).replace(/\s+/g, ' ')
    }
    return props
  }

  // A component by React's convention, which also keeps plain functions that
  // happen to take an object out of the result.
  const isComponentName = (name: string) => /^[A-Z]/.test(name)

  /** Resolves to the same symbol whether reached by import or declaration. */
  const target = (symbol: ts.Symbol) =>
    symbol.flags & ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(symbol)
      : symbol

  const collected: ComponentPropTypes[] = []
  /**
   * A subcomponent is exported from its own file and named again in the
   * compound component, so it is reached twice. Both are the same value, so
   * the second is dropped.
   */
  const emitted = new Set<ts.Symbol>()

  for (const source of program.getSourceFiles()) {
    const file = source.fileName
    if (!ours(file) || !file.includes(`${path.sep}components${path.sep}`)) {
      continue
    }

    const moduleSymbol = checker.getSymbolAtLocation(source)
    if (!moduleSymbol) continue

    const exports = checker.getExportsOfModule(moduleSymbol)

    // A compound component is a plain object; its members are the components.
    for (const exported of exports) {
      const declaration = exported.declarations?.[0]
      const initializer =
        declaration &&
        ts.isVariableDeclaration(declaration) &&
        declaration.initializer
      if (!initializer || !ts.isObjectLiteralExpression(initializer)) continue

      for (const member of initializer.properties) {
        if (!ts.isShorthandPropertyAssignment(member)) continue
        if (!isComponentName(member.name.text)) continue
        const local = checker.getShorthandAssignmentValueSymbol(member)
        if (!local || emitted.has(target(local))) continue
        const props = propsOf(local, member)
        if (!props || !Object.keys(props).length) continue
        emitted.add(target(local))
        collected.push({
          module: file,
          exportName: exported.name,
          member: member.name.text,
          props,
        })
      }
    }

    for (const exported of exports) {
      const declaration = exported.declarations?.[0]
      if (!declaration || !isComponentName(exported.name)) continue
      const local = target(exported)
      if (emitted.has(local)) continue

      const props = propsOf(exported, declaration)
      if (!props || !Object.keys(props).length) continue
      emitted.add(local)
      collected.push({ module: file, exportName: exported.name, props })
    }
  }

  return collected
}

/**
 * The source of the module `preview.tsx` reads, keyed by the component itself
 * rather than by name: `Root` alone would not say which component it belongs
 * to, and the docgen react-docgen leaves behind carries no path.
 */
export function propTypesModule(collected: ComponentPropTypes[]): string {
  const modules = [...new Set(collected.map((entry) => entry.module))]
  const alias = (file: string) => `m${modules.indexOf(file)}`

  const imports = modules
    .map((file) => `import * as ${alias(file)} from ${JSON.stringify(file)}`)
    .join('\n')

  const entries = collected
    .map((entry) => {
      const component =
        `${alias(entry.module)}.${entry.exportName}` +
        (entry.member ? `.${entry.member}` : '')
      return `  [${component}, ${JSON.stringify(entry.props)}],`
    })
    .join('\n')

  return `${imports}\n\nexport default new Map([\n${entries}\n])\n`
}
