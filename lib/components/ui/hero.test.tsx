import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { HeroPalette } from '@/types/course'
import { Hero } from './hero'

describe('Hero — backgroundImage and palette props', () => {
  it('renders the background img when backgroundImage is set', () => {
    const { container } = render(
      <Hero
        config={{
          title: 'Test Hero',
          backgroundImage: '/images/hero-bg-desktop.png',
        }}
      />,
    )

    const bgImg = container.querySelector(
      'img[src="/images/hero-bg-desktop.png"]',
    )
    expect(bgImg).not.toBeNull()
  })

  it('renders a <source> for the mobile image when backgroundImageMobile is set', () => {
    const { container } = render(
      <Hero
        config={{
          title: 'Responsive Hero',
          backgroundImage: '/images/hero-bg-desktop.png',
          backgroundImageMobile: '/images/hero-bg-mobile.png',
        }}
      />,
    )

    const source = container.querySelector(
      'source[srcset="/images/hero-bg-mobile.png"]',
    )
    expect(source).not.toBeNull()
    expect(source).toHaveAttribute('media', '(max-width: 639px)')
  })

  it('does not render a <source> when backgroundImageMobile is absent', () => {
    const { container } = render(
      <Hero
        config={{
          title: 'Desktop Only',
          backgroundImage: '/images/hero-bg-desktop.png',
        }}
      />,
    )

    expect(container.querySelector('source')).toBeNull()
  })

  it('does not render a background image when backgroundImage is absent', () => {
    const { container } = render(<Hero config={{ title: 'No Background' }} />)

    expect(container.querySelectorAll('img')).toHaveLength(0)
    expect(container.querySelector('picture')).toBeNull()
  })

  it('renders without crashing when only palette is provided (no backgroundImage)', () => {
    const palette: HeroPalette = {
      primary: '#ff0000',
      secondary: '#00ff00',
      accent: '#0000ff',
    }
    const { container } = render(
      <Hero config={{ title: 'Palette Only', palette }} />,
    )

    expect(screen.getByText('Palette Only')).toBeInTheDocument()
    expect(container.querySelectorAll('img')).toHaveLength(0)
  })

  it('renders without throwing when given an empty config', () => {
    expect(() => render(<Hero config={{}} />)).not.toThrow()
  })
})
