'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { Button } from '@/ui/button'

interface CryptoQuote {
  tierId: string
  ethAmountWei: string
  expiry: number
}

interface QuoteState {
  quote: CryptoQuote
  sig: string
  ethPriceUsd: number
}

interface CryptoPaymentButtonProps {
  tierId: string
  priceInCents: number
  receiverAddress: string
  onSuccess: () => void
  onError: (msg: string) => void
}

export function CryptoPaymentButton({
  tierId,
  priceInCents,
  receiverAddress,
  onSuccess,
  onError,
}: CryptoPaymentButtonProps) {
  const [quoteState, setQuoteState] = useState<QuoteState | null>(null)
  const [isFetchingQuote, setIsFetchingQuote] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  // Reason: ref keeps the latest quote available inside the receipt useEffect
  // without adding quoteState to the dependency array (which would re-run verification).
  const quoteRef = useRef<QuoteState | null>(null)

  const fetchQuote = useCallback(async () => {
    setIsFetchingQuote(true)
    try {
      const res = await fetch(
        `/api/v1/memberships/checkout/crypto/quote?tierId=${tierId}`,
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        onError(
          (body as { message?: string }).message ??
            'Failed to fetch price quote',
        )
        return
      }
      const data = (await res.json()) as QuoteState
      setQuoteState(data)
      quoteRef.current = data
    } catch {
      onError('Network error fetching price quote')
    } finally {
      setIsFetchingQuote(false)
    }
  }, [tierId, onError])

  useEffect(() => {
    fetchQuote()
  }, [fetchQuote])

  const {
    sendTransaction,
    data: txHash,
    isPending: isSending,
  } = useSendTransaction()

  // Reason: wait for 3 confirmations matching MIN_CONFIRMATIONS in crypto-verify.ts.
  const { data: receipt, isLoading: isConfirming } =
    useWaitForTransactionReceipt({
      hash: txHash,
      confirmations: 3,
      query: { enabled: !!txHash },
    })

  // Reason: useEffect watches the confirmed receipt — idiomatic wagmi v3 pattern
  // since onSuccess callback is not supported on this hook.
  useEffect(() => {
    if (!receipt || !txHash || !quoteRef.current) return

    const verify = async () => {
      setIsVerifying(true)
      try {
        const { quote, sig } = quoteRef.current!
        const res = await fetch('/api/v1/memberships/checkout/crypto/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tierId, txHash, quote, sig }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          onError((body as { error?: string }).error ?? 'Verification failed')
        } else {
          onSuccess()
        }
      } catch {
        onError('Network error during verification')
      } finally {
        setIsVerifying(false)
      }
    }

    verify()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt])

  const isLoading = isFetchingQuote || isSending || isConfirming || isVerifying

  function handleClick() {
    if (!quoteState) return

    // Reason: re-fetch if quote expires in under 30 seconds to prevent sending
    // a tx that the server will reject as expired.
    if (quoteState.quote.expiry - Date.now() < 30_000) {
      fetchQuote()
      return
    }

    const valueWei = BigInt(quoteState.quote.ethAmountWei)
    sendTransaction(
      { to: receiverAddress as `0x${string}`, value: valueWei },
      { onError: (err) => onError(err.message ?? 'Transaction failed') },
    )
  }

  const ethDisplay = quoteState
    ? (Number(quoteState.quote.ethAmountWei) / 1e18).toFixed(5)
    : null

  const usdDisplay = (priceInCents / 100).toFixed(2)

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={isLoading || !quoteState}
        className="w-full"
      >
        {isFetchingQuote
          ? 'Fetching price...'
          : isSending
            ? 'Confirm in wallet...'
            : isConfirming
              ? 'Waiting for confirmation...'
              : isVerifying
                ? 'Verifying payment...'
                : ethDisplay
                  ? `Pay ${ethDisplay} ETH ($${usdDisplay})`
                  : 'Loading...'}
      </Button>
      {quoteState && (
        <p className="text-muted-foreground text-xs">
          Live rate: 1 ETH = ${quoteState.ethPriceUsd.toLocaleString()}. Quote
          valid for 5 minutes.
        </p>
      )}
    </div>
  )
}
