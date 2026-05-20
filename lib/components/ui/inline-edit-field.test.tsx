import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { InlineEditField } from './inline-edit-field'

describe('InlineEditField', () => {
  it('renders the field value and edit button', () => {
    render(<InlineEditField label="Nickname" value="alice" onSave={vi.fn()} />)
    expect(screen.getByText('alice')).toBeInTheDocument()
    expect(screen.getByTestId('inline-edit-nickname-btn')).toBeInTheDocument()
  })

  it('enters edit mode and saves on blur when value changes', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<InlineEditField label="Nickname" value="alice" onSave={onSave} />)

    await userEvent.click(screen.getByTestId('inline-edit-nickname-btn'))
    const input = screen.getByTestId('inline-edit-nickname-input')
    await userEvent.clear(input)
    await userEvent.type(input, 'bob')
    fireEvent.blur(input)

    await waitFor(() => expect(onSave).toHaveBeenCalledWith('bob'))
  })

  it('does not call onSave when the value is unchanged on blur', async () => {
    const onSave = vi.fn()
    render(<InlineEditField label="Nickname" value="alice" onSave={onSave} />)

    await userEvent.click(screen.getByTestId('inline-edit-nickname-btn'))
    fireEvent.blur(screen.getByTestId('inline-edit-nickname-input'))

    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows an error message and reverts optimistic value when onSave rejects', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('network error'))
    render(<InlineEditField label="Nickname" value="alice" onSave={onSave} />)

    await userEvent.click(screen.getByTestId('inline-edit-nickname-btn'))
    const input = screen.getByTestId('inline-edit-nickname-input')
    await userEvent.clear(input)
    await userEvent.type(input, 'bob')
    fireEvent.blur(input)

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to save'),
    )
    // After error the view mode shows the original value, not the failed draft
    expect(screen.getByText('alice')).toBeInTheDocument()
  })

  it('cancels edit mode without saving on Escape', async () => {
    const onSave = vi.fn()
    render(<InlineEditField label="Nickname" value="alice" onSave={onSave} />)

    await userEvent.click(screen.getByTestId('inline-edit-nickname-btn'))
    const input = screen.getByTestId('inline-edit-nickname-input')
    await userEvent.type(input, 'extra')
    await userEvent.keyboard('{Escape}')

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('alice')).toBeInTheDocument()
  })

  it('renders multiline textarea variant', async () => {
    render(
      <InlineEditField label="Bio" value="hello" onSave={vi.fn()} multiline />,
    )
    await userEvent.click(screen.getByTestId('inline-edit-bio-btn'))
    expect(screen.getByTestId('inline-edit-bio-textarea')).toBeInTheDocument()
  })

  it('shows emptyText placeholder when value is empty', () => {
    render(
      <InlineEditField
        label="Location"
        value=""
        onSave={vi.fn()}
        emptyText="Nowhere yet"
      />,
    )
    expect(screen.getByText('Nowhere yet')).toBeInTheDocument()
  })
})
