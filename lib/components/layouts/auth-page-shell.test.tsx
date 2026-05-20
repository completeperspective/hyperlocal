import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuthPageShell } from './auth-page-shell'

describe('AuthPageShell', () => {
  it('renders children inside a main element', () => {
    render(<AuthPageShell>Sign in form</AuthPageShell>)
    const main = screen.getByRole('main')
    expect(main).toBeTruthy()
    expect(main.textContent).toContain('Sign in form')
  })

  it('does not render a footer when footer prop is omitted', () => {
    render(<AuthPageShell>Content</AuthPageShell>)
    expect(screen.queryByRole('contentinfo')).toBeNull()
  })

  it('renders footer content when footer prop is provided', () => {
    render(<AuthPageShell footer={<span>© 2026</span>}>Content</AuthPageShell>)
    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeTruthy()
    expect(footer.textContent).toContain('© 2026')
  })

  it('merges custom className onto the outer wrapper', () => {
    const { container } = render(
      <AuthPageShell className="custom-bg">Content</AuthPageShell>,
    )
    const wrapper = container.firstElementChild
    expect(wrapper?.className).toContain('custom-bg')
    expect(wrapper?.className).toContain('grid')
  })
})
