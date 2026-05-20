'use client'

import { createContext, useContext, useState } from 'react'
import { useMutation } from '@tanstack/react-query'

interface LessonProgressContextValue {
  isComplete: boolean
  isPending: boolean
  error: string | null
  toggle: () => void
  pageSlug: string
}

const LessonProgressContext = createContext<LessonProgressContextValue | null>(
  null,
)

export interface LessonProgressProviderProps {
  courseSlug: string
  pageSlug: string
  initialCompletedAt: string | null
  children: React.ReactNode
}

export function LessonProgressProvider({
  courseSlug,
  pageSlug,
  initialCompletedAt,
  children,
}: LessonProgressProviderProps) {
  const [completedAt, setCompletedAt] = useState<string | null>(
    initialCompletedAt,
  )
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (complete: boolean) => {
      const res = await fetch(
        `/api/v1/courses/${courseSlug}/lessons/${pageSlug}/complete`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ complete }),
        },
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(
          (data as { message?: string }).message ?? 'Something went wrong',
        )
      }
      return (await res.json()) as { completedAt: string | null }
    },
    onMutate: (complete) => {
      setError(null)
      const previous = completedAt
      // Reason: optimistic update — set immediately so all consumers reflect
      // the new state before the network round-trip completes.
      setCompletedAt(complete ? new Date().toISOString() : null)
      return { previous }
    },
    onSuccess: (data) => {
      setCompletedAt(data.completedAt)
    },
    onError: (err, _complete, context) => {
      // Reason: rollback to the snapshot captured in onMutate.
      setCompletedAt((context as { previous: string | null }).previous)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    },
  })

  function toggle() {
    mutation.mutate(completedAt === null)
  }

  return (
    <LessonProgressContext.Provider
      value={{
        isComplete: completedAt !== null,
        isPending: mutation.isPending,
        error,
        toggle,
        pageSlug,
      }}
    >
      {children}
    </LessonProgressContext.Provider>
  )
}

export function useLessonProgress(): LessonProgressContextValue {
  const ctx = useContext(LessonProgressContext)
  if (ctx === null) {
    // Reason: gated/locked pages render CourseLessonSidebar and LessonMobileNav
    // without a provider (no mark-complete UI is shown there). Return an inert
    // default so those layouts don't crash. The sidebar's resolveIsComplete uses
    // pageSlug='' which never matches a real slug, so all items fall through to
    // the static progressMap path — correct for the empty progressMap those paths pass.
    return {
      isComplete: false,
      isPending: false,
      error: null,
      toggle: () => {},
      pageSlug: '',
    }
  }
  return ctx
}
