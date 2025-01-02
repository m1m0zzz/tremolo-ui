// @ts-check
/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
export default async function outdatedTable({ exec }) {
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

  const table = []
  const header = ['Package', 'Status', 'Current', 'Wanted', 'Latest', 'Depended by']

  for (const [key, value] of Object.entries(json)) {
    console.log(`${key}: ${value}`)
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const v = value[i]
        table.push([key, status(v.current, v.wanted), v.current, v.wanted, v.latest, v.dependent])
      }
    } else {
      table.push([key, status(value.current, value.wanted), value.current, value.wanted, value.latest, value.dependent])
    }
  }

  return (
    row(header) +
    row(new Array(header.length).fill('---')) +
    table.map(r => row(r)).join('')
  )
}
