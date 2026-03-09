import * as React from 'react'
import {
  DocumentRenderer,
  DocumentRendererProps,
} from '@keystone-6/document-renderer'
import type { PageData } from '@/types'

//import { AppSettings } from '@/server/helpers/AppSettings'

export async function DynamicPage({ pageData }: { pageData: PageData }) {
  //const appSettings = await AppSettings.instance.settings()
  const renderers: DocumentRendererProps['renderers'] = {
    // Render heading blocks
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
    },
  }

  return (
    <>
      {pageData?.trustedHtml ? (
        <main dangerouslySetInnerHTML={{ __html: pageData.trustedHtml }} />
      ) : (
        <>
          {pageData?.content?.document && (
            <DocumentRenderer
              document={pageData.content.document}
              renderers={renderers}
            />
          )}
        </>
      )}
    </>
  )
}
