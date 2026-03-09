'use client'

// Error boundaries must be Client Components
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NotFoundError({
  error,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="gap-8 col-start-2 row-start-2 flex min-h-screen flex-col items-center justify-center">
      <h2 className="font-mono text-white text-xl bg-black p-1 px-4 rounded-sm -rotate-2">
        <span className="text-secondary dark:text-secondary-dark">404 </span>
        <span className="text-gray-500">| </span>Page does not exist!
      </h2>
      <button
        className="text-primary dark:text-primary-dark underline"
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => router.push('/')
        }
      >
        Back to Home
      </button>
    </div>
  )
}
