'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import type { TierRow } from '@/types/membership-tiers-admin'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { TierDeleteDialog } from './tier-delete-dialog'
import { TierFormDialog } from './tier-form-dialog'

interface TierTableSectionProps {
  tiers: TierRow[]
}

function formatPrice(
  priceInCents: number,
  paymentType: string,
  currency: 'usd' | 'cad',
): string {
  if (paymentType === 'free' || priceInCents === 0) return 'Free'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(priceInCents / 100)
}

function paymentTypeBadgeVariant(
  paymentType: string,
): 'secondary' | 'outline' | 'default' {
  if (paymentType === 'free') return 'secondary'
  if (paymentType === 'one_time') return 'outline'
  return 'default'
}

function paymentTypeLabel(
  paymentType: string,
  recurringInterval: string | null,
): string {
  if (paymentType === 'free') return 'Free'
  if (paymentType === 'one_time') return 'One-time'
  if (recurringInterval === 'week') return 'Weekly'
  if (recurringInterval === 'year') return 'Yearly'
  return 'Monthly'
}

function truncateStripeId(id: string | null): string {
  if (!id) return '—'
  return id.length > 12 ? `${id.slice(0, 12)}…` : id
}

export function TierTableSection({ tiers }: TierTableSectionProps) {
  const router = useRouter()
  const [selectedTier, setSelectedTier] = useState<TierRow | null>(null)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null)
  const [deletingTier, setDeletingTier] = useState<TierRow | null>(null)

  function handleEditClick(tier: TierRow) {
    setSelectedTier(tier)
    setDialogMode('edit')
  }

  function handleDialogClose() {
    setDialogMode(null)
    setSelectedTier(null)
  }

  function handleDialogSuccess() {
    setDialogMode(null)
    setSelectedTier(null)
    router.refresh()
  }

  function handleDeleteSuccess() {
    setDeletingTier(null)
    router.refresh()
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setDialogMode('create')}>New Tier</Button>
      </div>

      {tiers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground text-lg mb-6">
            No membership tiers yet
          </p>
          <Button onClick={() => setDialogMode('create')}>
            Create your first tier
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile: card stack */}
          <div className="flex flex-col gap-3 sm:hidden">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{tier.name}</p>
                    {tier.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {tier.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(tier)}
                      aria-label={`Edit ${tier.name}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeletingTier(tier)}
                      aria-label={`Delete ${tier.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant={paymentTypeBadgeVariant(tier.paymentType)}>
                    {paymentTypeLabel(tier.paymentType, tier.recurringInterval)}
                  </Badge>
                  <Badge variant={tier.isActive ? 'default' : 'secondary'}>
                    {tier.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-muted-foreground">
                    {formatPrice(
                      tier.priceInCents,
                      tier.paymentType,
                      tier.currency,
                    )}
                  </span>
                  <span className="text-muted-foreground">
                    {tier.memberCount}{' '}
                    {tier.memberCount === 1 ? 'member' : 'members'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">
                    Payment Type
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Price</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Members</th>
                  <th className="text-left px-4 py-3 font-medium">
                    Stripe Product
                  </th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier) => (
                  <tr
                    key={tier.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{tier.name}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={paymentTypeBadgeVariant(tier.paymentType)}
                      >
                        {tier.paymentType === 'one_time'
                          ? 'One-time'
                          : tier.paymentType.charAt(0).toUpperCase() +
                            tier.paymentType.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {formatPrice(
                        tier.priceInCents,
                        tier.paymentType,
                        tier.currency,
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={tier.isActive ? 'default' : 'secondary'}>
                        {tier.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{tier.memberCount}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {truncateStripeId(tier.stripeProductId)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(tier)}
                          aria-label={`Edit ${tier.name}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeletingTier(tier)}
                          aria-label={`Delete ${tier.name}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <TierFormDialog
        open={dialogMode !== null}
        mode={dialogMode ?? 'create'}
        tier={dialogMode === 'edit' ? (selectedTier ?? undefined) : undefined}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
      />

      <TierDeleteDialog
        open={deletingTier !== null}
        tier={deletingTier}
        onClose={() => setDeletingTier(null)}
        onSuccess={handleDeleteSuccess}
      />
    </>
  )
}
