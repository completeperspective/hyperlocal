import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CopyableCodeBlock } from './copyable-code-block'

const mockWriteText = vi.fn()

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: mockWriteText },
    configurable: true,
  })
  mockWriteText.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('CopyableCodeBlock', () => {
  it('renders children inside a pre element', () => {
    render(<CopyableCodeBlock>const x = 1</CopyableCodeBlock>)
    expect(screen.getByText('const x = 1')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Copy code' }),
    ).toBeInTheDocument()
  })

  it('copies the pre text to clipboard on button click', async () => {
    render(<CopyableCodeBlock>const answer = 42</CopyableCodeBlock>)
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }))
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('const answer = 42')
    })
  })

  it('passes className through to the pre element', () => {
    const { container } = render(
      <CopyableCodeBlock className="custom-class">code</CopyableCodeBlock>,
    )
    expect(container.querySelector('pre')).toHaveClass('custom-class')
  })

  it('handles clipboard failure without crashing', async () => {
    mockWriteText.mockRejectedValue(new Error('Permission denied'))
    render(<CopyableCodeBlock>code</CopyableCodeBlock>)
    // Should not throw
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }))
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalled()
    })
  })
})
