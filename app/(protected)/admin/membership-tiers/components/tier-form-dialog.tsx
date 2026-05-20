'use client'

import { useEffect, useState } from 'react'
import {
  ContentAccessPicker,
  type ContentCatalog,
} from '@/components/ui/content-access-picker'
import type { RecurringInterval, TierRow } from '@/types/membership-tiers-admin'
import { Alert, AlertDescription } from '@/ui/alert'
import { Button } from '@/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { CopyField } from '../../users/components/copy-field'

interface TierFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  tier?: TierRow
  onClose: () => void
  onSuccess: () => void
}

interface FormState {
  name: string
  description: string
  priceInCents: number
  currency: 'usd' | 'cad'
  paymentType: 'free' | 'one_time' | 'subscription'
  recurringInterval: RecurringInterval | null
  isActive: boolean
}

const defaultFormState: FormState = {
  name: '',
  description: '',
  priceInCents: 0,
  currency: 'usd',
  paymentType: 'free',
  recurringInterval: null,
  isActive: true,
}

export function TierFormDialog({
  open,
  mode,
  tier,
  onClose,
  onSuccess,
}: TierFormDialogProps) {
  const [form, setForm] = useState<FormState>(defaultFormState)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Content access pattern state
  const [patterns, setPatterns] = useState<string[]>([])
  const [catalog, setCatalog] = useState<ContentCatalog | null>(null)
  const [showDescriptionNudge, setShowDescriptionNudge] = useState(false)

  // Pre-fill form when editing
  useEffect(() => {
    if (mode === 'edit' && tier) {
      setForm({
        name: tier.name,
        description: tier.description ?? '',
        priceInCents: tier.priceInCents,
        currency: tier.currency,
        paymentType: tier.paymentType,
        recurringInterval: tier.recurringInterval,
        isActive: tier.isActive,
      })
      setPatterns(tier.contentAccessPatterns ?? [])
    } else if (mode === 'create') {
      setForm(defaultFormState)
      setPatterns([])
    }
    setShowDescriptionNudge(false)
    setError(null)
  }, [mode, tier])

  // Fetch content catalog when dialog opens
  useEffect(() => {
    if (!open) return
    fetch('/api/v1/admin/content-catalog')
      .then((r) => r.json())
      .then((d: ContentCatalog) => setCatalog(d))
      .catch(() => {})
  }, [open])

  function handlePatternsChange(next: string[]) {
    setPatterns(next)
    if (form.description) setShowDescriptionNudge(true)
  }

  function handlePaymentTypeChange(
    value: 'free' | 'one_time' | 'subscription',
  ) {
    setForm((prev) => ({
      ...prev,
      paymentType: value,
      priceInCents: value === 'free' ? 0 : prev.priceInCents,
      recurringInterval:
        value === 'subscription' ? (prev.recurringInterval ?? 'month') : null,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const url =
      mode === 'create'
        ? '/api/v1/admin/membership-tiers'
        : `/api/v1/admin/membership-tiers/${tier?.id}`

    const method = mode === 'create' ? 'POST' : 'PATCH'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, contentAccessPatterns: patterns }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(
          (data as { message?: string }).message ?? 'Something went wrong.',
        )
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsPending(false)
    }
  }

  const priceDisabled = form.paymentType === 'free'
  const hasStripeIds =
    mode === 'edit' && (tier?.stripeProductId || tier?.stripePriceId)

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !isPending) onClose()
      }}
    >
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create'
              ? 'Create Membership Tier'
              : 'Edit Membership Tier'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Configure a new membership tier and its content access.'
              : 'Update the membership tier details and content access.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tier-name">Name</Label>
            <Input
              id="tier-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
              placeholder="e.g. Pro Member"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tier-description">Description</Label>
            <Input
              id="tier-description"
              value={form.description}
              onChange={(e) => {
                setForm((p) => ({ ...p, description: e.target.value }))
                setShowDescriptionNudge(false)
              }}
              placeholder="Optional description"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tier-payment-type">Payment Type</Label>
            <select
              id="tier-payment-type"
              value={form.paymentType}
              onChange={(e) =>
                handlePaymentTypeChange(
                  e.target.value as 'free' | 'one_time' | 'subscription',
                )
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="free">Free</option>
              <option value="one_time">One-time</option>
              <option value="subscription">Subscription</option>
            </select>
          </div>

          {form.paymentType === 'subscription' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tier-recurring-interval">Billing Interval</Label>
              <select
                id="tier-recurring-interval"
                value={form.recurringInterval ?? 'month'}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    recurringInterval: e.target.value as RecurringInterval,
                  }))
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
          )}

          {/* Currency + Price — side-by-side; currency locked in edit mode (Stripe constraint) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-end gap-3">
              <div className="flex flex-col gap-1.5 w-[90px] shrink-0">
                <Label htmlFor="tier-currency">Currency</Label>
                <select
                  id="tier-currency"
                  value={form.currency}
                  disabled={mode === 'edit' || priceDisabled}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      currency: e.target.value as 'usd' | 'cad',
                    }))
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="usd">USD</option>
                  <option value="cad">CAD</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <Label htmlFor="tier-price">Price (cents)</Label>
                <Input
                  id="tier-price"
                  type="number"
                  min={0}
                  value={form.priceInCents}
                  disabled={priceDisabled}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      priceInCents: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  placeholder="e.g. 999 for $9.99"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="tier-active"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((p) => ({ ...p, isActive: e.target.checked }))
              }
              className="size-4"
            />
            <Label htmlFor="tier-active">Active</Label>
          </div>

          {/* ─── Content Access Patterns ──────────────────────────────────── */}
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5 flex flex-col gap-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Content Access
            </p>
            <p className="text-xs text-muted-foreground">
              Grant access to specific content. Empty = no restrictions.
            </p>

            <ContentAccessPicker
              patterns={patterns}
              onChange={handlePatternsChange}
              catalog={catalog}
            />

            {/* Warning: zero patterns means unrestricted access */}
            {patterns.length === 0 && (
              <Alert
                variant="destructive"
                className="border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-300 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400"
              >
                <AlertDescription className="text-amber-800 dark:text-amber-300">
                  No patterns set — this tier will grant access to all gated
                  content.
                </AlertDescription>
              </Alert>
            )}

            {/* Description nudge when patterns change */}
            {showDescriptionNudge && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Access rules updated — review the tier description so it still
                accurately describes what members can access.
              </p>
            )}
          </div>

          {/* Read-only Stripe IDs — only shown in edit mode when they exist */}
          {hasStripeIds && (
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5 flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Stripe
              </p>
              {tier?.stripeProductId && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground shrink-0">
                    Product
                  </span>
                  <CopyField
                    value={tier.stripeProductId}
                    label="Copy Stripe product ID"
                  />
                </div>
              )}
              {tier?.stripePriceId && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground shrink-0">
                    Price
                  </span>
                  <CopyField
                    value={tier.stripePriceId}
                    label="Copy Stripe price ID"
                  />
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? mode === 'create'
                  ? 'Creating…'
                  : 'Saving…'
                : mode === 'create'
                  ? 'Create Tier'
                  : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
