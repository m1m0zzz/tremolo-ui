/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
export default async function outdatedTable({ exec, context, packageJson }) {
  const options = { ignoreReturnCode: true }
  const { stdout } = await exec.getExecOutput('npm', ['outdated', '--json'], options)
  const json = JSON.parse(stdout)

  /** @type {string[]} */
  const workspaces = packageJson['workspaces']
  console.log(workspaces)

  /**
   * @param {string[]} row
   * @returns {string}
   */
  function row(row) {
    return `| ${row.join(' | ')} |\n`
  }

  /**
   * @param {string} current
   * @param {string} wanted
   * @returns {string}
   */
  function status(current, wanted) {
    return current == wanted ? '✅' : '👷‍♀️'
  }

  /**
   * @template T
   * @param {T[]} array
   * @returns {T}
   */
  function lastItem(array) {
    return array[array.length - 1]
  }

  /**
   * @param {string} dependent
   */
  function workspaceLink(dependent) {

    let workspace = ''
    if (dependent != 'tremolo-ui') {
      workspace = workspaces.find((w) => lastItem(w.split('/')) == dependent)[0]
    }
    const branchName = lastItem(context.ref.split('/'))
    const url = `https://github.com/${context.repo.owner}/${context.repo.repo}/tree/${branchName}/${workspace}`
    return `[${workspace}](${url})`
  }

  const table = []
  const header = ['Package', 'Status', 'Current', 'Wanted', 'Latest', 'Depended by']
  const divider = ['---', ':---:', '---', '---', '---', '---']

  for (const [key, value] of Object.entries(json)) {
    console.log(`${key}: ${value}`)
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const v = value[i]
        table.push([key, status(v.current, v.wanted), v.current, v.wanted, v.latest, workspaceLink(v.dependent)])
      }
    } else {
      table.push([key, status(value.current, value.wanted), value.current, value.wanted, value.latest, workspaceLink(value.dependent)])
    }
  }

  return (
    row(header) +
    row(divider) +
    table.map(r => row(r)).join('')
  )
}
