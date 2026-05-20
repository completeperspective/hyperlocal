import micromatch from 'micromatch'

/**
 * Returns true if the given URL path matches at least one of the glob patterns.
 * Empty patterns array = no restrictions (returns true).
 */
export function matchesPatterns(patterns: string[], urlPath: string): boolean {
  if (!patterns || patterns.length === 0) return true
  return micromatch.isMatch(urlPath, patterns)
}

export interface ContentCatalogEntry {
  id: string
  slug: string
  title: string
  basePath?: string
}

/**
 * Translates a raw glob pattern into a human-readable label.
 * Pass `pageIndexes` to resolve PageIndex patterns to their titles.
 */
export function translatePattern(
  pattern: string,
  pageIndexes?: ContentCatalogEntry[],
): string {
  if (pattern === '/**') return 'All content'
  if (pattern === '/courses/**') return 'All courses'
  if (pattern === '/pages/**') return 'All pages'

  // /courses/:slug/** or /courses/:slug — single course
  const courseMatch = pattern.match(/^\/courses\/([^/*]+)(?:\/\*\*)?$/)
  if (courseMatch) {
    const label = courseMatch[1]
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
    return `${label} course`
  }

  // /courses/:course-slug/:page-slug — single lesson
  const lessonMatch = pattern.match(/^\/courses\/[^/]+\/([^/*]+)$/)
  if (lessonMatch) {
    const label = lessonMatch[1]
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
    return `${label} lesson`
  }

  // PageIndex patterns — resolved by matching against the provided catalog
  if (pageIndexes) {
    for (const idx of pageIndexes) {
      const idxPath = idx.basePath
        ? `/${idx.basePath}/${idx.slug}`
        : `/${idx.slug}`
      if (pattern === `${idxPath}/**` || pattern === idxPath) {
        return `${idx.title} index`
      }
    }
  }

  // Fallback: return the raw pattern
  return pattern
}
