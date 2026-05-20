import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ScopedThemeWrapper } from './scoped-theme-wrapper'

const mockTheme = {
  id: 'theme-123',
  radius: '0.5rem',
  fontHeading: "'Inter', sans-serif",
  fontBody: "'Open Sans', sans-serif",
  lightMode: {
    background: 'oklch(1 0 0)',
    foreground: 'oklch(0.2 0 0)',
    card: 'oklch(1 0 0)',
    cardForeground: 'oklch(0.2 0 0)',
    popover: 'oklch(1 0 0)',
    popoverForeground: 'oklch(0.2 0 0)',
    primary: 'oklch(0.6 0.2 360)',
    primaryForeground: 'oklch(1 0 0)',
    secondary: 'oklch(0.4 0.1 360)',
    secondaryForeground: 'oklch(1 0 0)',
    muted: 'oklch(0.97 0 0)',
    mutedForeground: 'oklch(0.55 0 0)',
    accent: 'oklch(0.74 0.13 350)',
    accentForeground: 'oklch(0.27 0.09 355)',
    positive: 'oklch(0.69 0.18 142)',
    positiveForeground: 'oklch(0.97 0 0)',
    info: 'oklch(0.70 0.15 240)',
    infoForeground: 'oklch(0.2 0 0)',
    warning: 'oklch(0.75 0.18 56)',
    warningForeground: 'oklch(0.28 0.07 46)',
    destructive: 'oklch(0.58 0.25 27)',
    destructiveForeground: 'oklch(1 0 0)',
    border: 'oklch(0.92 0 0)',
    input: 'oklch(0.92 0 0)',
    ring: 'oklch(0.71 0 0)',
    meta1: 'oklch(0.65 0.22 41)',
    meta2: 'oklch(0.60 0.12 185)',
    meta3: 'oklch(0.40 0.07 227)',
    meta4: 'oklch(0.83 0.19 84)',
    meta5: 'oklch(0.77 0.19 70)',
    sidebar: 'oklch(0.99 0 0)',
    sidebarForeground: 'oklch(0.22 0 0)',
    sidebarPrimary: 'oklch(0.21 0 0)',
    sidebarPrimaryForeground: 'oklch(0.99 0 0)',
    sidebarAccent: 'oklch(0.97 0 0)',
    sidebarAccentForeground: 'oklch(0.21 0 0)',
    sidebarBorder: 'oklch(0.92 0 0)',
    sidebarRing: 'oklch(0.71 0 0)',
  },
  darkMode: {
    background: 'oklch(0.22 0 0)',
    foreground: 'oklch(0.97 0 0)',
    card: 'oklch(0.25 0 0)',
    cardForeground: 'oklch(0.97 0 0)',
    popover: 'oklch(0.25 0 0)',
    popoverForeground: 'oklch(0.97 0 0)',
    primary: 'oklch(0.58 0.23 9)',
    primaryForeground: 'oklch(1 0 0)',
    secondary: 'oklch(0.36 0.08 11)',
    secondaryForeground: 'oklch(1 0 0)',
    muted: 'oklch(0.25 0 0)',
    mutedForeground: 'oklch(0.56 0 0)',
    accent: 'oklch(0.74 0.13 350)',
    accentForeground: 'oklch(0.27 0.09 355)',
    positive: 'oklch(0.69 0.18 142)',
    positiveForeground: 'oklch(0.97 0 0)',
    info: 'oklch(0.70 0.15 240)',
    infoForeground: 'oklch(0.97 0 0)',
    warning: 'oklch(0.75 0.18 56)',
    warningForeground: 'oklch(0.99 0.02 95)',
    destructive: 'oklch(0.70 0.19 22)',
    destructiveForeground: 'oklch(0.97 0 0)',
    border: 'oklch(1 0 0 / 10%)',
    input: 'oklch(1 0 0 / 15%)',
    ring: 'oklch(0.56 0 0)',
    meta1: 'oklch(0.49 0.24 264)',
    meta2: 'oklch(0.70 0.17 162)',
    meta3: 'oklch(0.77 0.19 70)',
    meta4: 'oklch(0.63 0.27 304)',
    meta5: 'oklch(0.65 0.25 16)',
    sidebar: 'oklch(0.25 0 0)',
    sidebarForeground: 'oklch(0.22 0 0)',
    sidebarPrimary: 'oklch(0.49 0.24 264)',
    sidebarPrimaryForeground: 'oklch(0.99 0 0)',
    sidebarAccent: 'oklch(0.27 0 0)',
    sidebarAccentForeground: 'oklch(0.99 0 0)',
    sidebarBorder: 'oklch(1 0 0 / 10%)',
    sidebarRing: 'oklch(0.44 0 0)',
  },
}

describe('ScopedThemeWrapper', () => {
  it('renders children directly when theme is null', () => {
    const { container, getByText } = render(
      <ScopedThemeWrapper theme={null}>
        <p>Content</p>
      </ScopedThemeWrapper>,
    )
    expect(getByText('Content')).toBeTruthy()
    expect(container.querySelector('[data-scoped-theme]')).toBeNull()
    expect(container.querySelector('style')).toBeNull()
  })

  it('renders children directly when theme is undefined', () => {
    const { container } = render(
      <ScopedThemeWrapper>
        <p>Content</p>
      </ScopedThemeWrapper>,
    )
    expect(container.querySelector('[data-scoped-theme]')).toBeNull()
  })

  it('renders a data-scoped-theme wrapper when theme is provided', () => {
    const { container } = render(
      <ScopedThemeWrapper theme={mockTheme}>
        <p>Content</p>
      </ScopedThemeWrapper>,
    )
    const wrapper = container.querySelector('[data-scoped-theme="theme-123"]')
    expect(wrapper).toBeTruthy()
  })

  it('emits a style block with light-mode CSS variables', () => {
    const { container } = render(
      <ScopedThemeWrapper theme={mockTheme}>
        <p>Content</p>
      </ScopedThemeWrapper>,
    )
    const style = container.querySelector('style')
    expect(style).toBeTruthy()
    expect(style!.innerHTML).toContain('--primary:')
    expect(style!.innerHTML).toContain('--radius: 0.5rem')
    expect(style!.innerHTML).toContain('--font-primary:')
  })

  it('emits a dark mode media query block', () => {
    const { container } = render(
      <ScopedThemeWrapper theme={mockTheme}>
        <p>Content</p>
      </ScopedThemeWrapper>,
    )
    const style = container.querySelector('style')
    expect(style!.innerHTML).toContain('@media (prefers-color-scheme: dark)')
  })
})
