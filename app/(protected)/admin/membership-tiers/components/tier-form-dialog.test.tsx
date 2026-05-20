import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { server } from '~/__tests__/mocks/server'
import { http, HttpResponse } from 'msw'
import type { TierRow } from '@/types/membership-tiers-admin'
import { TierFormDialog } from './tier-form-dialog'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

const makeTier = (overrides: Partial<TierRow> = {}): TierRow => ({
  id: 'tier-1',
  name: 'Pro',
  description: 'Pro plan',
  priceInCents: 999,
  currency: 'usd',
  paymentType: 'subscription',
  recurringInterval: 'month',
  isActive: true,
  stripeProductId: null,
  stripePriceId: null,
  memberCount: 0,
  contentAccessPatterns: [],
  ...overrides,
})

const noop = () => {}

beforeEach(() => {
  vi.resetAllMocks()
  server.use(
    http.get('/api/v1/admin/content-catalog', () =>
      HttpResponse.json({
        courses: [{ id: '1', slug: 'intro-to-web3', title: 'Intro to Web3' }],
        pages: [{ id: '2', slug: 'about', title: 'About' }],
        pageIndexes: [],
      }),
    ),
  )
})

describe('TierFormDialog', () => {
  it('submits form in create mode and calls onSuccess', async () => {
    const onSuccess = vi.fn()
    server.use(
      http.post('/api/v1/admin/membership-tiers', () =>
        HttpResponse.json({ id: 'new-tier' }, { status: 201 }),
      ),
    )

    render(
      <TierFormDialog
        open={true}
        mode="create"
        onClose={noop}
        onSuccess={onSuccess}
      />,
    )

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'New Tier' },
    })
    fireEvent.change(
      screen.getByLabelText('Payment Type') as HTMLSelectElement,
      {
        target: { value: 'one_time' },
      },
    )
    fireEvent.change(screen.getByLabelText('Price (cents)'), {
      target: { value: '500' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Create Tier' }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('pre-fills form fields in edit mode', () => {
    const tier = makeTier()
    render(
      <TierFormDialog
        open={true}
        mode="edit"
        tier={tier}
        onClose={noop}
        onSuccess={noop}
      />,
    )

    expect(screen.getByLabelText('Name')).toHaveValue('Pro')
    expect(screen.getByLabelText('Description')).toHaveValue('Pro plan')
    expect(screen.getByLabelText('Price (cents)')).toHaveValue(999)
  })

  it('disables price input when paymentType is free', () => {
    render(
      <TierFormDialog
        open={true}
        mode="create"
        onClose={noop}
        onSuccess={noop}
      />,
    )

    // Default paymentType is 'free'
    expect(screen.getByLabelText('Price (cents)')).toBeDisabled()
  })

  it('shows error message when fetch returns 400', async () => {
    server.use(
      http.post('/api/v1/admin/membership-tiers', () =>
        HttpResponse.json({ message: 'Invalid input' }, { status: 400 }),
      ),
    )

    render(
      <TierFormDialog
        open={true}
        mode="create"
        onClose={noop}
        onSuccess={noop}
      />,
    )

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Bad Tier' },
    })
    fireEvent.change(
      screen.getByLabelText('Payment Type') as HTMLSelectElement,
      {
        target: { value: 'one_time' },
      },
    )

    fireEvent.click(screen.getByRole('button', { name: 'Create Tier' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid input')).toBeInTheDocument()
    })
  })
})

describe('TierFormDialog — Content Access section', () => {
  beforeEach(() => {
    // Ensure the catalog includes pageIndexes for these tests
    server.use(
      http.get('/api/v1/admin/content-catalog', () =>
        HttpResponse.json({
          courses: [{ id: '1', slug: 'intro-to-web3', title: 'Intro to Web3' }],
          pages: [{ id: '2', slug: 'about', title: 'About' }],
          pageIndexes: [],
        }),
      ),
    )
  })

  it('renders the Content Access section when open', () => {
    render(
      <TierFormDialog
        open={true}
        mode="create"
        onClose={noop}
        onSuccess={noop}
      />,
    )
    expect(screen.getByText('Content Access')).toBeInTheDocument()
  })

  it('shows "No patterns" placeholder message by default', () => {
    render(
      <TierFormDialog
        open={true}
        mode="create"
        onClose={noop}
        onSuccess={noop}
      />,
    )
    expect(
      screen.getByText(/no patterns — all membership content is accessible/i),
    ).toBeInTheDocument()
  })

  it('adds all-courses pattern by checking All courses checkbox', async () => {
    render(
      <TierFormDialog
        open={true}
        mode="create"
        onClose={noop}
        onSuccess={noop}
      />,
    )

    await waitFor(() => {
      expect(
        screen.getByRole('checkbox', { name: 'All courses' }),
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('checkbox', { name: 'All courses' }))

    await waitFor(() => {
      expect(screen.getByText('1 active pattern')).toBeInTheDocument()
    })
  })

  it('includes contentAccessPatterns in the submitted body', async () => {
    const onSuccess = vi.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let capturedBody: any = null
    server.use(
      http.post('/api/v1/admin/membership-tiers', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ id: 'new-tier' }, { status: 201 })
      }),
    )

    render(
      <TierFormDialog
        open={true}
        mode="create"
        onClose={noop}
        onSuccess={onSuccess}
      />,
    )

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Pro Plan' },
    })

    // Wait for catalog to load, then check all courses
    await waitFor(() =>
      expect(
        screen.getByRole('checkbox', { name: 'All courses' }),
      ).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByRole('checkbox', { name: 'All courses' }))

    fireEvent.click(screen.getByRole('button', { name: 'Create Tier' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(capturedBody).toMatchObject({
      contentAccessPatterns: ['/courses/**'],
    })
  })

  it('shows description nudge when patterns change and description is set', async () => {
    render(
      <TierFormDialog
        open={true}
        mode="create"
        onClose={noop}
        onSuccess={noop}
      />,
    )

    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Some description' },
    })

    await waitFor(() =>
      expect(
        screen.getByRole('checkbox', { name: 'All courses' }),
      ).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByRole('checkbox', { name: 'All courses' }))

    await waitFor(() => {
      expect(screen.getByText(/access rules updated/i)).toBeInTheDocument()
    })
  })

  it('pre-fills patterns from existing tier in edit mode and shows count', async () => {
    const tier = makeTier({ contentAccessPatterns: ['/courses/**'] })
    render(
      <TierFormDialog
        open={true}
        mode="edit"
        tier={tier}
        onClose={noop}
        onSuccess={noop}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('1 active pattern')).toBeInTheDocument()
    })
  })

  it('shows the zero-patterns warning when no patterns are set', () => {
    render(
      <TierFormDialog
        open={true}
        mode="create"
        onClose={noop}
        onSuccess={noop}
      />,
    )
    expect(
      screen.getByText(
        /no patterns set — this tier will grant access to all gated content/i,
      ),
    ).toBeInTheDocument()
  })

  it('hides the zero-patterns warning once a pattern is added', async () => {
    render(
      <TierFormDialog
        open={true}
        mode="create"
        onClose={noop}
        onSuccess={noop}
      />,
    )

    expect(
      screen.getByText(
        /no patterns set — this tier will grant access to all gated content/i,
      ),
    ).toBeInTheDocument()

    await waitFor(() =>
      expect(
        screen.getByRole('checkbox', { name: 'All courses' }),
      ).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByRole('checkbox', { name: 'All courses' }))

    await waitFor(() => {
      expect(
        screen.queryByText(
          /no patterns set — this tier will grant access to all gated content/i,
        ),
      ).not.toBeInTheDocument()
    })
  })
})
