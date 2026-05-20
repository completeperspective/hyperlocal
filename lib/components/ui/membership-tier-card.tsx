'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { MembershipTier } from '@/types/membership'
import { Button } from '@/ui/button'
import { translatePattern } from '@/utils/content-access'

// Maximum number of patterns shown before "show more" expander
const MAX_VISIBLE = 4

interface MembershipTierCardProps {
  tier: MembershipTier
  isCurrentTier: boolean
  onSelectStripe: (tierId: string) => void
  onSelectCrypto: (tierId: string) => void
  cryptoEnabled: boolean
  /** When false, payment CTAs are hidden — use for pricing previews before auth. */
  showCta?: boolean
  /** Optional glob patterns to render a "What's included" section */
  contentAccessPatterns?: string[]
}

function formatPrice(priceInCents: number, paymentType: string): string {
  if (priceInCents === 0) return 'Free'
  const dollars = (priceInCents / 100).toFixed(2)
  return paymentType === 'subscription' ? `$${dollars} / month` : `$${dollars}`
}

export function MembershipTierCard({
  tier,
  isCurrentTier,
  onSelectStripe,
  onSelectCrypto,
  cryptoEnabled,
  showCta = true,
  contentAccessPatterns,
}: MembershipTierCardProps) {
  const isFree = tier.paymentType === 'free' || tier.priceInCents === 0
  const [showAll, setShowAll] = useState(false)

  const hasPatterns = contentAccessPatterns && contentAccessPatterns.length > 0
  const visiblePatterns = hasPatterns
    ? showAll
      ? contentAccessPatterns
      : contentAccessPatterns.slice(0, MAX_VISIBLE)
    : []
  const hiddenCount = hasPatterns
    ? contentAccessPatterns.length - MAX_VISIBLE
    : 0

  return (
    <div className="border-border bg-card relative flex flex-col gap-3 rounded-lg border p-6">
      {isCurrentTier && (
        <span className="bg-primary text-primary-foreground absolute right-4 top-4 rounded-full px-3 py-0.5 text-xs font-semibold">
          Active
        </span>
      )}
      <h3 className="text-foreground text-xl font-semibold">{tier.name}</h3>
      {tier.description && (
        <p className="text-muted-foreground text-sm">{tier.description}</p>
      )}
      <p className="text-primary text-2xl font-bold">
        {formatPrice(tier.priceInCents, tier.paymentType)}
      </p>

      {/* What's included — only shown when contentAccessPatterns is non-empty */}
      {hasPatterns && (
        <div className="flex flex-col gap-2 pt-3 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            What&apos;s included
          </p>
          <ul className="flex flex-col gap-1.5">
            {visiblePatterns.map((pat) => (
              <li
                key={pat}
                className="flex items-center gap-2 text-sm text-foreground"
              >
                <Check className="size-4 text-positive shrink-0" />
                {translatePattern(pat)}
              </li>
            ))}
          </ul>
          {!showAll && hiddenCount > 0 && (
            <button
              type="button"
              className="text-xs text-primary underline-offset-4 hover:underline mt-0.5 ml-6"
              onClick={() => setShowAll(true)}
            >
              + {hiddenCount} more
            </button>
          )}
        </div>
      )}

      {showCta && (
        <div className="mt-auto flex flex-col gap-2 pt-2">
          {isFree ? (
            <Button
              onClick={() => onSelectStripe(tier.id)}
              disabled={isCurrentTier}
              className="w-full"
            >
              Get Started (Free)
            </Button>
          ) : (
            <>
              <Button
                onClick={() => onSelectStripe(tier.id)}
                disabled={isCurrentTier}
                className="w-full"
              >
                Pay with Card
              </Button>
              {cryptoEnabled && (
                <Button
                  variant="outline"
                  onClick={() => onSelectCrypto(tier.id)}
                  disabled={isCurrentTier}
                  className="w-full"
                >
                  Pay with Crypto
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
