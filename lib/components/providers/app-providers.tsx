'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createAppKit } from '@reown/appkit/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import type { ClientConfig } from '@/types'
import { createWagmiConfig } from './wagmi-config'

// Module-level flag so createAppKit is called at most once per browser session,
// even if AppProviders re-renders.
let appKitInitialized = false
let wagmiState: ReturnType<typeof createWagmiConfig> | null = null

const Web3ReadyContext = createContext(false)
// Reason: WalletConnectButton calls useAppKit/useAppKitAccount/useSignMessage at render
// time; those hooks throw if createAppKit hasn't been called yet. This context lets
// the button defer rendering its hook-bearing inner component until AppKit is ready.
export const useWeb3Ready = () => useContext(Web3ReadyContext)

interface AppProvidersProps {
  children: React.ReactNode
  cookies: string | null
  allowWeb3Auth?: boolean
  siteMetadata?: {
    name: string
    description: string
  }
}

export function AppProviders({
  children,
  cookies,
  allowWeb3Auth = false,
  siteMetadata = {
    name: 'learn.colpitts.dev',
    description: 'Practical Web Applications with TypeScript and GraphQL',
  },
}: AppProvidersProps) {
  const [queryClient] = useState(() => new QueryClient())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!allowWeb3Auth || wagmiState !== null) return

    fetch('/api/v1/config/client')
      .then((res) => res.json() as Promise<ClientConfig>)
      .then((data) => {
        wagmiState = createWagmiConfig({
          projectId: data.walletConnectProjectId,
          alchemyBaseKey: data.alchemyBaseKey,
          alchemyBaseSepoliaKey: data.alchemyBaseSepoliaKey,
          enableTestnets: data.enableTestnets,
        })

        // Only initialize AppKit when Web3 auth is enabled in site settings.
        // Reason: createAppKit makes background HTTP requests to WalletConnect cloud
        // on every page load; initializing it unconditionally causes Failed to fetch
        // errors on pages where wallet auth is never needed.
        if (!appKitInitialized) {
          createAppKit({
            adapters: [wagmiState.wagmiAdapter],
            projectId: wagmiState.projectId,
            networks: wagmiState.networks,
            defaultNetwork: wagmiState.networks[0],
            metadata: {
              name: siteMetadata.name,
              description: siteMetadata.description,
              url: typeof window !== 'undefined' ? window.location.origin : '',
              icons: ['/icon.png'],
            },
            features: {
              email: false,
              socials: false,
              connectMethodsOrder: ['wallet'],
            },
            themeVariables: {
              '--w3m-accent': 'oklch(0.5844 0.228 8.91)',
              '--w3m-border-radius-master': '4px',
              '--w3m-font-family': 'inherit',
            },
          })
          appKitInitialized = true
        }

        setReady(true)
      })
  }, [allowWeb3Auth, siteMetadata.name, siteMetadata.description])

  if (!allowWeb3Auth) {
    return (
      <Web3ReadyContext.Provider value={false}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Web3ReadyContext.Provider>
    )
  }

  if (!ready || wagmiState === null) {
    return (
      <Web3ReadyContext.Provider value={false}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Web3ReadyContext.Provider>
    )
  }

  const initialState = cookieToInitialState(
    wagmiState.wagmiConfig as Config,
    cookies,
  )

  return (
    <Web3ReadyContext.Provider value={true}>
      <WagmiProvider
        config={wagmiState.wagmiConfig as Config}
        initialState={initialState}
      >
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </Web3ReadyContext.Provider>
  )
}

export default AppProviders
