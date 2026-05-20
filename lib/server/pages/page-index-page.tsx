import * as React from 'react'
import {
  DocumentRenderer,
  DocumentRendererProps,
} from '@keystone-6/document-renderer'
import { Lock } from 'lucide-react'
import { buildHeroConfig } from '@/types/course'
import type { PageIndexData } from '@/types/page-index'
import { CopyableCodeBlock } from '@/ui/copyable-code-block'
import { Hero } from '@/ui/hero'
import { ProseContent } from '@/ui/prose-content'
import { TrustedHtmlBlock } from '@/ui/trusted-html-block'

// Keystone always persists an empty document as [{type:'paragraph',children:[{text:''}]}].
// Rendering it produces a bare <p></p> that adds unwanted height below the hero.
function hasDocumentContent(doc: unknown): boolean {
  if (!Array.isArray(doc) || doc.length === 0) return false
  if (doc.length === 1) {
    const node = doc[0] as { type?: string; children?: { text?: string }[] }
    if (
      node.type === 'paragraph' &&
      node.children?.every((c) => !c.text?.trim())
    )
      return false
  }
  return true
}

interface PageIndexPageRendererProps {
  indexData: PageIndexData
  isAuthenticated: boolean
  hasActiveMembership: boolean
}

/**
 * Converts a plural label to its singular form using simple suffix rules.
 * Handles common English plurals: -ies → -y, trailing -s (except -ss).
 */
function toSingular(label: string): string {
  const l = (label || 'Groups').trim()
  if (l.toLowerCase().endsWith('ies')) return l.slice(0, -3) + 'y'
  if (l.toLowerCase().endsWith('s') && !l.toLowerCase().endsWith('ss'))
    return l.slice(0, -1)
  return l
}

export function PageIndexPageRenderer({
  indexData,
  isAuthenticated,
  hasActiveMembership,
}: PageIndexPageRendererProps) {
  const basePath = indexData.basePath
  const indexSlug = indexData.slug
  const baseUrl = basePath ? `/${basePath}/${indexSlug}` : `/${indexSlug}`

  const allPages =
    indexData.groups.reduce((acc, g) => acc + g.pages.length, 0) +
    indexData.pages.length

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

  // Resolve the effective plural and singular labels from the index data.
  const pluralLabel = indexData.groupsLabel ?? 'Groups'
  const singularLabel = toSingular(pluralLabel)

  // Reason: hero is now a relationship; build config from the linked Hero record
  const heroConfig = indexData.hero ? buildHeroConfig(indexData.hero) : null

  return (
    <>
      {heroConfig && <Hero config={heroConfig} />}

      {/* Reason: max-w-5xl is intentionally wider than individual pages (max-w-4xl)
          because an index/directory page benefits from more horizontal space for
          the table-of-contents layout. Only render when there is content to show
          so an empty div doesn't add visible padding below a fullscreen hero. */}
      {(allPages > 0 ||
        indexData.trustedHtml ||
        hasDocumentContent(indexData.content?.document)) && (
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          {/* Table of contents — groups then ungrouped pages */}
          {allPages > 0 && (
            <article id="pages">
              <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-4xl">
                {indexData.title}
              </h1>
              {allPages > 0 && (
                <p className="mb-10 text-sm text-muted-foreground">
                  Table of Contents &bull; {allPages} Page
                  {allPages !== 1 ? 's' : ''}
                  {indexData.groups.length > 0 &&
                    ` • ${indexData.groups.length} ${indexData.groups.length !== 1 ? pluralLabel : singularLabel}`}
                </p>
              )}

              {/* Groups */}
              {indexData.groups.map((group, i) => (
                <section key={group.id} className="mb-10">
                  <h2 className="mb-4 flex flex-wrap items-center gap-3 text-xl font-semibold text-foreground">
                    <span
                      className="rounded px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-foreground"
                      style={{ background: `var(--color-meta-${(i % 5) + 1})` }}
                    >
                      {singularLabel} {i + 1}
                    </span>
                    {group.title}
                  </h2>

                  {group.pages.length > 0 && (
                    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="w-12 pb-2 text-left font-medium text-muted-foreground">
                              #
                            </th>
                            <th className="pb-2 text-left font-medium text-muted-foreground">
                              Page
                            </th>
                            <th className="w-8 pb-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {group.pages.map((page, j) => {
                            const isLocked =
                              page.status !== 'published' &&
                              !hasActiveMembership
                            return (
                              <tr
                                key={page.id}
                                className="border-b border-border/50 transition-colors hover:bg-muted/40"
                              >
                                <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                                  {String(j + 1).padStart(2, '0')}
                                </td>
                                <td className="py-3">
                                  <a
                                    href={`${baseUrl}/${page.slug}`}
                                    className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                                  >
                                    {page.title}
                                  </a>
                                </td>
                                <td className="py-3 text-right">
                                  {isLocked && (
                                    <Lock
                                      aria-label="Locked"
                                      className="inline-block size-4 text-warning"
                                    />
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ))}

              {/* Ungrouped pages */}
              {indexData.pages.length > 0 && (
                <section className="mb-10">
                  {indexData.groups.length > 0 && (
                    <h2 className="mb-4 text-xl font-semibold text-foreground">
                      Additional Pages
                    </h2>
                  )}
                  <ul className="space-y-2">
                    {indexData.pages.map((page) => {
                      const isLocked =
                        !isAuthenticated && page.status !== 'published'
                      return (
                        <li key={page.id} className="flex items-center gap-2">
                          <a
                            href={`${baseUrl}/${page.slug}`}
                            className="text-sm font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                          >
                            {page.title}
                          </a>
                          {isLocked && (
                            <Lock
                              aria-label="Locked"
                              className="size-4 shrink-0 text-warning"
                            />
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )}
            </article>
          )}

          {/* Content — rendered after TOC */}
          {indexData.trustedHtml ? (
            <ProseContent>
              {indexData.customCss && (
                <style
                  dangerouslySetInnerHTML={{ __html: indexData.customCss }}
                />
              )}
              <TrustedHtmlBlock html={indexData.trustedHtml} />
            </ProseContent>
          ) : (
            hasDocumentContent(indexData.content?.document) && (
              <ProseContent>
                <DocumentRenderer
                  document={
                    indexData.content!
                      .document as DocumentRendererProps['document']
                  }
                  renderers={renderers}
                />
              </ProseContent>
            )
          )}
        </div>
      )}
    </>
  )
}
