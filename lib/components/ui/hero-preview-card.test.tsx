import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { defaultHeroFormState } from './hero-form-section'
import { HeroPreviewCard } from './hero-preview-card'

const fullState = {
  ...defaultHeroFormState(),
  heroTitle: 'Build Amazing Apps',
  heroTitleHighlight: 'Amazing',
  heroEyebrow: 'New Course',
  heroDescription: 'Learn everything you need',
  heroCtaLabel: 'Get Started',
  heroImage: '/images/og-image.png',
  stats: [{ value: '2,400', label: 'Students' }],
}

describe('HeroPreviewCard', () => {
  it('renders title when heroTitle is set', async () => {
    render(<HeroPreviewCard value={fullState} />)
    // getByText fails on split text nodes (highlight span splits the title);
    // check the h3 textContent directly instead
    await waitFor(() => {
      const h3 = document.querySelector('h3')
      expect(h3?.textContent).toContain('Build Amazing Apps')
    })
  })

  it('shows placeholder when heroTitle is empty', () => {
    render(<HeroPreviewCard value={defaultHeroFormState()} />)
    expect(screen.getByText(/add a title to preview/i)).toBeTruthy()
  })

  it('title-only state: renders title without crashing', async () => {
    const state = { ...defaultHeroFormState(), heroTitle: 'Hello World' }
    render(<HeroPreviewCard value={state} />)
    await waitFor(() =>
      expect(screen.getByText('Hello World', { exact: false })).toBeTruthy(),
    )
  })

  it('renders label text below card', () => {
    render(<HeroPreviewCard value={fullState} />)
    expect(screen.getByText(/live preview/i)).toBeTruthy()
  })
})
