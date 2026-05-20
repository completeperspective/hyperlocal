import * as React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfileImageUpload } from './profile-image-upload'

const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

// jsdom doesn't implement createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:preview-url')

function makeFile(name = 'avatar.jpg', type = 'image/jpeg') {
  return new File(['data'], name, { type })
}

describe('ProfileImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('renders the default avatar when no currentImageUrl is provided', () => {
    render(<ProfileImageUpload />)
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      '/images/hero-bg-mobile.png',
    )
  })

  it('renders the currentImageUrl when provided', () => {
    render(
      <ProfileImageUpload currentImageUrl="https://cdn.example.com/avatar.jpg" />,
    )
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://cdn.example.com/avatar.jpg',
    )
  })

  it('shows blob preview immediately after a file is selected', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, url: 'https://cdn/new.jpg' }),
    } as Response)

    render(<ProfileImageUpload />)
    fireEvent.change(screen.getByTestId('profile-image-input'), {
      target: { files: [makeFile()] },
    })

    expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:preview-url')
  })

  it('calls router.refresh after a successful upload', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response)

    render(<ProfileImageUpload />)
    fireEvent.change(screen.getByTestId('profile-image-input'), {
      target: { files: [makeFile('photo.png', 'image/png')] },
    })

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledOnce())
  })

  it('shows the server error message when the upload is rejected', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'File too large. Maximum size is 5 MB' }),
    } as Response)

    render(<ProfileImageUpload />)
    fireEvent.change(screen.getByTestId('profile-image-input'), {
      target: { files: [makeFile()] },
    })

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'File too large. Maximum size is 5 MB',
      ),
    )
  })

  it('shows a generic error when fetch throws', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))

    render(<ProfileImageUpload />)
    fireEvent.change(screen.getByTestId('profile-image-input'), {
      target: { files: [makeFile()] },
    })

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Something went wrong',
      ),
    )
  })

  it('reverts to the original image after a failed upload', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Upload failed' }),
    } as Response)

    render(
      <ProfileImageUpload currentImageUrl="https://cdn.example.com/original.jpg" />,
    )
    fireEvent.change(screen.getByTestId('profile-image-input'), {
      target: { files: [makeFile()] },
    })

    await waitFor(() => screen.getByRole('alert'))
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://cdn.example.com/original.jpg',
    )
  })
})
