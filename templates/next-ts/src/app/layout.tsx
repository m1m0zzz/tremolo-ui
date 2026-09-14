import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: 'Next.js + tremolo-ui',
  description: 'A starting point for an audio app with tremolo-ui',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
