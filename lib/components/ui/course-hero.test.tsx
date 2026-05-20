import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { HeroConfig } from '@/types/course'
import { CourseHero } from './course-hero'

const fullConfig: HeroConfig = {
  eyebrow: 'Full-Stack Course',
  title: 'Build a weapon-grade framework from scratch',
  titleHighlight: 'weapon-grade',
  description: 'A hands-on course covering every layer.',
  ctaLabel: 'Start Learning',
  ctaHref: '#lessons',
  secondaryLabel: 'Jump to Chapter 1',
  secondaryHref: '/01-create-project',
  stats: [
    { label: 'Lessons', value: '15' },
    { label: 'Chapters', value: '7' },
  ],
  image: '/images/og-image.png',
  imageBadgeTitle: 'TypeScript + GraphQL',
  imageBadgeSubtitle: 'Production-ready',
}

describe('CourseHero', () => {
  it('renders full config with all expected elements', () => {
    render(<CourseHero config={fullConfig} />)

    expect(screen.getByText('Full-Stack Course')).toBeInTheDocument()
    expect(
      screen.getByText('A hands-on course covering every layer.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Start Learning/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Jump to Chapter 1' }),
    ).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('Lessons')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('Chapters')).toBeInTheDocument()
    expect(screen.getByText('TypeScript + GraphQL')).toBeInTheDocument()
    expect(screen.getByText('Production-ready')).toBeInTheDocument()
  })

  it('renders with only title and description — optional sections are absent', () => {
    const minimalConfig: HeroConfig = {
      title: 'Minimal Course Title',
      description: 'Short description.',
    }
    render(<CourseHero config={minimalConfig} />)

    expect(screen.getByText('Minimal Course Title')).toBeInTheDocument()
    expect(screen.getByText('Short description.')).toBeInTheDocument()

    // No eyebrow, no CTAs, no stats, no image badge
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByText('Lessons')).not.toBeInTheDocument()
  })

  it('wraps the titleHighlight substring in a span', () => {
    render(<CourseHero config={fullConfig} />)

    // The highlighted word must be rendered as its own node
    const highlight = screen.getByText('weapon-grade')
    expect(highlight.tagName).toBe('SPAN')

    // The remaining title text must also be present
    expect(screen.getByText(/Build a/)).toBeInTheDocument()
    expect(screen.getByText(/framework from scratch/)).toBeInTheDocument()
  })

  it('does not render the stats container when stats is empty', () => {
    const noStatsConfig: HeroConfig = {
      title: 'Course Without Stats',
      stats: [],
    }
    render(<CourseHero config={noStatsConfig} />)

    // Stats labels should not be present
    expect(screen.queryByText('Lessons')).not.toBeInTheDocument()
    expect(screen.queryByText('Chapters')).not.toBeInTheDocument()
  })

  it('does not render the stats container when stats is absent', () => {
    const noStatsConfig: HeroConfig = {
      title: 'Course Without Stats Field',
    }
    render(<CourseHero config={noStatsConfig} />)

    expect(screen.queryByText('Lessons')).not.toBeInTheDocument()
  })

  it('renders background image when backgroundImage is set in config', () => {
    const { container } = render(
      <CourseHero
        config={{
          title: 'Test',
          backgroundImage: '/images/hero-bg-desktop.png',
        }}
      />,
    )

    const bgImg = container.querySelector(
      'img[src="/images/hero-bg-desktop.png"]',
    )
    expect(bgImg).not.toBeNull()
  })

  it('renders a <source> for mobile when backgroundImageMobile is set', () => {
    const { container } = render(
      <CourseHero
        config={{
          title: 'Responsive',
          backgroundImage: '/images/hero-bg-desktop.png',
          backgroundImageMobile: '/images/hero-bg-mobile.png',
        }}
      />,
    )

    const source = container.querySelector(
      'source[srcset="/images/hero-bg-mobile.png"]',
    )
    expect(source).not.toBeNull()
  })

  it('does not render background image when backgroundImage is absent', () => {
    const { container } = render(<CourseHero config={{ title: 'No Bg' }} />)

    expect(container.querySelectorAll('img')).toHaveLength(0)
    expect(container.querySelector('picture')).toBeNull()
  })

  it('renders without crashing when palette is provided', () => {
    const palette = {
      primary: '#ff0000',
      secondary: '#00ff00',
      accent: '#0000ff',
    }
    render(<CourseHero config={{ title: 'Palette Test', palette }} />)

    expect(screen.getByText('Palette Test')).toBeInTheDocument()
  })
})
