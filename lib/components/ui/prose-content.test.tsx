import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProseContent } from './prose-content'

describe('ProseContent', () => {
  it('renders children inside a div with prose classes', () => {
    const { container } = render(<ProseContent>Hello world</ProseContent>)
    const el = container.firstElementChild as HTMLElement
    expect(el.className).toContain('prose')
    expect(el.className).toContain('max-w-none')
    expect(el.textContent).toBe('Hello world')
  })

  it('merges custom className without losing base classes', () => {
    const { container } = render(
      <ProseContent className="my-custom-class">Content</ProseContent>,
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.className).toContain('prose')
    expect(el.className).toContain('my-custom-class')
  })

  it('renders without a className prop', () => {
    const { container } = render(<ProseContent>No class</ProseContent>)
    const el = container.firstElementChild as HTMLElement
    expect(el.tagName).toBe('DIV')
    expect(el.className).toContain('prose-neutral')
  })
})
