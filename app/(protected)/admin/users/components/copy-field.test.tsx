import { fireEvent, render, screen } from '@testing-library/react'
import { CopyField } from './copy-field'

const mockWriteText = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: mockWriteText },
  })
})

describe('CopyField', () => {
  it('renders the display value', () => {
    render(
      <CopyField value="full-value" displayValue="short-val" label="Copy ID" />,
    )
    expect(screen.getByText('short-val')).toBeInTheDocument()
  })

  it('renders the value itself when no displayValue is provided', () => {
    render(<CopyField value="my-value" label="Copy value" />)
    expect(screen.getByText('my-value')).toBeInTheDocument()
  })

  it('calls clipboard.writeText with the full value on button click', () => {
    render(
      <CopyField value="full-value" displayValue="short-val" label="Copy ID" />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Copy ID' }))
    expect(mockWriteText).toHaveBeenCalledWith('full-value')
  })

  it('shows the copy button by default', () => {
    render(<CopyField value="test" label="Copy" />)
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
  })
})
