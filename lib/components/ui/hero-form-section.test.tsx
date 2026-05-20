import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { HeroData } from '@/types/hero'
import type { HeroFormState } from '@/types/page-index'
import {
  HeroFormSection,
  heroFormStateFromSource,
  heroFormStateToPayload,
} from './hero-form-section'

const baseState: HeroFormState = {
  id: null,
  name: '',
  heroEyebrow: '',
  heroTitle: '',
  heroTitleHighlight: '',
  heroDescription: '',
  heroCtaLabel: '',
  heroCtaHref: '',
  heroSecondaryLabel: '',
  heroSecondaryHref: '',
  stats: [],
  heroImage: '',
  heroImageBadgeTitle: '',
  heroImageBadgeSubtitle: '',
  heroBackgroundImage: '',
  heroBackgroundImageMobile: '',
  heroFullscreen: false,
  heroHideGrid: false,
}

describe('HeroFormSection', () => {
  it('renders all content field groups', () => {
    render(<HeroFormSection value={baseState} onChange={vi.fn()} />)
    expect(screen.getByLabelText('Eyebrow')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Title Highlight')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Button Label')).toBeInTheDocument()
    expect(screen.getByLabelText('Button Link')).toBeInTheDocument()
    expect(screen.getByLabelText('Secondary Label')).toBeInTheDocument()
    expect(screen.getByLabelText('Secondary Link')).toBeInTheDocument()
    expect(screen.getByText('0/3')).toBeInTheDocument()
    expect(screen.getByLabelText('Image URL')).toBeInTheDocument()
    expect(screen.getByLabelText('Badge Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Badge Subtitle')).toBeInTheDocument()
    // Fullscreen switch
    expect(
      screen.getByRole('switch', { name: /fullscreen mode/i }),
    ).toBeInTheDocument()
  })

  it('renders Background Image (desktop) and (mobile) inputs', () => {
    render(<HeroFormSection value={baseState} onChange={vi.fn()} />)
    expect(
      screen.getByLabelText('Background Image (desktop)'),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Background Image (mobile)'),
    ).toBeInTheDocument()
  })

  it('changing the eyebrow input calls onChange with updated heroEyebrow', () => {
    const onChange = vi.fn()
    render(<HeroFormSection value={baseState} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Eyebrow'), {
      target: { value: 'New Eyebrow' },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ heroEyebrow: 'New Eyebrow' }),
    )
  })

  it('changing bg image input calls onChange with updated heroBackgroundImage', () => {
    const onChange = vi.fn()
    render(<HeroFormSection value={baseState} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Background Image (desktop)'), {
      target: { value: 'https://example.com/bg.png' },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        heroBackgroundImage: 'https://example.com/bg.png',
      }),
    )
  })

  it('Add Stat button appends a stat row; disappears when 3 stats are present', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <HeroFormSection value={baseState} onChange={onChange} />,
    )

    expect(
      screen.getByRole('button', { name: /add stat/i }),
    ).toBeInTheDocument()

    const stateWith3: HeroFormState = {
      ...baseState,
      stats: [
        { value: '100', label: 'Users' },
        { value: '200', label: 'Courses' },
        { value: '300', label: 'Lessons' },
      ],
    }
    rerender(<HeroFormSection value={stateWith3} onChange={onChange} />)

    expect(
      screen.queryByRole('button', { name: /add stat/i }),
    ).not.toBeInTheDocument()
  })

  it('clicking Add Stat calls onChange with a new empty stat appended', () => {
    const onChange = vi.fn()
    render(<HeroFormSection value={baseState} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /add stat/i }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        stats: [{ value: '', label: '' }],
      }),
    )
  })

  it('shows character counter for eyebrow field', () => {
    const stateWithEyebrow = { ...baseState, heroEyebrow: 'Hello' }
    render(<HeroFormSection value={stateWithEyebrow} onChange={vi.fn()} />)
    expect(screen.getByText('5 / 80')).toBeInTheDocument()
  })

  it('shows character counter for description field', () => {
    const stateWithDesc = { ...baseState, heroDescription: 'A description' }
    render(<HeroFormSection value={stateWithDesc} onChange={vi.fn()} />)
    expect(screen.getByText('13 / 200')).toBeInTheDocument()
  })

  it('shows title highlight preview when heroTitleHighlight is set', () => {
    const stateWithHighlight = { ...baseState, heroTitleHighlight: 'Build' }
    render(<HeroFormSection value={stateWithHighlight} onChange={vi.fn()} />)
    expect(screen.getByText('Build')).toBeInTheDocument()
    expect(screen.getByText(/preview:/i)).toBeInTheDocument()
  })

  it('does not show title highlight preview when heroTitleHighlight is empty', () => {
    render(<HeroFormSection value={baseState} onChange={vi.fn()} />)
    expect(screen.queryByText(/preview:/i)).not.toBeInTheDocument()
  })

  it('clicking Remove on a stat row removes it from the array', () => {
    const onChange = vi.fn()
    const stateWithStat: HeroFormState = {
      ...baseState,
      stats: [{ value: '42', label: 'Members' }],
    }
    render(<HeroFormSection value={stateWithStat} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /remove stat 1/i }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ stats: [] }),
    )
  })
})

