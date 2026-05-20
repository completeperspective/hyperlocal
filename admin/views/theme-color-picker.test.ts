import { describe, expect, it } from 'vitest'
import { controller } from './theme-color-picker'
import { hexToOklch, oklchToHex, toLabel } from './theme-color-picker-utils'

// ─── toLabel ─────────────────────────────────────────────────────────────────

describe('toLabel', () => {
  it('capitalises a single lowercase word', () => {
    expect(toLabel('background')).toBe('Background')
  })

  it('converts camelCase to title case with spaces', () => {
    expect(toLabel('primaryForeground')).toBe('Primary Foreground')
  })

  it('handles long multi-word camel keys', () => {
    expect(toLabel('sidebarAccentForeground')).toBe('Sidebar Accent Foreground')
  })

  it('inserts a space before numeric suffixes', () => {
    expect(toLabel('meta1')).toBe('Meta 1')
  })

  it('handles already-capitalised first character gracefully', () => {
    expect(toLabel('Meta')).toBe('Meta')
  })
})

// ─── oklchToHex ──────────────────────────────────────────────────────────────

describe('oklchToHex', () => {
  it('returns a hex string for a solid OKLCH color', () => {
    const hex = oklchToHex('oklch(0.6558 0.2557 359.13)')
    expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('returns a hex string for a black OKLCH color', () => {
    expect(oklchToHex('oklch(0 0 0)')).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('returns null for an OKLCH color with an alpha channel', () => {
    expect(oklchToHex('oklch(1 0 0 / 10%)')).toBeNull()
  })

  it('returns null for an OKLCH color with a decimal alpha < 1', () => {
    expect(oklchToHex('oklch(1 0 0 / 0.15)')).toBeNull()
  })

  it('returns null for an unparseable string', () => {
    expect(oklchToHex('not-a-color')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(oklchToHex('')).toBeNull()
  })
})

// ─── hexToOklch ──────────────────────────────────────────────────────────────

describe('hexToOklch', () => {
  it('returns a string starting with oklch(', () => {
    expect(hexToOklch('#ff0000')).toMatch(/^oklch\(/)
  })

  it('converts pure white', () => {
    const result = hexToOklch('#ffffff')
    expect(result).toMatch(/^oklch\(/)
    // White should have near-zero chroma
    const [, , c] = result.replace('oklch(', '').replace(')', '').split(' ')
    expect(parseFloat(c)).toBeCloseTo(0, 2)
  })

  it('converts pure black', () => {
    const result = hexToOklch('#000000')
    expect(result).toMatch(/^oklch\(/)
    const [l] = result.replace('oklch(', '').replace(')', '').split(' ')
    expect(parseFloat(l)).toBeCloseTo(0, 2)
  })

  it('round-trips through hex without losing the oklch structure', () => {
    const original = 'oklch(0.6558 0.2557 359.13)'
    const hex = oklchToHex(original)!
    const back = hexToOklch(hex)
    // Should still be an oklch string; exact values may differ due to gamut clamp
    expect(back).toMatch(/^oklch\(/)
  })

  it('falls back to the input string when the hex is invalid', () => {
    expect(hexToOklch('not-a-hex')).toBe('not-a-hex')
  })
})

// ─── controller ──────────────────────────────────────────────────────────────

describe('controller', () => {
  const ctrl = controller({
    path: 'lightMode',
    label: 'Light Mode',
    description: null,
    fieldMeta: null,
  })

  it('provides the correct path', () => {
    expect(ctrl.path).toBe('lightMode')
  })

  it('deserializes a JSON object into a stringified FieldValue', () => {
    const result = ctrl.deserialize({
      lightMode: { primary: 'oklch(0.5 0.2 30)' },
    })
    expect(result.kind).toBe('update')
    expect(JSON.parse(result.value)).toEqual({ primary: 'oklch(0.5 0.2 30)' })
  })

  it('deserializes null as an empty string value', () => {
    const result = ctrl.deserialize({ lightMode: null })
    expect(result.kind).toBe('update')
    expect(result.value).toBe('')
  })

  it('sets initial equal to value on deserialize', () => {
    const result = ctrl.deserialize({ lightMode: { ring: 'oklch(0.5 0 0)' } })
    expect(result.kind).toBe('update')
    if (result.kind === 'update') {
      expect(result.initial).toBe(result.value)
    }
  })

  it('serializes a FieldValue back to a JSON object', () => {
    const val = {
      kind: 'update' as const,
      value: '{"primary":"oklch(0.5 0.2 30)"}',
      initial: '',
    }
    expect(ctrl.serialize(val)).toEqual({
      lightMode: { primary: 'oklch(0.5 0.2 30)' },
    })
  })

  it('serializes null when value is an empty string', () => {
    const val = { kind: 'update' as const, value: '', initial: '' }
    expect(ctrl.serialize(val)).toEqual({ lightMode: null })
  })

  it('always passes validation', () => {
    expect(ctrl.validate()).toBe(true)
  })
})
