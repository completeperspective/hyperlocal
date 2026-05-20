import { describe, expect, it } from 'vitest'
import { matchesPatterns, translatePattern } from './content-access'

describe('matchesPatterns', () => {
  it('returns true for empty patterns (no restriction)', () => {
    expect(matchesPatterns([], '/courses/anything')).toBe(true)
  })

  it('matches /courses/** against a lesson path', () => {
    expect(matchesPatterns(['/courses/**'], '/courses/intro/lesson-1')).toBe(
      true,
    )
  })

  it('does not match /courses/intro-only/** against a different course', () => {
    expect(
      matchesPatterns(['/courses/intro-only/**'], '/courses/advanced/lesson-1'),
    ).toBe(false)
  })

  it('matches exact slug pattern', () => {
    expect(matchesPatterns(['/courses/my-course'], '/courses/my-course')).toBe(
      true,
    )
  })

  it('does not match when no pattern fits', () => {
    expect(matchesPatterns(['/courses/**'], '/pages/about')).toBe(false)
  })

  // Edge cases
  it('returns true when patterns is undefined-like (null passed)', () => {
    // Reason: defensive check for data coming from DB as null
    expect(matchesPatterns(null as unknown as string[], '/any-path')).toBe(true)
  })

  it('matches multiple patterns — returns true if any matches', () => {
    expect(
      matchesPatterns(['/pages/**', '/courses/**'], '/courses/intro/lesson-1'),
    ).toBe(true)
  })

  // Failure case
  it('returns false for non-matching path with restrictive pattern', () => {
    expect(matchesPatterns(['/courses/intro/**'], '/dashboard')).toBe(false)
  })

  it('matches /courses/intro-101/** against the course root /courses/intro-101', () => {
    expect(
      matchesPatterns(['/courses/intro-101/**'], '/courses/intro-101'),
    ).toBe(true)
  })
})

describe('translatePattern', () => {
  it('translates /courses/** to "All courses"', () => {
    expect(translatePattern('/courses/**')).toBe('All courses')
  })

  it('translates /** to "All content"', () => {
    expect(translatePattern('/**')).toBe('All content')
  })

  it('translates /pages/** to "All pages"', () => {
    expect(translatePattern('/pages/**')).toBe('All pages')
  })

  it('translates slug to course name', () => {
    expect(translatePattern('/courses/intro-to-web3')).toBe(
      'Intro To Web3 course',
    )
  })

  it('translates course slug with /** suffix to course name', () => {
    expect(translatePattern('/courses/intro-to-web3/**')).toBe(
      'Intro To Web3 course',
    )
  })

  it('translates lesson path to lesson name', () => {
    expect(translatePattern('/courses/my-course/lesson-one')).toBe(
      'Lesson One lesson',
    )
  })

  it('falls back to raw pattern for unknown formats', () => {
    expect(translatePattern('/unknown/path/**')).toBe('/unknown/path/**')
  })

  // Edge case
  it('handles single-word slugs without dashes', () => {
    expect(translatePattern('/courses/blockchain')).toBe('Blockchain course')
  })
})

describe('translatePattern — PageIndex patterns', () => {
  const catalog: import('./content-access').ContentCatalogEntry[] = [
    {
      id: '1',
      slug: 'api-reference',
      basePath: 'docs',
      title: 'API Reference',
    },
    { id: '2', slug: 'blog', basePath: '', title: 'Blog' },
  ]

  it('translates a PageIndex /** pattern with basePath to index title', () => {
    expect(translatePattern('/docs/api-reference/**', catalog)).toBe(
      'API Reference index',
    )
  })

  it('translates a PageIndex exact path to index title', () => {
    expect(translatePattern('/docs/api-reference', catalog)).toBe(
      'API Reference index',
    )
  })

  it('translates a root-level PageIndex pattern (no basePath)', () => {
    expect(translatePattern('/blog/**', catalog)).toBe('Blog index')
  })

  it('falls back to raw pattern when no catalog entry matches', () => {
    expect(translatePattern('/unknown/path/**', catalog)).toBe(
      '/unknown/path/**',
    )
  })

  it('falls back to raw pattern when no catalog provided', () => {
    expect(translatePattern('/docs/api-reference/**')).toBe(
      '/docs/api-reference/**',
    )
  })
})
