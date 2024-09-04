export function resolve(path: string, _currentPath?: string) {
  const m = path.match(/^\.\/(.+)(\.\w+)?$/)
  console.log(m)
  if (m) {
    const s = m[1].toLowerCase().replace(/\/|\.|\s/g, '-')
    console.log(m)
    return '/?path=/docs/docs-' + s + '--docs'
  }
  return path
}

interface DocsLinkProps {
  href: string
  dirname: string
  external?: boolean
  children?: JSX.Element
}

export function DocsLink({ href, external = false, children }: DocsLinkProps) {
  const url = new URL(document.referrer)
  const currentPath = url.searchParams.get('path') ?? undefined
  return (
    <a
      href={resolve(href, currentPath)}
      target={external ? '_blank' : undefined}
    >
      {children}
    </a>
  )
}
