import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ThemeSelector } from './theme-selector'
import type { ThemeSummary } from './theme-selector'

const makeColors = (primary: string) => ({
  background: 'oklch(1 0 0)',
  foreground: 'oklch(0.2 0 0)',
  card: 'oklch(1 0 0)',
  cardForeground: 'oklch(0.2 0 0)',
  popover: 'oklch(1 0 0)',
  popoverForeground: 'oklch(0.2 0 0)',
  primary,
  primaryForeground: 'oklch(1 0 0)',
  secondary: 'oklch(0.5 0.1 200)',
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
})

const mockThemes: ThemeSummary[] = [
  {
    id: 'theme-1',
    name: 'Ocean Blue',
    lightMode: makeColors('oklch(0.6 0.2 240)'),
    darkMode: makeColors('oklch(0.4 0.2 240)'),
    radius: '0.5rem',
    fontHeading: 'sans-serif',
    fontBody: 'sans-serif',
  },
  {
    id: 'theme-2',
    name: 'Sunset Red',
    lightMode: makeColors('oklch(0.6 0.2 10)'),
    darkMode: makeColors('oklch(0.4 0.2 10)'),
    radius: '0.5rem',
    fontHeading: 'sans-serif',
    fontBody: 'sans-serif',
  },
]

describe('ThemeSelector', () => {
  it('renders global default option first', () => {
    const { getByRole } = render(
      <ThemeSelector
        themes={mockThemes}
        value={null}
        onChange={() => {}}
        entityId="course-1"
      />,
    )
    const select = getByRole('combobox')
    expect((select as HTMLSelectElement).options[0].text).toBe(
      'Global default (Settings)',
    )
  })

  it('renders all theme names as options', () => {
    const { getByText } = render(
      <ThemeSelector
        themes={mockThemes}
        value={null}
        onChange={() => {}}
        entityId="course-1"
      />,
    )
    expect(getByText('Ocean Blue')).toBeTruthy()
    expect(getByText('Sunset Red')).toBeTruthy()
  })

  it('shows helper text when no theme selected', () => {
    const { getByText } = render(
      <ThemeSelector
        themes={mockThemes}
        value={null}
        onChange={() => {}}
        entityId="course-1"
      />,
    )
    expect(
      getByText('No override — visitors see the global theme from Settings.'),
    ).toBeTruthy()
  })

  it('shows swatch and Edit link when a theme is selected', () => {
    const { getByText } = render(
      <ThemeSelector
        themes={mockThemes}
        value="theme-1"
        onChange={() => {}}
        entityId="course-1"
      />,
    )
    expect(getByText('Edit in Theme Forge')).toBeTruthy()
  })

  it('calls onChange(null) when global default selected', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <ThemeSelector
        themes={mockThemes}
        value="theme-1"
        onChange={onChange}
        entityId="course-1"
      />,
    )
    fireEvent.change(getByRole('combobox'), { target: { value: '' } })
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('calls onChange with themeId when a theme is selected', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <ThemeSelector
        themes={mockThemes}
        value={null}
        onChange={onChange}
        entityId="course-1"
      />,
    )
    fireEvent.change(getByRole('combobox'), { target: { value: 'theme-2' } })
    expect(onChange).toHaveBeenCalledWith('theme-2')
  })
})
