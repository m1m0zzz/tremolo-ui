import { AnchorHTMLAttributes, ReactNode } from 'react'
import { default as SbLinkTo } from '@storybook/addon-links/react'
import { useTheme } from '@storybook/core/theming'

interface Props {
  kind?: string;
  title?: string;
  story?: string;
  name?: string;
  children?: ReactNode;
}

export default function LinkTo({
  story = 'docs',
  children,
  ...props
}: Props & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof Props>) {
  const theme = useTheme()
  return (
    <SbLinkTo
      story={story}
      style={{ color: theme.brand.url }}
      {...props}
    >{children}</SbLinkTo>
  )
}
