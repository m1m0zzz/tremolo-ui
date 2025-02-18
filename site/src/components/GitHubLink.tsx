import { ComponentPropsWithoutRef, ReactNode } from 'react'

interface Props {
  user?: string
  repo?: string
  branch?: string
  commit?: string
  path?: string
  isFile?: boolean
  external?: boolean
  target?: string
  rel?: string
  children?: ReactNode
}

export default function GitHubLink({
  user = 'm1m0zzz',
  repo = 'tremolo-ui',
  branch = 'main',
  commit,
  path,
  isFile = false,
  external = true,
  children,
  ...props
}: Props & Omit<ComponentPropsWithoutRef<'a'>, keyof Props>) {
  const more = [branch, commit, path].filter((v) => v).join('/')

  const href =
    more == ''
      ? `https://github.com/${user}/${repo}`
      : `https://github.com/${user}/${repo}/${isFile ? 'blob' : 'tree'}/${more}`

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      {...props}
    >
      {children}
    </a>
  )
}
