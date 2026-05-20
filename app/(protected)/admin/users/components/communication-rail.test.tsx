import { render, screen } from '@testing-library/react'
import { CommunicationRail } from './communication-rail'

describe('CommunicationRail', () => {
  it('renders all 4 channel cards', () => {
    render(<CommunicationRail />)
    expect(screen.getByText('Direct Message')).toBeInTheDocument()
    expect(screen.getByText('Email Blast')).toBeInTheDocument()
    expect(screen.getByText('SMS')).toBeInTheDocument()
    expect(screen.getByText('User Groups')).toBeInTheDocument()
  })

  it('renders 4 "Coming Soon" badges', () => {
    render(<CommunicationRail />)
    expect(screen.getAllByText('Coming Soon')).toHaveLength(4)
  })

  it('renders 4 disabled "Notify me" buttons', () => {
    render(<CommunicationRail />)
    const buttons = screen.getAllByText('Notify me')
    expect(buttons).toHaveLength(4)
    buttons.forEach((btn) => expect(btn.closest('button')).toBeDisabled())
  })

  it('renders the section heading', () => {
    render(<CommunicationRail />)
    expect(screen.getByText('Communication Channels')).toBeInTheDocument()
  })

  it('renders channel descriptions', () => {
    render(<CommunicationRail />)
    expect(screen.getByText('In-app WebSocket messaging')).toBeInTheDocument()
    expect(screen.getByText('Sendgrid broadcast emails')).toBeInTheDocument()
  })
})
