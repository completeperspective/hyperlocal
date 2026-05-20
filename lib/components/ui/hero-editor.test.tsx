import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { server } from '~/__tests__/mocks/server'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import type { HeroData } from '@/types/hero'
import { HeroEditor } from './hero-editor'

const mockHero: HeroData = {
  id: 'hero-1',
  name: null,
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

describe('HeroEditor', () => {
  it('renders Save changes and Reset buttons', () => {
    render(
      <HeroEditor
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHero={null}
      />,
    )
    expect(
      screen.getByRole('button', { name: /save changes/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
  })

  it('renders Preview on site link when previewHref is provided', () => {
    render(
      <HeroEditor
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHero={mockHero}
        previewHref="/courses/my-course"
      />,
    )
    const link = screen.getByRole('link', { name: /preview on site/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/courses/my-course')
  })

  it('does not render Preview link when previewHref is not provided', () => {
    render(
      <HeroEditor
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHero={mockHero}
      />,
    )
    expect(
      screen.queryByRole('link', { name: /preview on site/i }),
    ).not.toBeInTheDocument()
  })

  it('when initialHero is provided with id, submit calls PATCH /api/v1/admin/heroes/hero-1', async () => {
    let patchedHeroId: string | undefined
    server.use(
      http.patch('/api/v1/admin/heroes/:id', ({ params }) => {
        patchedHeroId = params.id as string
        return HttpResponse.json({ updated: true })
      }),
    )

    render(
      <HeroEditor
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHero={mockHero}
      />,
    )

    fireEvent.submit(
      screen.getByRole('button', { name: /save changes/i }).closest('form')!,
    )

    await waitFor(() => expect(screen.getByText(/✓ Saved/)).toBeInTheDocument())
    expect(patchedHeroId).toBe('hero-1')
  })

  it('when initialHero is null, submit calls POST /api/v1/admin/heroes then PATCH parentEndpoint', async () => {
    let postCalled = false
    let parentPatched = false

    server.use(
      http.post('/api/v1/admin/heroes', () => {
        postCalled = true
        return HttpResponse.json({ id: 'hero-new' }, { status: 201 })
      }),
      http.patch('/api/v1/admin/courses/course-1', () => {
        parentPatched = true
        return HttpResponse.json({ updated: true })
      }),
    )

    render(
      <HeroEditor
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHero={null}
      />,
    )

    fireEvent.submit(
      screen.getByRole('button', { name: /save changes/i }).closest('form')!,
    )

    await waitFor(() => expect(screen.getByText(/✓ Saved/)).toBeInTheDocument())
    expect(postCalled).toBe(true)
    expect(parentPatched).toBe(true)
  })

  it('shows Saved confirmation on successful save (existing hero)', async () => {
    server.use(
      http.patch('/api/v1/admin/heroes/hero-1', () =>
        HttpResponse.json({ updated: true }),
      ),
    )

    render(
      <HeroEditor
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHero={mockHero}
      />,
    )

    fireEvent.submit(
      screen.getByRole('button', { name: /save changes/i }).closest('form')!,
    )

    await waitFor(() => expect(screen.getByText(/✓ Saved/)).toBeInTheDocument())
  })

  it('shows error message when hero PATCH returns 500', async () => {
    server.use(
      http.patch('/api/v1/admin/heroes/hero-1', () =>
        HttpResponse.json({ message: 'Internal error' }, { status: 500 }),
      ),
    )

    render(
      <HeroEditor
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHero={mockHero}
      />,
    )

    fireEvent.submit(
      screen.getByRole('button', { name: /save changes/i }).closest('form')!,
    )

    await waitFor(() =>
      expect(screen.getByText('Internal error')).toBeInTheDocument(),
    )
  })

  it('shows error message when hero POST returns 500', async () => {
    server.use(
      http.post('/api/v1/admin/heroes', () =>
        HttpResponse.json({ message: 'Create failed' }, { status: 500 }),
      ),
    )

    render(
      <HeroEditor
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHero={null}
      />,
    )

    fireEvent.submit(
      screen.getByRole('button', { name: /save changes/i }).closest('form')!,
    )

    await waitFor(() =>
      expect(screen.getByText('Create failed')).toBeInTheDocument(),
    )
  })

  it('shows error message when parent link PATCH returns 500', async () => {
    server.use(
      http.post('/api/v1/admin/heroes', () =>
        HttpResponse.json({ id: 'hero-new' }, { status: 201 }),
      ),
      http.patch('/api/v1/admin/courses/course-1', () =>
        HttpResponse.json({ message: 'Link failed' }, { status: 500 }),
      ),
    )

    render(
      <HeroEditor
        parentEndpoint="/api/v1/admin/courses/course-1"
        initialHero={null}
      />,
    )

    fireEvent.submit(
      screen.getByRole('button', { name: /save changes/i }).closest('form')!,
    )

    await waitFor(() =>
      expect(screen.getByText('Link failed')).toBeInTheDocument(),
    )
  })
})
