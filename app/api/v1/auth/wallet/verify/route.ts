import { ApiError } from 'next/dist/server/api-utils'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createPublicClient, getAddress, http } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { parseSiweMessage, verifySiweMessage } from 'viem/siwe'
import { apiHandler } from '@/server/api'
import { consumeNonce, validateNonce } from '@/server/auth/wallet/nonce-store'
import { keystoneContext } from '@/server/keystone/context'
import { SessionData, sessionOptions } from '@/server/keystone/session'

const isTestnet = process.env.ENABLE_TESTNETS === 'true'
const chain = isTestnet ? baseSepolia : base

const publicClient = createPublicClient({
  chain,
  transport: http(),
})

async function verifyHandler(req: NextRequest) {
  const body = await req.json()
  const { message, signature } = body

  if (!message || !signature) {
    throw new ApiError(400, 'Missing message or signature')
  }

  // parseSiweMessage extracts the structured fields from the EIP-4361
  // plaintext string — no class instantiation needed.
  const parsed = parseSiweMessage(message)
  const address = getAddress(parsed.address!)

  if (!validateNonce(address, parsed.nonce!)) {
    throw new ApiError(401, 'Invalid or expired nonce')
  }

  // verifySiweMessage validates the signature via the public client.
  // Using the client (rather than a plain verifyMessage call) means
  // EIP-1271 smart contract wallet signatures are handled correctly.
  const success = await verifySiweMessage(publicClient, {
    message,
    signature: signature as `0x${string}`,
  })

  if (!success) {
    consumeNonce(address)
    throw new ApiError(401, 'Signature verification failed')
  }

  consumeNonce(address)

  const globalSettings = await keystoneContext.sudo().query.Settings.findOne({
    where: { id: '1' },
    query: 'allowWeb3Auth',
  })
  if (!globalSettings?.allowWeb3Auth) {
    throw new ApiError(403, 'Web3 sign-in is currently disabled')
  }

  const USER_QUERY =
    'id name email isAdmin walletAddress profile { nickname description location image { source { publicUrl } } }'

  let user = await keystoneContext.sudo().query.User.findOne({
    where: { walletAddress: address },
    query: USER_QUERY,
  })

  const isNewUser = !user

  if (!user) {
    const settings = await keystoneContext.sudo().query.Settings.findOne({
      where: { id: '1' },
      query: 'allowSignup',
    })

    if (!settings?.allowSignup) {
      throw new ApiError(403, 'Signups are currently disabled')
    }

    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`
    user = await keystoneContext.sudo().query.User.createOne({
      data: {
        name: shortAddress,
        email: `${address}@wallet.local`,
        walletAddress: address,
      },
      query: USER_QUERY,
    })
  }

  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  )
  const memberships = await keystoneContext
    .sudo()
    .query.UserMembership.findMany({
      where: {
        user: { id: { equals: user.id as string } },
        status: { equals: 'active' },
      },
      query: 'id',
    })

  session.data = {
    ...(user as SessionData['data']),
    isMember: memberships.length > 0,
  } as SessionData['data']
  await session.save()

  return NextResponse.json({ ok: true, isNewUser })
}

export const POST = apiHandler(verifyHandler)
