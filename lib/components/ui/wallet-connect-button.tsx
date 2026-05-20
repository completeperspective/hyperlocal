'use client'

import * as React from 'react'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { base, baseSepolia } from 'viem/chains'
import { createSiweMessage } from 'viem/siwe'
import { useSignMessage } from 'wagmi'
import { useWeb3Ready } from '@/components/providers/app-providers'
import { Button } from '@/ui/button'

interface WalletConnectButtonProps {
  returnTo?: string
  signinMessage?: string
}

// Renders a disabled placeholder while AppKit initializes asynchronously.
export function WalletConnectButton(props: WalletConnectButtonProps) {
  const web3Ready = useWeb3Ready()
  if (!web3Ready) {
    return (
      <Button variant="outline" disabled={true} className="">
        Connect Wallet
      </Button>
    )
  }
  return <WalletConnectButtonInner {...props} />
}

function WalletConnectButtonInner({
  returnTo,
  signinMessage = 'Sign in with your wallet',
}: WalletConnectButtonProps) {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { mutateAsync: signMessageAsync } = useSignMessage()

  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // ref instead of state — the flag must not trigger re-renders or cause
  // the useEffect dependency array to create an infinite loop.
  const pendingSign = React.useRef(false)

  const isTestnet = process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true'
  const targetChain = isTestnet ? baseSepolia : base

  // When the wallet connects after the modal was opened via this button,
  // automatically proceed with the SIWE signing flow.
  React.useEffect(() => {
    if (isConnected && address && pendingSign.current) {
      pendingSign.current = false
      doSiweFlow(address)
    }
    // doSiweFlow is defined inside the component and recreated on each render.
    // Including it in deps would cause spurious calls. The function only uses
    // stable references so omitting it is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address])

  async function doSiweFlow(walletAddress: string) {
    setIsLoading(true)
    setError(null)

    try {
      // 1. Fetch a server-generated nonce for this address.
      const nonceRes = await fetch(
        `/api/v1/auth/wallet/nonce?address=${walletAddress}`,
      )
      if (!nonceRes.ok) {
        throw new Error('Failed to fetch nonce')
      }
      const { nonce } = await nonceRes.json()

      // 2. Construct the EIP-4361 message.
      const message = createSiweMessage({
        domain: window.location.host,
        address: walletAddress as `0x${string}`,
        statement: signinMessage,
        uri: window.location.origin,
        version: '1',
        chainId: targetChain.id,
        nonce,
      })

      // 3. Ask the wallet to sign the message.
      const signature = await signMessageAsync({ message })

      // 4. Send the signed message to the server for verification.
      const verifyRes = await fetch('/api/v1/auth/wallet/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature }),
      })
      if (!verifyRes.ok) {
        const errBody = await verifyRes.json().catch(() => ({}))
        throw new Error(errBody.message ?? 'Verification failed')
      }

      const resBody = await verifyRes.json().catch(() => ({}))

      // 5. Redirect on success — new wallet users land on onboarding first.
      // Hard navigation ensures the session cookie is committed on iOS WebKit
      // before the next request fires. router.push() races the cookie jar.
      if (resBody.isNewUser) {
        window.location.href = `/onboarding?returnTo=${encodeURIComponent(returnTo ?? '/dashboard')}`
      } else {
        window.location.href = returnTo ?? '/dashboard'
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ''
      const lower = message.toLowerCase()

      if (lower.includes('user rejected') || lower.includes('user denied')) {
        setError('Signature rejected. Please try again.')
      } else if (lower.includes('verification failed')) {
        setError('Sign-in failed. Please try again.')
      } else if (message) {
        setError(message)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  function handleClick() {
    if (!isConnected) {
      // Mark that we want to sign after connection resolves, then open modal.
      pendingSign.current = true
      open()
      return
    }

    doSiweFlow(address as string)
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="outline" onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Connect Wallet'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

export default WalletConnectButton
