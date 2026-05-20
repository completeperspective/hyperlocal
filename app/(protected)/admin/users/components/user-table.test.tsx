import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UserRow } from '@/types/users-admin'
import { UserTable, UserTableSkeleton } from './user-table'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

// UserDetailDrawer fetches from the API — stub it to avoid network calls
vi.mock('./user-detail-drawer', () => ({
  UserDetailDrawer: () => null,
}))

const makeUser = (overrides: Partial<UserRow> = {}): UserRow => ({
  id: 'user-1',
  email: 'alice@example.com',
  isAdmin: false,
  walletAddress: null,
  profile: {
    nickname: 'Alice',
    location: null,
    imageUrl: null,
    description: null,
    isPublic: false,
    contactPreference: null,
  },
  membership: null,
  ...overrides,
})

const baseFilters = {
  q: '',
  status: '',
  tier: '',
  role: '',
  wallet: '',
  page: 1,
  pageSize: 25,
}

describe('UserTableSkeleton', () => {
  it('renders 8 skeleton rows', () => {
    const { container } = render(<UserTableSkeleton />)
    const rows = container.querySelectorAll('[data-slot="skeleton"]')
    // 8 rows × multiple skeletons per row
    expect(rows.length).toBeGreaterThanOrEqual(8)
  })
})

describe('UserTable', () => {
  it('renders user rows from props', () => {
    const users = [
      makeUser(),
      makeUser({ id: 'user-2', email: 'bob@example.com' }),
    ]
    render(
      <UserTable
        users={users}
        tiers={[]}
        totalCount={2}
        currentPage={1}
        totalPages={1}
        filters={baseFilters}
      />,
    )
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()
  })

  it('shows "No users found" when users list is empty', () => {
    render(
      <UserTable
        users={[]}
        tiers={[]}
        totalCount={0}
        currentPage={1}
        totalPages={1}
        filters={baseFilters}
      />,
    )
    expect(screen.getByText('No users found.')).toBeInTheDocument()
  })

  it('selects all rows when select-all checkbox is clicked', async () => {
    const user = userEvent.setup()
    const users = [
      makeUser(),
      makeUser({ id: 'user-2', email: 'bob@example.com' }),
    ]
    render(
      <UserTable
        users={users}
        tiers={[]}
        totalCount={2}
        currentPage={1}
        totalPages={1}
        filters={baseFilters}
      />,
    )
    const selectAll = screen.getByRole('checkbox', { name: 'Select all' })
    await user.click(selectAll)
    const rowCheckboxes = screen.getAllByRole('checkbox', {
      name: /Select alice|Select bob/i,
    })
    rowCheckboxes.forEach((cb) => expect(cb).toBeChecked())
  })

  it('disables Previous button on first page', () => {
    render(
      <UserTable
        users={[makeUser()]}
        tiers={[]}
        totalCount={1}
        currentPage={1}
        totalPages={1}
        filters={baseFilters}
      />,
    )
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
  })

  it('disables Next button on last page', () => {
    render(
      <UserTable
        users={[makeUser()]}
        tiers={[]}
        totalCount={1}
        currentPage={1}
        totalPages={1}
        filters={baseFilters}
      />,
    )
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('renders membership status badge when membership is present', () => {
    const users = [
      makeUser({
        membership: {
          id: 'm1',
          status: 'active',
          paymentMethod: 'stripe',
          activatedAt: null,
          expiresAt: null,
          stripeSubscriptionId: null,
          cryptoTxHash: null,
          tier: {
            id: 't1',
            name: 'Pro',
            priceInCents: 999,
            paymentType: 'stripe',
          },
        },
      }),
    ]
    render(
      <UserTable
        users={users}
        tiers={[]}
        totalCount={1}
        currentPage={1}
        totalPages={1}
        filters={baseFilters}
      />,
    )
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
  })
})
