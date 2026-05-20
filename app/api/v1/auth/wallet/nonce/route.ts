import { ApiError } from 'next/dist/server/api-utils'
import { NextRequest, NextResponse } from 'next/server'
import { getAddress } from 'viem'
import { apiHandler } from '@/server/api'
import { generateNonce } from '@/server/auth/wallet/nonce-store'
import { keystoneContext } from '@/server/keystone/context'

async function nonceHandler(req: NextRequest) {
  const settings = await keystoneContext.sudo().query.Settings.findOne({
    where: { id: '1' },
    query: 'allowWeb3Auth',
  })
  if (!settings?.allowWeb3Auth) {
    throw new ApiError(403, 'Web3 sign-in is currently disabled')
  }

  const address = req.nextUrl.searchParams.get('address')
  if (!address) throw new ApiError(400, 'Missing address parameter')

  let checksumAddress: string
  try {
    checksumAddress = getAddress(address)
  } catch {
    throw new ApiError(400, 'Invalid wallet address')
  }

  const nonce = generateNonce(checksumAddress)
  return NextResponse.json({ nonce })
}

export const GET = apiHandler(nonceHandler)
