import { NextResponse } from 'next/server'
import { AppSettings } from '@/server/helpers/AppSettings'
import type { ClientConfig } from '@/types'

export async function GET(): Promise<NextResponse> {
  const projectId = process.env.WALLETCONNECT_PROJECT_ID

  if (!projectId) {
    return NextResponse.json(
      { error: 'Server misconfiguration: WALLETCONNECT_PROJECT_ID is not set' },
      { status: 500 },
    )
  }

  const settings = await AppSettings.instance.settings()

  const config: ClientConfig = {
    walletConnectProjectId: projectId,
    alchemyBaseKey: process.env.ALCHEMY_BASE_KEY ?? null,
    alchemyBaseSepoliaKey: process.env.ALCHEMY_BASE_SEPOLIA_KEY ?? null,
    enableTestnets: process.env.ENABLE_TESTNETS === 'true',
    receiverWalletAddress: settings?.receiverWalletAddress ?? null,
  }

  return NextResponse.json(config)
}
