import { getSession } from '@/server/auth'
import { AppSettings } from '@/server/helpers/AppSettings'
import { keystoneContext } from '@/server/keystone/context'
import type { MembershipTier } from '@/types/membership'
import { GetAccessClient } from './get-access-client'

export default async function GetAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const _s = await searchParams
  const returnTo = typeof _s?.returnTo === 'string' ? _s.returnTo : '/dashboard'

  const [appSettings, { data: sessionData }] = await Promise.all([
    AppSettings.instance.settings(),
    getSession(),
  ])

  const tiersRaw = await keystoneContext.prisma.membershipTier.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      priceInCents: true,
      paymentType: true,
      isActive: true,
    },
  })

  const tiers: MembershipTier[] = tiersRaw.map((t) => ({
    id: t.id,
    name: t.name ?? '',
    description: t.description ?? null,
    priceInCents: t.priceInCents ?? 0,
    paymentType: (t.paymentType as MembershipTier['paymentType']) ?? 'one_time',
    isActive: t.isActive ?? false,
    stripeProductId: null,
    stripePriceId: null,
    contentAccessPatterns: [],
  }))

  return (
    <GetAccessClient
      returnTo={returnTo}
      tiers={tiers}
      allowWeb3Auth={appSettings?.allowWeb3Auth ?? false}
      allowSignup={appSettings?.allowSignup ?? false}
      signinMessage={appSettings?.web3SignInMessage ?? undefined}
      isAuthenticated={!!sessionData}
      walletAddress={sessionData?.walletAddress ?? null}
      receiverWalletAddress={appSettings?.receiverWalletAddress ?? null}
    />
  )
}
