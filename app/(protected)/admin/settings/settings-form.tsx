'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'
import type { ClientSettings } from '@/types/client'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

interface Theme {
  id: string
  name: string
}

interface PageIndexOption {
  id: string
  title: string
  slug: string
  basePath: string
}

interface CourseOption {
  id: string
  title: string
  slug: string
}

interface SettingsFormProps {
  initialValues: ClientSettings
  themes: Theme[]
  pageIndexes: PageIndexOption[]
  courses: CourseOption[]
  lastReloadedAt: string | null
}

type FormValues = {
  siteName: string
  baseUrl: string
  copyright: string
  metaTitle: string
  metaDescription: string
  robots: string
  isPrivate: boolean
  allowSignup: boolean
  maintenanceMode: boolean
  maintenanceMessage: string
  gaTrackingId: string
  transparentHeader: boolean
  allowWeb3Auth: boolean
  web3SignInMessage: string
  receiverWalletAddress: string
  themeId: string
  ogImageId: string
  rootPageIndexId: string
  rootCourseId: string
}

function toFormValues(s: ClientSettings): FormValues {
  return {
    siteName: s.siteName ?? '',
    baseUrl: s.baseUrl ?? '',
    copyright: s.copyright ?? '',
    metaTitle: s.metaTitle ?? '',
    metaDescription: s.metaDescription ?? '',
    robots: s.robots ?? 'noindex, nofollow, noarchive, nosnippet',
    isPrivate: s.isPrivate ?? true,
    allowSignup: s.allowSignup ?? false,
    maintenanceMode: s.maintenanceMode ?? false,
    maintenanceMessage: s.maintenanceMessage ?? '',
    gaTrackingId: s.gaTrackingId ?? '',
    transparentHeader: s.transparentHeader ?? true,
    allowWeb3Auth: s.allowWeb3Auth ?? true,
    web3SignInMessage: s.web3SignInMessage ?? '',
    receiverWalletAddress: s.receiverWalletAddress ?? '',
    // Reason: AppSettings uses the Keystone query API which returns theme as a
    // nested object (not a flat themeId FK), so we read from theme.id directly.
    themeId: s.theme?.id ?? '',
    ogImageId: s.ogImage?.id ?? '',
    rootPageIndexId: s.rootPageIndex?.id ?? '',
    rootCourseId: s.rootCourse?.id ?? '',
  }
}

const ROBOTS_OPTIONS = [
  { label: 'Public (index, follow)', value: 'index, follow' },
  { label: 'No Index', value: 'noindex, follow' },
  { label: 'Full Block', value: 'noindex, nofollow, noarchive, nosnippet' },
]

