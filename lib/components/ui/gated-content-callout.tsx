'use client'

import Link from 'next/link'
import { LockKeyhole } from 'lucide-react'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'

interface GatedContentCalloutProps {
  contentTitle: string
  requiredTiers: { id: string; name: string }[]
  /** Present when authenticated but on the wrong tier */
  currentTierName?: string
  isAuthenticated: boolean
  /** Defaults to '/get-access' */
  upgradeHref?: string
  /** Optional: first ~150 chars of plain-text content to display blurred as teaser */
  previewText?: string
}

export function GatedContentCallout({
  contentTitle,
  requiredTiers,
  currentTierName,
  isAuthenticated,
  upgradeHref = '/get-access',
  previewText,
}: GatedContentCalloutProps) {
  return (
    <div className="relative flex flex-col gap-6">
      {/* Blurred teaser */}
      {previewText && (
        <div className="relative overflow-hidden rounded-lg pointer-events-none select-none">
          <p className="text-base text-foreground blur-sm">{previewText}</p>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        </div>
      )}

      {/* Lock callout card */}
      <div className="rounded-xl border border-border bg-card p-8 flex flex-col items-center gap-5 text-center">
        <div className="rounded-full bg-muted w-14 h-14 flex items-center justify-center">
          <LockKeyhole className="size-6 text-muted-foreground" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-foreground">
            Membership Required
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            <span className="font-medium text-foreground">{contentTitle}</span>{' '}
            is available to members with{' '}
            {requiredTiers.length === 1
              ? 'this membership'
              : 'these memberships'}
            :
          </p>
        </div>

        {requiredTiers.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2">
            {requiredTiers.map((tier) => (
              <Badge key={tier.id} variant="outline">
                {tier.name}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            No memberships currently available.
          </p>
        )}

        {isAuthenticated && currentTierName && (
          <p className="text-xs text-muted-foreground">
            You have the{' '}
            <span className="font-medium text-foreground">
              {currentTierName}
            </span>{' '}
            membership.
          </p>
        )}

        {requiredTiers.length > 0 && (
          <Button asChild className="w-full max-w-xs">
            <Link href={upgradeHref}>
              {isAuthenticated ? 'Upgrade your membership' : 'Get access'}
            </Link>
          </Button>
        )}

        {!isAuthenticated && (
          <p className="text-xs text-muted-foreground">
            Already a member?{' '}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
