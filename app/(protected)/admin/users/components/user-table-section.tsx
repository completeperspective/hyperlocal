'use client'

import { useState } from 'react'
import type { UserFilters, UserRow } from '@/types/users-admin'
import { UserTable, UserTableSkeleton } from './user-table'
import { UserTableToolbar } from './user-table-toolbar'

interface UserTableSectionProps {
  users: UserRow[]
  tiers: { id: string; name: string }[]
  totalCount: number
  currentPage: number
  totalPages: number
  filters: UserFilters
}

export function UserTableSection({
  users,
  tiers,
  totalCount,
  currentPage,
  totalPages,
  filters,
}: UserTableSectionProps) {
  const [selectedUsers, setSelectedUsers] = useState<UserRow[]>([])

  return (
    <>
      <UserTableToolbar
        tiers={tiers}
        filters={filters}
        selectedCount={selectedUsers.length}
        selectedUsers={selectedUsers}
        onClearSelection={() => setSelectedUsers([])}
      />
      <UserTable
        users={users}
        tiers={tiers}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        filters={filters}
        onSelectionChange={setSelectedUsers}
      />
    </>
  )
}

export { UserTableSkeleton }
