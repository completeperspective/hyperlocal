import { http, HttpResponse } from 'msw'

export const handlers: ReturnType<typeof http.get>[] = [
  http.patch('/api/v1/account/profile', () => {
    return HttpResponse.json({ ok: true })
  }),

  http.post('/api/v1/auth/register', () => {
    return HttpResponse.json({ ok: true })
  }),

  http.patch('/api/v1/account/me', () => {
    return HttpResponse.json({ ok: true })
  }),
  http.post('/api/v1/courses/:slug/enroll', () =>
    HttpResponse.json({ enrollmentId: 'enrollment-1' }),
  ),
  http.post('/api/v1/courses/:slug/lessons/:pageSlug/view', () =>
    HttpResponse.json({ progressId: 'progress-1', viewCount: 1 }),
  ),
  http.patch('/api/v1/courses/:slug/lessons/:pageSlug/complete', () =>
    HttpResponse.json({ completedAt: new Date().toISOString() }),
  ),
  http.get('/api/v1/courses/progress', () =>
    HttpResponse.json({ courses: [] }),
  ),
  http.get('/api/v1/admin/content-catalog', () => {
    return HttpResponse.json({
      courses: [{ id: '1', slug: 'intro-to-web3', title: 'Intro to Web3' }],
      pages: [{ id: '2', slug: 'about', title: 'About' }],
      pageIndexes: [],
    })
  }),
]
