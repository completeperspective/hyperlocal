import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSendTransaction } from 'wagmi'
import { CryptoPaymentButton } from './crypto-payment-button'

// Reason: mock wagmi hooks to isolate component rendering from wallet provider.
vi.mock('wagmi', () => ({
  useSendTransaction: vi.fn(() => ({
    sendTransaction: vi.fn(),
    data: undefined,
    isPending: false,
  })),
  useWaitForTransactionReceipt: vi.fn(() => ({
    data: undefined,
    isLoading: false,
  })),
}))

const defaultProps = {
  tierId: 'tier-1',
  priceInCents: 999,
  receiverAddress: '0x1234567890123456789012345678901234567890',
  onSuccess: vi.fn(),
  onError: vi.fn(),
}

// Reason: mock a successful quote response so tests that need an active quote
// do not need to wait on network or MSW handler setup.
const mockQuoteResponse = {
  quote: {
    tierId: 'tier-1',
    ethAmountWei: '330000000000000',
    expiry: Date.now() + 5 * 60 * 1000,
  },
  sig: 'abc123def456',
  ethPriceUsd: 3030,
}

beforeEach(() => {
  vi.resetAllMocks()
  // Reason: reset to default non-pending state before each test so mock overrides
  // in individual tests don't bleed into others.
  vi.mocked(useSendTransaction).mockReturnValue({
    sendTransaction: vi.fn(),
    data: undefined,
    isPending: false,
  } as unknown as ReturnType<typeof useSendTransaction>)
})

describe('CryptoPaymentButton', () => {
  it('shows fetching state initially and then ETH amount after quote loads', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockQuoteResponse,
    }) as typeof fetch

    render(<CryptoPaymentButton {...defaultProps} />)

    // Immediately shows "Fetching price..." while quote loads
    expect(screen.getByText('Fetching price...')).toBeInTheDocument()

    // After quote resolves, button shows the ETH amount (may match multiple elements)
    await waitFor(() => {
      expect(screen.getAllByText(/ETH/).length).toBeGreaterThan(0)
    })
    // Rate note is also rendered
    expect(screen.getByText(/Live rate:/)).toBeInTheDocument()
  })

  it('shows sending state when isPending after quote is loaded', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockQuoteResponse,
    }) as typeof fetch

    vi.mocked(useSendTransaction).mockReturnValue({
      sendTransaction: vi.fn(),
      data: undefined,
      isPending: true,
    } as unknown as ReturnType<typeof useSendTransaction>)

    render(<CryptoPaymentButton {...defaultProps} />)

    // Wait for the quote to load first (isFetchingQuote overrides isSending in the label)
    await waitFor(() => {
      expect(screen.getByText('Confirm in wallet...')).toBeInTheDocument()
    })
  })

  it('disables button when loading (fetching quote or sending)', async () => {
    // Reason: quote fetch is pending so isFetchingQuote=true, button must be disabled.
    let resolveQuote!: (v: unknown) => void
    global.fetch = vi.fn().mockReturnValue(
      new Promise((res) => {
        resolveQuote = res
      }),
    ) as typeof fetch

    render(<CryptoPaymentButton {...defaultProps} />)

    // While fetch is in-flight the button is disabled
    expect(screen.getByRole('button')).toBeDisabled()

    // Resolve the fetch so we don't leave dangling promises
    resolveQuote({
      ok: true,
      json: async () => mockQuoteResponse,
    })
  })

  it('calls onError when quote fetch fails', async () => {
    const onError = vi.fn()
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Service unavailable' }),
    }) as typeof fetch

    render(<CryptoPaymentButton {...defaultProps} onError={onError} />)

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Service unavailable')
    })
  })
})
