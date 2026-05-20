export const DEFAULT_AVATAR_URL = '/images/hero-bg-mobile.png'

export function displayEmail(email: string | null | undefined): string | null {
  if (!email || email.endsWith('@wallet.local')) return null
  return email
}

export function shortWalletAddress(
  address: string | null | undefined,
): string | null {
  if (!address) return null
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}
