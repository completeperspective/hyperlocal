import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { base, baseSepolia } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'
import { cookieStorage, createStorage, http, type Transport } from '@wagmi/core'

export interface WagmiConfigOptions {
  projectId: string
  alchemyBaseKey?: string | null
  alchemyBaseSepoliaKey?: string | null
  enableTestnets?: boolean
}

export function createWagmiConfig(options: WagmiConfigOptions) {
  const { projectId, alchemyBaseKey, alchemyBaseSepoliaKey, enableTestnets } =
    options

  const networks: [AppKitNetwork, ...AppKitNetwork[]] = enableTestnets
    ? [baseSepolia]
    : [base]

  // Reason: Explicit Record<number, Transport> annotation prevents TypeScript from
  // inferring a union type with optional undefined keys, which is incompatible
  // with WagmiAdapter's transports parameter. Passing undefined to http() falls
  // back to the chain's default public RPC, so Alchemy keys remain optional.
  const transports: Record<number, Transport> = enableTestnets
    ? {
        [baseSepolia.id]: http(
          alchemyBaseSepoliaKey
            ? `https://base-sepolia.g.alchemy.com/v2/${alchemyBaseSepoliaKey}`
            : undefined,
        ),
      }
    : {
        [base.id]: http(
          alchemyBaseKey
            ? `https://base-mainnet.g.alchemy.com/v2/${alchemyBaseKey}`
            : undefined,
        ),
      }

  const wagmiAdapter = new WagmiAdapter({
    storage: createStorage({ storage: cookieStorage }),
    ssr: true,
    projectId,
    networks,
    transports,
  })

  return {
    projectId,
    networks,
    wagmiAdapter,
    wagmiConfig: wagmiAdapter.wagmiConfig,
  }
}
