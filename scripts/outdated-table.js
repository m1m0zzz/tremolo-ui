/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
export default async function outdatedTable({ exec, context, packageJson }) {

  const options = { ignoreReturnCode: true }
  const { stdout } = await exec.getExecOutput('npm', ['outdated', '--json'], options)
  const json = JSON.parse(stdout)

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
   * @param {string} dependent
   */
  function workspaceLink(dependent) {
    /** @type {string[]} */
    const workspaces = packageJson.workspaces
    let workspace = ''
    if (dependent != 'tremolo-ui') {
      workspace = workspaces.find((w) => w.split('/')[-1] == dependent)[0]
    }
    const branchName = context.ref.split('/')[-1]
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
