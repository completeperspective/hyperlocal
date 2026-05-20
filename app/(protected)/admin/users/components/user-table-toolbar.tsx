'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SearchIcon, XIcon } from 'lucide-react'
import type { UserFilters, UserRow } from '@/types/users-admin'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { displayEmail } from '@/utils/profile'

interface UserTableToolbarProps {
  tiers: { id: string; name: string }[]
  filters: UserFilters
  selectedCount: number
  selectedUsers: UserRow[]
  onClearSelection: () => void
}

function buildUrl(current: string, updates: Record<string, string>): string {
  const params = new URLSearchParams(current.split('?')[1] ?? '')
  for (const [k, v] of Object.entries(updates)) {
    if (v) {
      params.set(k, v)
    } else {
      params.delete(k)
    }
  }
  return `/admin/community?${params.toString()}`
}

export function UserTableToolbar({
  tiers,
  filters,
  selectedCount,
  selectedUsers,
  onClearSelection,
}: UserTableToolbarProps) {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState(filters.q)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setSearchValue(filters.q)
  }, [filters.q])

  function handleSearch(value: string) {
    setSearchValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl(window.location.href, { q: value, page: '1' }))
    }, 300)
  }

  function handleFilter(key: string, value: string) {
    router.push(buildUrl(window.location.href, { [key]: value, page: '1' }))
  }

  const hasActiveFilters =
    filters.q ||
    filters.status ||
    filters.tier ||
    filters.role ||
    filters.wallet

  function exportCsv() {
    const headers = [
      'ID',
      'Email',
      'Admin',
      'Wallet',
      'Tier',
      'Membership Status',
    ]
    const rows = selectedUsers.map((u) => [
      u.id,
      displayEmail(u.email) ?? '',
      u.isAdmin ? 'yes' : 'no',
      u.walletAddress ?? '',
      u.membership?.tier?.name ?? '',
      u.membership?.status ?? '',
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users-export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="px-4 pb-3 pt-4 space-y-3">
      {/* Search + filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-36">
          <label className="sr-only" htmlFor="user-search">
            Search users
          </label>
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            id="user-search"
            placeholder="Search by email or name…"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        <div className="hidden sm:contents">
          <select
            value={filters.status}
            onChange={(e) => handleFilter('status', e.target.value)}
            className="h-8 text-sm rounded-md border border-border bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
            <option value="failed">Failed</option>
            <option value="blocked">Blocked</option>
          </select>

          <select
            value={filters.tier}
            onChange={(e) => handleFilter('tier', e.target.value)}
            className="h-8 text-sm rounded-md border border-border bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Filter by tier"
          >
            <option value="">All tiers</option>
            {tiers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            value={filters.role}
            onChange={(e) => handleFilter('role', e.target.value)}
            className="h-8 text-sm rounded-md border border-border bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Filter by role"
          >
            <option value="">All roles</option>
            <option value="admin">Admins only</option>
            <option value="member">Members only</option>
          </select>

          <select
            value={filters.wallet}
            onChange={(e) => handleFilter('wallet', e.target.value)}
            className="h-8 text-sm rounded-md border border-border bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Filter by wallet"
          >
            <option value="">All</option>
            <option value="yes">Wallet connected</option>
            <option value="no">No wallet</option>
          </select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/community')}
              className="gap-1 text-muted-foreground"
            >
              <XIcon className="size-3" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      <div
        className={`flex items-center gap-3 overflow-hidden transition-all duration-150 ${
          selectedCount > 0 ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <span className="text-sm text-muted-foreground">
          {selectedCount} selected
        </span>
        <Button size="sm" variant="outline" onClick={exportCsv}>
          Export CSV
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
          className="text-muted-foreground"
        >
          Clear
        </Button>
      </div>
    </div>
  )
}
