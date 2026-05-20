import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { HeroSummary } from '@/types/hero'
import { HeroPickerCard } from './hero-picker-card'

const hero: HeroSummary = {
  id: '1',
  name: 'Homepage Hero',
  heroTitle: 'Build Amazing Apps',
  heroEyebrow: 'New',
  heroBackgroundImage: null,
}

describe('HeroPickerCard', () => {
  it('renders hero name', () => {
    render(<HeroPickerCard hero={hero} selected={false} onSelect={vi.fn()} />)
    expect(screen.getByText('Homepage Hero')).toBeTruthy()
  })

  it('shows check icon when selected', () => {
    const { container } = render(
      <HeroPickerCard hero={hero} selected={true} onSelect={vi.fn()} />,
    )
    // The selected state applies ring-2 class to root
    expect(container.querySelector('.ring-2')).toBeTruthy()
  })

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn()
    render(<HeroPickerCard hero={hero} selected={false} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledOnce()
  })

  it('renders "Untitled Hero" for hero with no name/title/eyebrow', () => {
    const bare: HeroSummary = { id: '2' }
    render(<HeroPickerCard hero={bare} selected={false} onSelect={vi.fn()} />)
    expect(screen.getByText(/untitled hero/i)).toBeTruthy()
  })
})
