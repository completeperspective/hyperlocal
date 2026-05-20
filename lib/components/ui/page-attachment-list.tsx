import { Paperclip } from 'lucide-react'
import type { Attachment } from '@/types'
import { DownloadButton } from './download-button'

interface PageAttachmentListProps {
  attachments: Attachment[]
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function PageAttachmentList({ attachments }: PageAttachmentListProps) {
  if (!attachments || attachments.length === 0) return null

  return (
    <section
      aria-label="Page attachments"
      className="my-10 border-border border-t pt-8"
    >
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <Paperclip className="size-4" aria-hidden="true" />
        Attachments
      </h2>
      <ul className="flex flex-col gap-3">
        {attachments.map((attachment) => {
          const label = attachment.title || attachment.filename
          const size = formatBytes(attachment.bytes)

          return (
            <li
              key={attachment.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{label}</span>
                {size && (
                  <span className="text-xs text-muted-foreground">{size}</span>
                )}
              </div>
              <DownloadButton
                id={attachment.id}
                filename={attachment.filename}
                label={label}
              />
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default PageAttachmentList
