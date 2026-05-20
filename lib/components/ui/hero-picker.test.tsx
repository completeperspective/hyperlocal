import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { server } from '~/__tests__/mocks/server'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import type { HeroData } from '@/types/hero'
import { HeroPicker } from './hero-picker'

const mockHero: HeroData = {
  id: 'hero-1',
  name: 'Homepage hero',
  heroEyebrow: 'Welcome',
  heroTitle: 'Build something great',
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

describe('HeroPicker — enable toggle', () => {
  it('renders the "Show hero on this page" toggle', () => {
    render(
      <HeroPicker
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHeroEnabled={false}
        initialHero={null}
      />,
    )
    expect(screen.getByLabelText('Show hero on this page')).toBeInTheDocument()
  })

  it('toggle is unchecked when initialHeroEnabled is false', () => {
    render(
      <HeroPicker
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHeroEnabled={false}
        initialHero={null}
      />,
    )
    expect(screen.getByLabelText('Show hero on this page')).not.toBeChecked()
  })

  it('toggle is checked when initialHeroEnabled is true', () => {
    render(
      <HeroPicker
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHeroEnabled={true}
        initialHero={mockHero}
      />,
    )
    expect(screen.getByLabelText('Show hero on this page')).toBeChecked()
  })

  it('checking the toggle calls PATCH parentEndpoint with { heroEnabled: true }', async () => {
    let patchBody: unknown
    server.use(
      http.patch('/api/v1/admin/courses/course-1', async ({ request }) => {
        patchBody = await request.json()
        return HttpResponse.json({ updated: true })
      }),
      http.get('/api/v1/admin/heroes', () => HttpResponse.json({ heroes: [] })),
    )

    render(
      <HeroPicker
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHeroEnabled={false}
        initialHero={null}
      />,
    )

    fireEvent.click(screen.getByLabelText('Show hero on this page'))

    await waitFor(() => expect(patchBody).toEqual({ heroEnabled: true }))
  })

  it('unchecking the toggle calls PATCH parentEndpoint with { heroEnabled: false }', async () => {
    let patchBody: unknown
    server.use(
      http.patch('/api/v1/admin/courses/course-1', async ({ request }) => {
        patchBody = await request.json()
        return HttpResponse.json({ updated: true })
      }),
    )

    render(
      <HeroPicker
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHeroEnabled={true}
        initialHero={mockHero}
      />,
    )

    fireEvent.click(screen.getByLabelText('Show hero on this page'))

    await waitFor(() => expect(patchBody).toEqual({ heroEnabled: false }))
  })

  it('shows error message when PATCH toggle returns 500', async () => {
    server.use(
      http.patch('/api/v1/admin/courses/course-1', () =>
        HttpResponse.json({ message: 'Toggle failed' }, { status: 500 }),
      ),
    )

    render(
      <HeroPicker
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHeroEnabled={false}
        initialHero={null}
      />,
    )

    fireEvent.click(screen.getByLabelText('Show hero on this page'))

    await waitFor(() =>
      expect(screen.getByText('Toggle failed')).toBeInTheDocument(),
    )
  })
})

describe('HeroPicker — when disabled (heroEnabled = false)', () => {
  it('does not show hero picker section when heroEnabled is false', () => {
    render(
      <HeroPicker
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHeroEnabled={false}
        initialHero={null}
      />,
    )
    expect(screen.queryByText('Create new hero')).not.toBeInTheDocument()
  })
})

describe('HeroPicker — when enabled with no linked hero', () => {
  it('shows empty state when no heroes exist and section is enabled', async () => {
    server.use(
      http.patch('/api/v1/admin/courses/course-1', () =>
        HttpResponse.json({ updated: true }),
      ),
      http.get('/api/v1/admin/heroes', () => HttpResponse.json({ heroes: [] })),
    )

    render(
      <HeroPicker
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHeroEnabled={false}
        initialHero={null}
      />,
    )

    // Enable the hero section
    fireEvent.click(screen.getByLabelText('Show hero on this page'))

    await waitFor(() =>
      expect(screen.getByText('No heroes yet')).toBeInTheDocument(),
    )
    expect(
      screen.getByRole('button', { name: /create your first hero/i }),
    ).toBeInTheDocument()
  })

  it('fetches hero list when picker is opened by enabling the toggle', async () => {
    const fetchSpy = vi.fn()
    server.use(
      http.patch('/api/v1/admin/courses/course-1', () =>
        HttpResponse.json({ updated: true }),
      ),
      http.get('/api/v1/admin/heroes', () => {
        fetchSpy()
        return HttpResponse.json({
          heroes: [
            {
              id: 'h1',
              name: 'Global hero',
              heroTitle: null,
              heroEyebrow: null,
            },
          ],
        })
      }),
    )

    render(
      <HeroPicker
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHeroEnabled={false}
        initialHero={null}
      />,
    )

    fireEvent.click(screen.getByLabelText('Show hero on this page'))

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledOnce())
  })

  it('shows the existing hero in the select list', async () => {
    server.use(
      http.patch('/api/v1/admin/courses/course-1', () =>
        HttpResponse.json({ updated: true }),
      ),
      http.get('/api/v1/admin/heroes', () =>
        HttpResponse.json({
          heroes: [
            {
              id: 'h1',
              name: 'Global hero',
              heroTitle: null,
              heroEyebrow: null,
            },
          ],
        }),
      ),
    )

    render(
      <HeroPicker
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHeroEnabled={false}
        initialHero={null}
      />,
    )

    fireEvent.click(screen.getByLabelText('Show hero on this page'))

    await waitFor(() =>
      expect(screen.getByText('Global hero')).toBeInTheDocument(),
    )
  })

  it('shows "Untitled Hero" card for a hero with null name, title, and eyebrow', async () => {
    server.use(
      http.patch('/api/v1/admin/courses/course-1', () =>
        HttpResponse.json({ updated: true }),
      ),
      http.get('/api/v1/admin/heroes', () =>
        HttpResponse.json({
          heroes: [
            {
              id: 'h2',
              name: null,
              heroTitle: null,
              heroEyebrow: null,
            },
          ],
        }),
      ),
    )

    render(
      <HeroPicker
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHeroEnabled={false}
        initialHero={null}
      />,
    )

    fireEvent.click(screen.getByLabelText('Show hero on this page'))

    await waitFor(() =>
      expect(screen.getByText(/untitled hero/i)).toBeInTheDocument(),
    )
  })
})