export function SettingsForm({
  initialValues,
  themes,
  pageIndexes,
  courses,
  lastReloadedAt: initialReloadedAt,
}: SettingsFormProps) {
  const [values, setValues] = useState<FormValues>(() =>
    toFormValues(initialValues),
  )
  const [lastReloadedAt, setLastReloadedAt] = useState<string | null>(
    initialReloadedAt,
  )
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [ogImagePreviewUrl, setOgImagePreviewUrl] = useState<string | null>(
    initialValues.ogImage?.source?.publicUrl ?? null,
  )
  const [ogUploadPending, setOgUploadPending] = useState(false)
  const [ogUploadError, setOgUploadError] = useState<string | null>(null)

  const setText =
    (field: keyof FormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value }))

  const setCheck =
    (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.checked }))

  const handleOgImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    setOgUploadPending(true)
    setOgUploadError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/v1/admin/og-image', {
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Upload failed' }))
        throw new Error(err.message ?? 'Upload failed')
      }
      const data = (await res.json()) as { id: string; url: string }
      setValues((v) => ({ ...v, ogImageId: data.id }))
      setOgImagePreviewUrl(data.url)
    } catch (err) {
      setOgUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setOgUploadPending(false)
      e.target.value = ''
    }
  }

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const payload = {
        ...data,
        receiverWalletAddress: data.receiverWalletAddress.trim() || null,
        themeId: data.themeId || null,
        ogImageId: data.ogImageId || null,
        rootPageIndexId: data.rootPageIndexId || null,
        rootCourseId: data.rootCourseId || null,
      }
      const res = await fetch('/api/v1/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Save failed' }))
        throw new Error(err.message ?? 'Save failed')
      }
      return res.json() as Promise<{ reloadedAt: string }>
    },
    onSuccess: (data) => {
      setLastReloadedAt(data.reloadedAt)
      setStatusMsg({ type: 'success', text: 'Settings saved and reloaded.' })
    },
    onError: (err: Error) => {
      setStatusMsg({ type: 'error', text: err.message })
    },
  })

  const selectClass =
    'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setStatusMsg(null)
        mutation.mutate(values)
      }}
      className="flex flex-col gap-8"
    >
      {/* Identity */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-2">
          Identity
        </h2>
        <div className="grid gap-3">
          <div>
            <Label htmlFor="siteName">Site Name</Label>
            <Input
              id="siteName"
              value={values.siteName}
              onChange={setText('siteName')}
            />
          </div>
          <div>
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              value={values.baseUrl}
              onChange={setText('baseUrl')}
              placeholder="https://example.com"
            />
          </div>
          <div>
            <Label htmlFor="copyright">Footer Note</Label>
            <Input
              id="copyright"
              value={values.copyright}
              onChange={setText('copyright')}
            />
          </div>
        </div>
      </section>

      {/* OG Image */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-2">
          OG Image
        </h2>
        <div className="flex flex-col gap-3">
          {ogImagePreviewUrl && (
            <div
              className="relative w-full max-w-sm overflow-hidden rounded-md border border-border"
              style={{ aspectRatio: '1200/630' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ogImagePreviewUrl}
                alt="Current OG image preview"
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="flex items-center gap-3">
            <Label
              htmlFor="ogImageUpload"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {ogUploadPending
                ? 'Uploading…'
                : ogImagePreviewUrl
                  ? 'Replace Image'
                  : 'Upload Image'}
              <input
                id="ogImageUpload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handleOgImageUpload}
                disabled={ogUploadPending}
              />
            </Label>
            {values.ogImageId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setValues((v) => ({ ...v, ogImageId: '' }))
                  setOgImagePreviewUrl(null)
                }}
                className="text-destructive hover:text-destructive"
              >
                Remove
              </Button>
            )}
          </div>
          {ogUploadError && (
            <p className="text-sm text-destructive">{ogUploadError}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Recommended: 1200x630 px. Max 5 MB. JPEG, PNG, WebP, or GIF.
          </p>
        </div>
      </section>

      {/* Branding */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-2">
          Branding
        </h2>
        <div>
          <Label htmlFor="themeId">Active Theme</Label>
          <select
            id="themeId"
            value={values.themeId}
            onChange={setText('themeId')}
            className={selectClass}
          >
            <option value="">— No theme —</option>
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {themes.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              No themes found.{' '}
              <Link
                href="/admin/themes/create"
                className="underline underline-offset-2"
              >
                Create one
              </Link>{' '}
              first.
            </p>
          )}
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={values.transparentHeader}
            onChange={setCheck('transparentHeader')}
            className="size-4 accent-primary"
          />
          <span className="text-sm">Transparent Header on Hero Pages</span>
        </label>
      </section>

      {/* Content */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-2">
          Content
        </h2>
        <div>
          <Label htmlFor="rootPageIndexId">Root Page Index</Label>
          <select
            id="rootPageIndexId"
            value={values.rootPageIndexId}
            onChange={setText('rootPageIndexId')}
            className={selectClass}
          >
            <option value="">— None —</option>
            {pageIndexes.map((pi) => (
              <option key={pi.id} value={pi.id}>
                {pi.title}
              </option>
            ))}
          </select>
          {values.rootPageIndexId &&
            (() => {
              const pi = pageIndexes.find(
                (p) => p.id === values.rootPageIndexId,
              )
              const url = pi
                ? pi.basePath
                  ? `/${pi.basePath}/${pi.slug}`
                  : `/${pi.slug}`
                : null
              return url ? (
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  {url}
                </p>
              ) : null
            })()}
          {pageIndexes.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              No page indexes found.{' '}
              <Link
                href="/admin/page-indexes"
                className="underline underline-offset-2"
              >
                Create one
              </Link>{' '}
              first.
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="rootCourseId">Root Course</Label>
          <select
            id="rootCourseId"
            value={values.rootCourseId}
            onChange={setText('rootCourseId')}
            className={selectClass}
          >
            <option value="">— None —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          {values.rootCourseId &&
            (() => {
              const c = courses.find((x) => x.id === values.rootCourseId)
              return c ? (
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  /courses/{c.slug}
                </p>
              ) : null
            })()}
          {courses.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              No courses found.{' '}
              <Link
                href="/admin/content"
                className="underline underline-offset-2"
              >
                Create one
              </Link>{' '}
              first.
            </p>
          )}
        </div>
      </section>

      {/* SEO */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-2">
          SEO
        </h2>
        <div className="grid gap-3">
          <div>
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input
              id="metaTitle"
              value={values.metaTitle}
              onChange={setText('metaTitle')}
            />
          </div>
          <div>
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Input
              id="metaDescription"
              value={values.metaDescription}
              onChange={setText('metaDescription')}
            />
          </div>
          <div>
            <Label htmlFor="robots">Robots</Label>
            <select
              id="robots"
              value={values.robots}
              onChange={setText('robots')}
              className={selectClass}
            >
              {ROBOTS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Access Control */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-2">
          Access Control
        </h2>
        <div className="grid gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={values.isPrivate}
              onChange={setCheck('isPrivate')}
              className="size-4 accent-primary"
            />
            <span className="text-sm">App is Private</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={values.allowSignup}
              onChange={setCheck('allowSignup')}
              className="size-4 accent-primary"
            />
            <span className="text-sm">Allow Public Signups</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={values.maintenanceMode}
              onChange={setCheck('maintenanceMode')}
              className="size-4 accent-primary"
            />
            <span className="text-sm">Maintenance Mode</span>
          </label>
          <div>
            <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
            <Input
              id="maintenanceMessage"
              value={values.maintenanceMessage}
              onChange={setText('maintenanceMessage')}
            />
          </div>
        </div>
      </section>

      {/* Analytics */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-2">
          Analytics
        </h2>
        <div>
          <Label htmlFor="gaTrackingId">Google Analytics ID</Label>
          <Input
            id="gaTrackingId"
            value={values.gaTrackingId}
            onChange={setText('gaTrackingId')}
            placeholder="G-XXXXXXXXXX"
          />
        </div>
      </section>

      {/* Web3 */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-2">
          Web3
        </h2>
        <div className="grid gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={values.allowWeb3Auth}
              onChange={setCheck('allowWeb3Auth')}
              className="size-4 accent-primary"
            />
            <span className="text-sm">Allow Web3 Wallet Sign-In</span>
          </label>
          <div>
            <Label htmlFor="web3SignInMessage">Sign-In Message</Label>
            <Input
              id="web3SignInMessage"
              value={values.web3SignInMessage}
              onChange={setText('web3SignInMessage')}
            />
          </div>
        </div>
      </section>

      {/* Payments */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-2">
          Payments
        </h2>
        <div>
          <Label htmlFor="receiverWalletAddress">Receiver Wallet Address</Label>
          <Input
            id="receiverWalletAddress"
            value={values.receiverWalletAddress}
            onChange={setText('receiverWalletAddress')}
            placeholder="0x…"
            className="font-mono"
          />
        </div>
      </section>

      {/* Footer */}
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        {statusMsg && (
          <p
            className={`text-sm ${statusMsg.type === 'success' ? 'text-positive' : 'text-destructive'}`}
          >
            {statusMsg.text}
          </p>
        )}
        {lastReloadedAt && (
          <p className="text-xs text-muted-foreground">
            Last reloaded: {new Date(lastReloadedAt).toLocaleString()}
          </p>
        )}
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="self-start"
        >
          {mutation.isPending ? 'Saving…' : 'Save Settings'}
        </Button>
      </div>
    </form>
  )
}
