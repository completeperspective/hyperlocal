'use client'

import { ReactNode } from 'react'
import { css, Global } from '@emotion/react'

export function GlobalLayout({ children }: { children: ReactNode }) {
  return (
    <div suppressHydrationWarning={true}>
      <Global
        styles={css`
          :root {
            --foreground: #1b1b1c;
            --background: #f2f4f7;
            --primary: #ff0069;
            --primary-foreground: #ffffff;
            --font-primary: 'Lobster', sans-serif;
            --font-secondary: 'Open Sans', sans-serif;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --foreground: #f2f4f7;
              --background: #1b1b1c;
            }
          }
        `}
      />
      {children}
    </div>
  )
}