describe('HeroPicker — when a hero is already linked', () => {
  it('shows HeroEditor (Save changes button) when a hero is already linked', () => {
    render(
      <HeroPicker
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHeroEnabled={true}
        initialHero={mockHero}
      />,
    )
    expect(
      screen.getByRole('button', { name: /save changes/i }),
    ).toBeInTheDocument()
  })

  it('shows the "Unlink hero" button when a hero is linked', () => {
    render(
      <HeroPicker
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHeroEnabled={true}
        initialHero={mockHero}
      />,
    )
    expect(
      screen.getByRole('button', { name: /unlink hero/i }),
    ).toBeInTheDocument()
  })

  it('clicking "Unlink hero" calls PATCH parentEndpoint with { heroId: null }', async () => {
    let patchBody: unknown
    server.use(
      http.patch('/api/v1/admin/courses/course-1', async ({ request }) => {
        patchBody = await request.json()
        return HttpResponse.json({ updated: true })
      }),
      http.get('/api/v1/admin/heroes', () => HttpResponse.json({ heroes: [] })),
    )

    render(
      <HeroPicker
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHeroEnabled={true}
        initialHero={mockHero}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /unlink hero/i }))

    await waitFor(() => expect(patchBody).toEqual({ heroId: null }))
  })

  it('after unlinking, shows empty state', async () => {
    server.use(
      http.patch('/api/v1/admin/courses/course-1', () =>
        HttpResponse.json({ updated: true }),
      ),
      http.get('/api/v1/admin/heroes', () => HttpResponse.json({ heroes: [] })),
    )

    render(
      <HeroPicker
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHeroEnabled={true}
        initialHero={mockHero}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /unlink hero/i }))

    await waitFor(() =>
      expect(screen.getByText('No heroes yet')).toBeInTheDocument(),
    )
  })

  it('shows error when unlink PATCH returns 500', async () => {
    server.use(
      http.patch('/api/v1/admin/courses/course-1', () =>
        HttpResponse.json({ message: 'Unlink failed' }, { status: 500 }),
      ),
    )

    render(
      <HeroPicker
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHeroEnabled={true}
        initialHero={mockHero}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /unlink hero/i }))

    await waitFor(() =>
      expect(screen.getByText('Unlink failed')).toBeInTheDocument(),
    )
  })
})

describe('HeroPicker — create mode', () => {
  it('clicking "Create your first hero" shows the HeroEditor form', async () => {
    server.use(
      http.patch('/api/v1/admin/courses/course-1', () =>
        HttpResponse.json({ updated: true }),
      ),
      http.get('/api/v1/admin/heroes', () => HttpResponse.json({ heroes: [] })),
    )

    render(
      <HeroPicker
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHeroEnabled={false}
        initialHero={null}
      />,
    )

    // Enable the section first
    fireEvent.click(screen.getByLabelText('Show hero on this page'))

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /create your first hero/i }),
      ).toBeInTheDocument(),
    )

    fireEvent.click(
      screen.getByRole('button', { name: /create your first hero/i }),
    )

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /save changes/i }),
      ).toBeInTheDocument(),
    )
  })
})
