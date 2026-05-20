import { createPublicClient } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { verifyOnChainPayment } from '../../lib/server/payments/crypto-verify'

// Reason: mock createPublicClient before module import so crypto-verify.ts
// gets the mock client at module evaluation time.
vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('viem')>()
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      getTransaction: vi.fn(),
      getTransactionReceipt: vi.fn(),
      getBlockNumber: vi.fn(),
    })),
  }
})

// Reason: must use a valid EIP-55 checksummed address — viem's getAddress()
// validates both length (20 bytes) and checksum casing.
const RECEIVER = '0x742d35Cc6634C0532925a3b844e801927E6Fd4F5'
const TX_HASH = '0xabc123' as `0x${string}`

describe('verifyOnChainPayment', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockClient: any

  beforeEach(() => {
    mockClient = vi.mocked(createPublicClient).mock.results[0]?.value
    if (!mockClient) return

    vi.mocked(mockClient.getTransaction).mockResolvedValue({
      to: RECEIVER,
      value: BigInt('1000000000000000'), // 0.001 ETH
    })

    vi.mocked(mockClient.getTransactionReceipt).mockResolvedValue({
      status: 'success',
      blockNumber: BigInt(100),
    })

    vi.mocked(mockClient.getBlockNumber).mockResolvedValue(BigInt(105))
  })

  it('returns ok:false when transaction not found', async () => {
    if (!mockClient) return
    vi.mocked(mockClient.getTransaction).mockResolvedValue(null)
    vi.mocked(mockClient.getTransactionReceipt).mockResolvedValue(null)
    const result = await verifyOnChainPayment(TX_HASH, RECEIVER, BigInt(1000))
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/not found/i)
  })

  it('returns ok:false when value is insufficient', async () => {
    if (!mockClient) return
    vi.mocked(mockClient.getTransaction).mockResolvedValue({
      to: RECEIVER,
      value: BigInt(100),
    })
    const result = await verifyOnChainPayment(TX_HASH, RECEIVER, BigInt(1000))
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/insufficient/i)
  })

  it('returns ok:false when confirmations are too low', async () => {
    if (!mockClient) return
    vi.mocked(mockClient.getBlockNumber).mockResolvedValue(BigInt(101))
    const result = await verifyOnChainPayment(TX_HASH, RECEIVER, BigInt(100))
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/confirmation/i)
  })
})
