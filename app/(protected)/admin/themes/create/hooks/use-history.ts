'use client'

import { useCallback, useRef, useState } from 'react'

interface UseHistory<T> {
  current: T
  canUndo: boolean
  canRedo: boolean
  push: (state: T) => void
  undo: () => T | undefined
  redo: () => T | undefined
  reset: (initial: T) => void
}

export function useHistory<T>(initial: T, maxSteps = 20): UseHistory<T> {
  const [index, setIndex] = useState(0)
  const history = useRef<T[]>([initial])

  const push = useCallback(
    (state: T) => {
      history.current = [...history.current.slice(0, index + 1), state].slice(
        -maxSteps,
      )
      setIndex(history.current.length - 1)
    },
    [index, maxSteps],
  )

  const undo = useCallback(() => {
    if (index <= 0) return undefined
    const newIndex = index - 1
    setIndex(newIndex)
    return history.current[newIndex]
  }, [index])

  const redo = useCallback(() => {
    if (index >= history.current.length - 1) return undefined
    const newIndex = index + 1
    setIndex(newIndex)
    return history.current[newIndex]
  }, [index])

  const reset = useCallback((state: T) => {
    history.current = [state]
    setIndex(0)
  }, [])

  return {
    current: history.current[index],
    canUndo: index > 0,
    canRedo: index < history.current.length - 1,
    push,
    undo,
    redo,
    reset,
  }
}
