import { randomBytes } from 'node:crypto'

interface NonceEntry {
  nonce: string
  expiresAt: number
}

const TTL_MS = 5 * 60 * 1000 // 5 minutes

// Next.js dev mode hot-reloads modules, which would reset a plain
// module-level Map and invalidate any nonces generated before the reload.
// Pinning the store to globalThis keeps it alive across HMR cycles.
const g = globalThis as typeof globalThis & {
  __nonceStore?: Map<string, NonceEntry>
}
const store = g.__nonceStore ?? (g.__nonceStore = new Map<string, NonceEntry>())

function pruneExpired(): void {
  const now = Date.now()
  for (const [address, entry] of store.entries()) {
    if (entry.expiresAt < now) store.delete(address)
  }
}

export function generateNonce(address: string): string {
  pruneExpired()
  const nonce = randomBytes(16).toString('hex')
  store.set(address, { nonce, expiresAt: Date.now() + TTL_MS })
  return nonce
}

export function validateNonce(address: string, nonce: string): boolean {
  const entry = store.get(address)
  if (!entry) return false
  if (entry.expiresAt < Date.now()) {
    store.delete(address)
    return false
  }
  return entry.nonce === nonce
}

export function consumeNonce(address: string): void {
  store.delete(address)
}
