import clsx from 'clsx'
import { ComponentPropsWithoutRef, ReactNode } from 'react'
import { IconType } from 'react-icons'
import { FiGithub, FiLayout } from 'react-icons/fi'

import styles from './styles.module.css'

interface Props {
  user?: string
  repo?: string
  branch?: string
  commit?: string
  path?: string
  isFile?: boolean
  external?: boolean
  plain?: boolean
  children?: ReactNode
}

type FullProps = Props &
  Omit<ComponentPropsWithoutRef<'a'>, keyof Props | 'target' | 'rel'>

function Impl({
  Icon = FiGithub,
  user = 'm1m0zzz',
  repo = 'tremolo-ui',
  branch = 'main',
  commit,
  path,
  isFile,
  external = true,
  plain = false,
  className,
  children = 'Source',
  ...props
}: FullProps & { Icon?: IconType }) {
  const more = [branch, commit, path].filter((v) => v).join('/')
  if (isFile == undefined) {
    const p = path.split('/')
    isFile = p[p.length - 1].includes('.')
  }

  const href =
    more == ''
      ? `https://github.com/${user}/${repo}`
      : `https://github.com/${user}/${repo}/${isFile ? 'blob' : 'tree'}/${more}`

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={clsx(plain || styles.a, className)}
      {...props}
    >
      {plain || <Icon />}
      {children}
    </a>
  )
}

export default function GitHubLink(props: FullProps) {
  return <Impl {...props} />
}

export function StyleGitHubLink({ children = 'Style', ...props }: FullProps) {
  return (
    <Impl {...props} Icon={FiLayout}>
      {children}
    </Impl>
  )
}
