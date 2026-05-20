import React, { useRef, useState } from 'react'

type UploadData = {
  filename: string
  publicId: string
  publicUrl: string
  mimeType: string
  format: string
  bytes: number
}

// Value shape mirrors the Keystone json field controller so the form can
// serialize/deserialize the JSON correctly.
type FieldValue = { kind: 'create' | 'update'; value: string; initial?: string }

export const controller = (config: {
  path: string
  label: string
  description: string | null
  fieldMeta: unknown
}) => ({
  path: config.path,
  label: config.label,
  description: config.description ?? null,
  graphqlSelection: config.path,
  defaultValue: { kind: 'create' as const, value: '' },
  deserialize: (data: Record<string, unknown>): FieldValue => {
    const raw = data[config.path]
    const str = raw == null ? '' : JSON.stringify(raw)
    return { kind: 'update', value: str, initial: str }
  },
  serialize: (val: FieldValue) => ({
    [config.path]: val.value ? JSON.parse(val.value) : null,
  }),
  validate: () => true,
})

type ControllerType = ReturnType<typeof controller>

interface FieldProps {
  field: ControllerType
  value: FieldValue
  onChange?: (value: FieldValue) => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function Field({ value, onChange }: FieldProps) {
  const current: UploadData | null = value.value
    ? JSON.parse(value.value)
    : null
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const isReadOnly = !onChange

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !onChange) return

    setIsUploading(true)
    setError(null)

    try {
      // 1. Get a time-limited signed upload token from the Keystone server.
      //    This endpoint is on the same origin as the admin — no CORS needed.
      const signRes = await fetch('/api/sign-upload', { method: 'POST' })
      if (!signRes.ok) throw new Error('Could not get upload signature')
      const { signature, timestamp, api_key, cloud_name, folder, type } =
        await signRes.json()

      // 2. Upload the file directly to Cloudinary with the signed params.
      const formData = new FormData()
      formData.append('file', file)
      formData.append('signature', signature)
      formData.append('timestamp', String(timestamp))
      formData.append('api_key', api_key)
      if (folder) formData.append('folder', folder)
      // Reason: type: 'private' must be included in the POST body so Cloudinary
      // stores the asset as private, matching the signed params.
      if (type) formData.append('type', type)
      // resource_type is already expressed as /raw/ in the upload URL — omit from POST body

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/raw/upload`,
        { method: 'POST', body: formData },
      )
      if (!uploadRes.ok) throw new Error('Cloudinary upload failed')
      const uploaded = await uploadRes.json()

      // 3. Store the metadata as the field value; resolveInput will fan it out.
      const uploadData: UploadData = {
        filename: file.name,
        publicId: uploaded.public_id,
        publicUrl: uploaded.secure_url,
        mimeType: file.type || 'application/octet-stream',
        format: uploaded.format || file.name.split('.').pop() || '',
        bytes: uploaded.bytes,
      }
      onChange({ ...value, value: JSON.stringify(uploadData) })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {!isReadOnly && (
        <div>
          <input
            ref={fileRef}
            type="file"
            onChange={handleFileChange}
            disabled={isUploading}
            style={{ fontSize: '0.875rem', cursor: 'pointer' }}
          />
          {isUploading && (
            <p
              style={{
                fontSize: '0.8125rem',
                color: '#6b7280',
                margin: '6px 0 0',
              }}
            >
              Uploading to Cloudinary…
            </p>
          )}
          {error && (
            <p
              style={{
                fontSize: '0.8125rem',
                color: '#dc2626',
                margin: '6px 0 0',
              }}
            >
              {error}
            </p>
          )}
        </div>
      )}

      {current && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 6,
            padding: '12px 16px',
            fontSize: '0.8125rem',
          }}
        >
          <p style={{ fontWeight: 600, color: '#15803d', margin: '0 0 8px' }}>
            {isReadOnly ? 'File' : '✓ Uploaded'}
          </p>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <tbody>
              {(
                [
                  ['Filename', current.filename],
                  ['Type', current.mimeType],
                  ['Size', formatBytes(current.bytes)],
                  ['Format', current.format],
                  ['Public ID', current.publicId],
                ] as [string, string][]
              ).map(([label, val]) => (
                <tr key={label}>
                  <td
                    style={{
                      padding: '3px 16px 3px 0',
                      color: '#6b7280',
                      whiteSpace: 'nowrap',
                      verticalAlign: 'top',
                      width: 90,
                    }}
                  >
                    {label}
                  </td>
                  <td style={{ padding: '3px 0', wordBreak: 'break-all' }}>
                    {val}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => {
                onChange!({ ...value, value: '' })
                if (fileRef.current) fileRef.current.value = ''
              }}
              style={{
                marginTop: 10,
                fontSize: '0.75rem',
                color: '#dc2626',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Remove file
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function Cell({
  item,
  field,
}: {
  item: Record<string, unknown>
  field: ControllerType
}) {
  const raw = item[field.path]
  const data = raw as UploadData | null
  return <span>{data?.filename ?? '—'}</span>
}

export function CardValue({
  item,
  field,
}: {
  item: Record<string, unknown>
  field: ControllerType
}) {
  const raw = item[field.path]
  const data = raw as UploadData | null
  return <span>{data?.filename ?? '—'}</span>
}
