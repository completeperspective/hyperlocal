import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TrustedHtmlBlock } from './trusted-html-block'

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

describe('TrustedHtmlBlock', () => {
  it('renders the provided HTML content', () => {
    render(<TrustedHtmlBlock html="<p>Hello world</p>" />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('injects a copy button beside each pre element after mount', async () => {
    render(
      <TrustedHtmlBlock html="<pre>npm install</pre><pre>pnpm build</pre>" />,
    )
    const buttons = await screen.findAllByRole('button', { name: 'Copy code' })
    expect(buttons).toHaveLength(2)
  })

  it('does not render any copy buttons when html has no pre elements', () => {
    render(<TrustedHtmlBlock html="<p>Just a paragraph</p>" />)
    expect(
      screen.queryByRole('button', { name: 'Copy code' }),
    ).not.toBeInTheDocument()
  })

  it('copies the pre text to clipboard when button is clicked', async () => {
    render(<TrustedHtmlBlock html="<pre>git clone https://example.com</pre>" />)
    const button = await screen.findByRole('button', { name: 'Copy code' })
    fireEvent.click(button)
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(
        'git clone https://example.com',
      )
    })
  })

  it('handles clipboard failure without crashing', async () => {
    mockWriteText.mockRejectedValue(new Error('Permission denied'))
    render(<TrustedHtmlBlock html="<pre>code</pre>" />)
    const button = await screen.findByRole('button', { name: 'Copy code' })
    fireEvent.click(button)
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalled()
    })
  })
})
