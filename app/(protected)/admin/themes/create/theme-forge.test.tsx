import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeForge } from './theme-forge'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// AppPreview uses ResizeObserver which is unavailable in jsdom
vi.mock('./components/app-preview', () => ({
  AppPreview: () => <div data-testid="app-preview" />,
}))

beforeEach(() => {
  // Suppress onboarding callout so it doesn't interfere with queries
  localStorage.setItem('themeForge_onboardingDismissed', '1')
})

describe('ThemeForge — harmony state restore', () => {
  it('defaults harmonyMode to complementary when no colorScheme is provided', () => {
    render(<ThemeForge initialTheme={undefined} />)
    // Active card has bg-[--forge-accent]/20; inactive cards do not
    const compButton = screen.getByRole('button', { name: 'Comp.' })
    expect(compButton.className).toContain('bg-[--forge-accent]/20')
  })

  it('restores harmonyMode from initialTheme.colorScheme on load', () => {
    render(
      <ThemeForge
        initialTheme={{
          id: 'test-id',
          name: 'My Triadic Theme',
          lightMode: { primary: 'oklch(0.65 0.22 270)' },
          darkMode: { primary: 'oklch(0.55 0.22 270)' },
          colorScheme: 'triadic',
        }}
      />,
    )
    // Triadic card should be active, complementary should not
    expect(screen.getByRole('button', { name: 'Triadic' }).className).toContain(
      'bg-[--forge-accent]/20',
    )
    expect(
      screen.getByRole('button', { name: 'Comp.' }).className,
    ).not.toContain('bg-[--forge-accent]/20')
  })

  it('falls back to complementary when colorScheme is null (legacy theme)', () => {
    render(
      <ThemeForge
        initialTheme={{
          id: 'legacy-id',
          name: 'Legacy Theme',
          lightMode: { primary: 'oklch(0.65 0.22 90)' },
          darkMode: { primary: 'oklch(0.55 0.22 90)' },
          colorScheme: null,
        }}
      />,
    )
    const compButton = screen.getByRole('button', { name: 'Comp.' })
    expect(compButton.className).toContain('bg-[--forge-accent]/20')
  })
})
