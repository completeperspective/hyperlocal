import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GatedContentCallout } from './gated-content-callout'

const requiredTiers = [
  { id: 'tier-1', name: 'Pro' },
  { id: 'tier-2', name: 'Enterprise' },
]

describe('GatedContentCallout', () => {
  // Happy path
  it('renders tier name badges when requiredTiers is provided', () => {
    render(
      <GatedContentCallout
        contentTitle="Intro to Web3"
        requiredTiers={requiredTiers}
        isAuthenticated={false}
      />,
    )
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('Enterprise')).toBeInTheDocument()
  })

  it('renders the content title in the description', () => {
    render(
      <GatedContentCallout
        contentTitle="Advanced Solidity"
        requiredTiers={requiredTiers}
        isAuthenticated={false}
      />,
    )
    expect(screen.getByText('Advanced Solidity')).toBeInTheDocument()
  })

  it('renders "Get access" button when unauthenticated', () => {
    render(
      <GatedContentCallout
        contentTitle="Course"
        requiredTiers={requiredTiers}
        isAuthenticated={false}
      />,
    )
    expect(screen.getByRole('link', { name: 'Get access' })).toBeInTheDocument()
  })

  it('renders "Upgrade your membership" button when authenticated', () => {
    render(
      <GatedContentCallout
        contentTitle="Course"
        requiredTiers={requiredTiers}
        isAuthenticated={true}
      />,
    )
    expect(
      screen.getByRole('link', { name: 'Upgrade your membership' }),
    ).toBeInTheDocument()
  })

  it('renders custom upgradeHref on the CTA button', () => {
    render(
      <GatedContentCallout
        contentTitle="Course"
        requiredTiers={requiredTiers}
        isAuthenticated={false}
        upgradeHref="/get-access?returnTo=%2Fcourses%2Fintro"
      />,
    )
    const link = screen.getByRole('link', { name: 'Get access' })
    expect(link).toHaveAttribute(
      'href',
      '/get-access?returnTo=%2Fcourses%2Fintro',
    )
  })

  // Sign-in link — only for unauthenticated
  it('renders "Sign in" link only when isAuthenticated is false', () => {
    render(
      <GatedContentCallout
        contentTitle="Course"
        requiredTiers={requiredTiers}
        isAuthenticated={false}
      />,
    )
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('does not render "Sign in" link when isAuthenticated is true', () => {
    render(
      <GatedContentCallout
        contentTitle="Course"
        requiredTiers={requiredTiers}
        isAuthenticated={true}
      />,
    )
    expect(
      screen.queryByRole('link', { name: 'Sign in' }),
    ).not.toBeInTheDocument()
  })

  // Current tier name
  it('renders current tier name paragraph when authenticated and currentTierName provided', () => {
    render(
      <GatedContentCallout
        contentTitle="Course"
        requiredTiers={requiredTiers}
        isAuthenticated={true}
        currentTierName="Basic"
      />,
    )
    expect(screen.getByText('Basic')).toBeInTheDocument()
  })

  it('does not render current tier paragraph when currentTierName is not provided', () => {
    render(
      <GatedContentCallout
        contentTitle="Course"
        requiredTiers={requiredTiers}
        isAuthenticated={true}
      />,
    )
    expect(screen.queryByText(/you're on the/i)).not.toBeInTheDocument()
  })

  // Preview text
  it('renders blurred preview text when previewText is provided', () => {
    render(
      <GatedContentCallout
        contentTitle="Course"
        requiredTiers={requiredTiers}
        isAuthenticated={false}
        previewText="This is a preview of the content..."
      />,
    )
    expect(
      screen.getByText('This is a preview of the content...'),
    ).toBeInTheDocument()
  })

  it('does not render preview section when previewText is not provided', () => {
    render(
      <GatedContentCallout
        contentTitle="Course"
        requiredTiers={requiredTiers}
        isAuthenticated={false}
      />,
    )
    // No blurred text container should be rendered
    expect(
      screen.queryByText('This is a preview of the content...'),
    ).not.toBeInTheDocument()
  })

  // Empty state
  it('renders empty state message when requiredTiers is empty', () => {
    render(
      <GatedContentCallout
        contentTitle="Course"
        requiredTiers={[]}
        isAuthenticated={false}
      />,
    )
    expect(
      screen.getByText(/no memberships currently available/i),
    ).toBeInTheDocument()
  })

  it('does not render CTA button when requiredTiers is empty', () => {
    render(
      <GatedContentCallout
        contentTitle="Course"
        requiredTiers={[]}
        isAuthenticated={false}
      />,
    )
    expect(
      screen.queryByRole('link', { name: 'Get access' }),
    ).not.toBeInTheDocument()
  })
})
