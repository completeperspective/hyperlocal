import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfileCompletionBanner } from './profile-completion-banner'

// localStorage mock is provided by jsdom

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('ProfileCompletionBanner', () => {
  it('renders nothing when nickname is set', () => {
    const { container } = render(
      <ProfileCompletionBanner nickname="swift-fox" />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows banner when nickname is missing', () => {
    render(<ProfileCompletionBanner />)
    expect(screen.getByRole('alert')).toBeDefined()
    expect(screen.getByText(/set up your profile/i)).toBeDefined()
  })

  it('dismissing the banner writes to localStorage and hides it', () => {
    render(<ProfileCompletionBanner />)
    const dismissBtn = screen.getByRole('button', { name: /dismiss/i })
    fireEvent.click(dismissBtn)

    expect(localStorage.getItem('profile-banner-dismissed')).toBe('1')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('does not show banner when previously dismissed', () => {
    localStorage.setItem('profile-banner-dismissed', '1')
    const { container } = render(<ProfileCompletionBanner />)
    // Banner should not appear even with no nickname
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })
})
