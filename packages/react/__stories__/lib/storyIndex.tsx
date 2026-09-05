import { useEffect, useState } from 'react'

import LinkTo from './linkTo'

/**
 * One entry of the index Storybook publishes as `index.json`, next to
 * `iframe.html`, in the dev server and in a static build alike.
 */
interface IndexEntry {
  id: string
  title: string
  name: string
  type: 'docs' | 'story'
}

interface StoryIndexJson {
  entries: Record<string, IndexEntry>
}

interface Group {
  /** What the link reads as: the component or hook itself, not the page. */
  label: string
  entry: IndexEntry
}

/**
 * The entry a group links to. A component with subcomponents is entered
 * through its `Root`; a story file of its own (`Hooks/useDrag`) is itself. An
 * example made of several parts is entered through the one named after it
 * (`combined/WavetableSynth/WavetableSynth`), which is the whole of it.
 */
function pickEntry(entries: IndexEntry[], section: string, label: string) {
  const preferred = [
    `${section}/${label}`,
    `${section}/${label}/Root`,
    `${section}/${label}/${label}`,
  ]
  // The docs page of a title when it has one — `combined` turns autodocs off,
  // and there the story itself is all there is to link to.
  const preferredOf = (title: string) => {
    const matching = entries.filter((entry) => entry.title === title)
    return matching.find((entry) => entry.type === 'docs') ?? matching[0]
  }

  for (const title of preferred) {
    const entry = preferredOf(title)
    if (entry) return entry
  }
  return entries.find((entry) => entry.type === 'docs') ?? entries[0]
}

function groupsOf(index: StoryIndexJson, section: string): Group[] {
  const byLabel = new Map<string, IndexEntry[]>()

  for (const entry of Object.values(index.entries)) {
    const [head, label] = entry.title.split('/')
    // `Intro` itself has no section, so it drops out here.
    if (head !== section || !label) continue
    const group = byLabel.get(label)
    if (group) group.push(entry)
    else byLabel.set(label, [entry])
  }

  return [...byLabel]
    .map(([label, entries]) => ({
      label,
      entry: pickEntry(entries, section, label),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'en', { numeric: true }))
}

/**
 * The stories of one section, as links, read from the index Storybook builds.
 * A story file added under the section shows up on its own.
 */
export default function StoryIndex({ section }: { section: string }) {
  const [groups, setGroups] = useState<Group[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    // Relative to `iframe.html`, which sits beside `index.json`, so a
    // Storybook served from a sub-path is followed without configuration.
    fetch(new URL('index.json', document.baseURI), {
      signal: controller.signal,
    })
      .then((response) => response.json() as Promise<StoryIndexJson>)
      .then((index) => setGroups(groupsOf(index, section)))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        console.error(error)
        setFailed(true)
      })

    return () => controller.abort()
  }, [section])

  if (failed) return <p>Could not read the story index.</p>
  if (!groups) return null

  return (
    <ul>
      {groups.map(({ label, entry }) => (
        <li key={label}>
          <LinkTo
            title={entry.title}
            story={entry.type === 'docs' ? 'docs' : entry.name}
          >
            {label}
          </LinkTo>
        </li>
      ))}
    </ul>
  )
}
