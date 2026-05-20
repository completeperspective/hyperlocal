import { formatHex, oklch, parse } from 'culori'

/** Convert a camelCase token key to a human-readable label.
 *  e.g. "primaryForeground" → "Primary Foreground", "meta1" → "Meta 1" */
export function toLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/(\d+)/, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()
}

/** Convert an OKLCH CSS string to hex (#rrggbb).
 *  Returns null for alpha colors or unparseable strings. */
export function oklchToHex(oklchStr: string): string | null {
  try {
    const parsed = parse(oklchStr)
    if (!parsed) return null
    if (typeof parsed.alpha === 'number' && parsed.alpha < 1) return null
    return formatHex(parsed) ?? null
  } catch {
    return null
  }
}

/** Convert a hex color string (#rrggbb) to an OKLCH CSS string. */
export function hexToOklch(hex: string): string {
  const parsed = parse(hex)
  if (!parsed) return hex
  const color = oklch(parsed)
  if (!color) return hex
  const { l = 0, c = 0, h } = color
  return `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${(h ?? 0).toFixed(2)})`
}
