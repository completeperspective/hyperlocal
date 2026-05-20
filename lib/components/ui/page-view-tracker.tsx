'use client'

import { useEffect } from 'react'

export function PageViewTracker({
  courseSlug,
  pageSlug,
}: {
  courseSlug: string
  pageSlug: string
}) {
  useEffect(() => {
    // Reason: skip in dev to avoid polluting progress data during iteration
    if (process.env.NODE_ENV === 'development') return
    fetch(`/api/v1/courses/${courseSlug}/lessons/${pageSlug}/view`, {
      method: 'POST',
    }).catch((err) => console.warn('Failed to track lesson view:', err))
  }, [courseSlug, pageSlug])
  return null
}
