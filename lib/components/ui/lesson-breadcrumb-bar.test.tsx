import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { BreadcrumbItem, PageActionConfig } from '@/types/course'
import { LessonBreadcrumbBar } from './lesson-breadcrumb-bar'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock('@/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuTrigger: ({
    children,
  }: {
    children: React.ReactNode
    asChild?: boolean
  }) => <div data-testid="dropdown-trigger">{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-content">{children}</div>
  ),
  DropdownMenuItem: ({
    children,
  }: {
    children: React.ReactNode
    asChild?: boolean
  }) => <div>{children}</div>,
}))

vi.mock('@/ui/download-button', () => ({
  DownloadButton: ({ label }: { label: string }) => (
    <button aria-label={`Download ${label}`}>Download</button>
  ),
}))

vi.mock('@/ui/mark-as-read-button', () => ({
  MarkAsReadButton: ({ compact }: { compact?: boolean }) =>
    compact ? (
      <button aria-label="Mark as Complete">✓</button>
    ) : (
      <button>Mark as Complete</button>
    ),
}))

vi.mock('@/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({
    children,
  }: {
    children: React.ReactNode
    asChild?: boolean
  }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="tooltip-content">{children}</span>
  ),
}))

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'My Course', href: '/courses/my-course' },
  { label: 'Chapter One' },
  { label: 'Lesson Title' },
]

describe('LessonBreadcrumbBar', () => {
  it('renders breadcrumb labels (root as home icon, last as text)', () => {
    render(<LessonBreadcrumbBar breadcrumbs={breadcrumbs} />)
    // Root crumb is a home icon link — label via aria-label, not visible text
    expect(screen.getByRole('link', { name: 'My Course' })).toBeInTheDocument()
    expect(screen.getByText('Lesson Title')).toBeInTheDocument()
    // Tooltip content exposes the course name
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent('My Course')
  })

  it('renders course root as a home-icon link', () => {
    render(<LessonBreadcrumbBar breadcrumbs={breadcrumbs} />)
    const link = screen.getByRole('link', { name: 'My Course' })
    expect(link).toHaveAttribute('href', '/courses/my-course')
  })

  it('renders mark-as-read compact button when authenticated and action configured', () => {
    const actions: PageActionConfig[] = [
      {
        type: 'mark-as-read',
        show: 'authenticated',
      },
    ]
    render(
      <LessonBreadcrumbBar
        breadcrumbs={breadcrumbs}
        actions={actions}
        isAuthenticated={true}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Mark as Complete' }),
    ).toBeInTheDocument()
  })

  it('hides mark-as-read when not authenticated', () => {
    const actions: PageActionConfig[] = [
      {
        type: 'mark-as-read',
        show: 'authenticated',
      },
    ]
    render(
      <LessonBreadcrumbBar
        breadcrumbs={breadcrumbs}
        actions={actions}
        isAuthenticated={false}
      />,
    )
    expect(
      screen.queryByRole('button', { name: 'Mark as Complete' }),
    ).not.toBeInTheDocument()
  })

  it('renders single DownloadButton for one attachment (public)', () => {
    const actions: PageActionConfig[] = [
      {
        type: 'download-attachments',
        attachments: [{ id: 'a1', filename: 'doc.pdf', label: 'Doc PDF' }],
        show: 'public',
      },
    ]
    render(
      <LessonBreadcrumbBar
        breadcrumbs={breadcrumbs}
        actions={actions}
        isAuthenticated={false}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Download Doc PDF' }),
    ).toBeInTheDocument()
  })

  it('renders dropdown trigger for multiple attachments', () => {
    const actions: PageActionConfig[] = [
      {
        type: 'download-attachments',
        attachments: [
          { id: 'a1', filename: 'doc1.pdf', label: 'Doc 1' },
          { id: 'a2', filename: 'doc2.pdf', label: 'Doc 2' },
        ],
        show: 'public',
      },
    ]
    render(
      <LessonBreadcrumbBar
        breadcrumbs={breadcrumbs}
        actions={actions}
        isAuthenticated={false}
      />,
    )
    expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument()
  })

  it('hides admin actions for non-admin users', () => {
    const actions: PageActionConfig[] = [
      {
        type: 'mark-as-read',
        show: 'admin',
      },
    ]
    render(
      <LessonBreadcrumbBar
        breadcrumbs={breadcrumbs}
        actions={actions}
        isAuthenticated={true}
        isAdmin={false}
      />,
    )
    expect(
      screen.queryByRole('button', { name: 'Mark as Complete' }),
    ).not.toBeInTheDocument()
  })

  it('shows admin action for admin users', () => {
    const actions: PageActionConfig[] = [
      {
        type: 'mark-as-read',
        show: 'admin',
      },
    ]
    render(
      <LessonBreadcrumbBar
        breadcrumbs={breadcrumbs}
        actions={actions}
        isAuthenticated={true}
        isAdmin={true}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Mark as Complete' }),
    ).toBeInTheDocument()
  })

  it('renders the bar without crash when actions array is empty', () => {
    render(<LessonBreadcrumbBar breadcrumbs={breadcrumbs} actions={[]} />)
    expect(
      screen.getByRole('navigation', { name: 'Breadcrumb' }),
    ).toBeInTheDocument()
  })

  it('renders the bar without crash when breadcrumbs array is empty', () => {
    render(<LessonBreadcrumbBar breadcrumbs={[]} />)
    expect(
      screen.getByRole('navigation', { name: 'Breadcrumb' }),
    ).toBeInTheDocument()
  })

  it('does not render download button for empty attachments list', () => {
    const actions: PageActionConfig[] = [
      {
        type: 'download-attachments',
        attachments: [],
        show: 'public',
      },
    ]
    render(
      <LessonBreadcrumbBar
        breadcrumbs={breadcrumbs}
        actions={actions}
        isAuthenticated={false}
      />,
    )
    expect(screen.queryByTestId('dropdown-trigger')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Download/ }),
    ).not.toBeInTheDocument()
  })
})