describe('heroFormStateFromSource', () => {
  const baseSrc: HeroData = {
    id: 'hero-1',
    name: null,
    heroEyebrow: null,
    heroTitle: null,
    heroTitleHighlight: null,
    heroDescription: null,
    heroCtaLabel: null,
    heroCtaHref: null,
    heroSecondaryLabel: null,
    heroSecondaryHref: null,
    heroStat1Value: null,
    heroStat1Label: null,
    heroStat2Value: null,
    heroStat2Label: null,
    heroStat3Value: null,
    heroStat3Label: null,
    heroImage: null,
    heroImageBadgeTitle: null,
    heroImageBadgeSubtitle: null,
    heroBackgroundImage: null,
    heroBackgroundImageMobile: null,
    heroFullscreen: false,
    heroHideGrid: false,
  }

  it('returns stats array of length 3 when all 3 stat pairs are set', () => {
    const src: HeroData = {
      ...baseSrc,
      heroStat1Value: '100',
      heroStat1Label: 'Users',
      heroStat2Value: '200',
      heroStat2Label: 'Courses',
      heroStat3Value: '300',
      heroStat3Label: 'Lessons',
    }
    const result = heroFormStateFromSource(src)
    expect(result.stats).toHaveLength(3)
    expect(result.stats[0]).toEqual({ value: '100', label: 'Users' })
    expect(result.stats[2]).toEqual({ value: '300', label: 'Lessons' })
  })

  it('returns empty stats array when no stat pairs are set', () => {
    const result = heroFormStateFromSource(baseSrc)
    expect(result.stats).toHaveLength(0)
  })

  it('skips a stat if only value is set but label is missing', () => {
    const src: HeroData = {
      ...baseSrc,
      heroStat1Value: '100',
      heroStat1Label: null,
    }
    const result = heroFormStateFromSource(src)
    expect(result.stats).toHaveLength(0)
  })

  it('maps id from HeroData.id', () => {
    const result = heroFormStateFromSource({ ...baseSrc, id: 'hero-abc' })
    expect(result.id).toBe('hero-abc')
  })

  it('maps name from HeroData.name', () => {
    const result = heroFormStateFromSource({ ...baseSrc, name: 'My Hero' })
    expect(result.name).toBe('My Hero')
  })

  it('maps heroBackgroundImage from HeroData', () => {
    const src: HeroData = {
      ...baseSrc,
      heroBackgroundImage: 'https://example.com/bg.jpg',
      heroBackgroundImageMobile: 'https://example.com/bg-mobile.jpg',
    }
    const result = heroFormStateFromSource(src)
    expect(result.heroBackgroundImage).toBe('https://example.com/bg.jpg')
    expect(result.heroBackgroundImageMobile).toBe(
      'https://example.com/bg-mobile.jpg',
    )
  })
})

describe('heroFormStateToPayload', () => {
  it('maps stats[0] to heroStat1Value and heroStat1Label', () => {
    const state: HeroFormState = {
      ...baseState,
      stats: [{ value: '99', label: 'Members' }],
    }
    const payload = heroFormStateToPayload(state)
    expect(payload.heroStat1Value).toBe('99')
    expect(payload.heroStat1Label).toBe('Members')
    expect(payload.heroStat2Value).toBeNull()
    expect(payload.heroStat2Label).toBeNull()
  })

  it('converts empty string fields to null', () => {
    const payload = heroFormStateToPayload(baseState)
    expect(payload.heroEyebrow).toBeNull()
    expect(payload.heroTitle).toBeNull()
    expect(payload.heroImage).toBeNull()
  })

  it('includes name in output', () => {
    const payload = heroFormStateToPayload({
      ...baseState,
      name: 'Global Hero',
    })
    expect(payload.name).toBe('Global Hero')
  })

  it('includes heroBackgroundImage and heroBackgroundImageMobile in output', () => {
    const state: HeroFormState = {
      ...baseState,
      heroBackgroundImage: 'https://example.com/bg.png',
      heroBackgroundImageMobile: 'https://example.com/bg-m.png',
    }
    const payload = heroFormStateToPayload(state)
    expect(payload.heroBackgroundImage).toBe('https://example.com/bg.png')
    expect(payload.heroBackgroundImageMobile).toBe(
      'https://example.com/bg-m.png',
    )
  })

  it('converts empty string bg image fields to null', () => {
    const payload = heroFormStateToPayload(baseState)
    expect(payload.heroBackgroundImage).toBeNull()
    expect(payload.heroBackgroundImageMobile).toBeNull()
  })
})
