import { describe, expect, it } from 'vitest'
import { generateNickname } from './generate-nickname'

describe('generateNickname', () => {
  it('returns a string', () => {
    expect(typeof generateNickname()).toBe('string')
  })

  it('matches adjective-noun pattern', () => {
    const nickname = generateNickname()
    expect(nickname).toMatch(/^[a-z]+-[a-z]+$/)
  })

  it('calling many times produces more than one unique result', () => {
    const results = new Set(
      Array.from({ length: 50 }, () => generateNickname()),
    )
    expect(results.size).toBeGreaterThan(1)
  })
})
