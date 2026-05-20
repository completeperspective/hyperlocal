import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { server } from '~/__tests__/mocks/server'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import type { HeroData } from '@/types/hero'
import type { PageData } from '@/types/page'
import { HeroPanel } from './hero-panel'

const mockHero: HeroData = {
  id: 'hero-1',
  name: 'Test Hero',
  heroEyebrow: null,
  heroTitle: null,
  heroTitleHighlight: null,
  heroDescription: null,
  heroCtaLabel: null,
  heroCtaHref: null,
  heroSecondaryLabel: null,
  heroSecondaryHref: null,
  heroStat1Value: null,
  heroStat1Label: null,
  heroStat2Value: null,
  heroStat2Label: null,
  heroStat3Value: null,
  heroStat3Label: null,
  heroImage: null,
  heroImageBadgeTitle: null,
  heroImageBadgeSubtitle: null,
  heroBackgroundImage: null,
  heroBackgroundImageMobile: null,
  heroFullscreen: false,
  heroHideGrid: false,
}

const basePageData = {
  id: 'page-1',
  title: 'Test Page',
  slug: 'test-page',
  description: '',
  status: 'draft',
  publishedAt: null,
  heroEnabled: false,
  content: {},
  trustedHtml: '',
  customCss: '',
  hero: null,
} as unknown as PageData

const enabledPageData = {
  ...basePageData,
  heroEnabled: true,
  hero: mockHero,
} as unknown as PageData

describe('HeroPanel', () => {
  it('renders the "Show hero on this page" toggle', () => {
    render(<HeroPanel pageId="page-1" initialData={basePageData} />)
    expect(screen.getByLabelText('Show hero on this page')).toBeInTheDocument()
  })

  it('does not show Save changes button when hero is disabled', () => {
    render(<HeroPanel pageId="page-1" initialData={basePageData} />)
    expect(
      screen.queryByRole('button', { name: /save changes/i }),
    ).not.toBeInTheDocument()
  })

  it('shows Save changes button when hero is enabled and linked', () => {
    render(<HeroPanel pageId="page-1" initialData={enabledPageData} />)
    expect(
      screen.getByRole('button', { name: /save changes/i }),
    ).toBeInTheDocument()
  })

  it('shows Saved confirmation on successful save (existing hero)', async () => {
    server.use(
      http.patch('/api/v1/admin/heroes/hero-1', () =>
        HttpResponse.json({ updated: true }),
      ),
    )
    render(<HeroPanel pageId="page-1" initialData={enabledPageData} />)
    fireEvent.submit(
      screen.getByRole('button', { name: /save changes/i }).closest('form')!,
    )
    await waitFor(() => expect(screen.getByText(/✓ Saved/)).toBeInTheDocument())
  })

  it('shows error message on PATCH hero failure', async () => {
    server.use(
      http.patch('/api/v1/admin/heroes/hero-1', () =>
        HttpResponse.json({ message: 'Save failed' }, { status: 500 }),
      ),
    )
    render(<HeroPanel pageId="page-1" initialData={enabledPageData} />)
    fireEvent.submit(
      screen.getByRole('button', { name: /save changes/i }).closest('form')!,
    )
    await waitFor(() =>
      expect(screen.getByText('Save failed')).toBeInTheDocument(),
    )
  })
})
