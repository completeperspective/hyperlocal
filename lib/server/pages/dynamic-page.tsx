import * as React from 'react'
import {
  DocumentRenderer,
  DocumentRendererProps,
} from '@keystone-6/document-renderer'
import { PageAttachmentList } from '@/components/ui/page-attachment-list'
import type { PageData } from '@/types'
import { CopyableCodeBlock } from '@/ui/copyable-code-block'
import { ProseContent } from '@/ui/prose-content'
import { TrustedHtmlBlock } from '@/ui/trusted-html-block'

export async function DynamicPage({ pageData }: { pageData: PageData }) {
  const renderers: DocumentRendererProps['renderers'] = {
    block: {
      heading({ level, children, textAlign }) {
        const Comp = `h${level}` as const
        return (
          <Comp style={{ textAlign }} className="text-pretty">
            {children}
          </Comp>
        )
      },
      blockquote(props) {
        return <blockquote className="text-accent mb-4" {...props} />
      },
      paragraph(props) {
        return <p {...props} />
      },
      code({ children }) {
        return <CopyableCodeBlock>{children}</CopyableCodeBlock>
      },
    },
  }

  return (
    <>
      <ProseContent>
        {pageData?.trustedHtml ? (
          <>
            {pageData?.customCss && (
              <style dangerouslySetInnerHTML={{ __html: pageData.customCss }} />
            )}
            <TrustedHtmlBlock html={pageData.trustedHtml} />
          </>
        ) : (
          <>
            {pageData?.content?.document && (
              <DocumentRenderer
                document={
                  pageData.content.document as DocumentRendererProps['document']
                }
                renderers={renderers}
              />
            )}
          </>
        )}
      </ProseContent>
      {pageData?.attachments && pageData.attachments.length > 0 && (
        <PageAttachmentList attachments={pageData.attachments} />
      )}
    </>
  )
}
