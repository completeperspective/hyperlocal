import { marked } from 'marked'

export function markdownToHtml(markdown: string): string {
  marked.use({
    renderer: {
      code({ text, lang }) {
        // Split info string: "typescript keystone.ts" → lang="typescript", label="keystone.ts"
        const parts = (lang ?? '').split(' ')
        const language = parts[0] ?? ''
        const label = parts.slice(1).join(' ').trim()
        const escaped = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
        const langAttr = language ? ` class="language-${language}"` : ''
        const labelHtml = label
          ? `<span class="code-label">${label}</span>\n`
          : ''
        return `${labelHtml}<pre><code${langAttr}>${escaped}</code></pre>\n`
      },
    },
  })

  let html = marked(markdown) as string

  // --- Post-processing transforms ---

  // 1. Callout blockquotes: > **Action|Note|Aside:** text
  //    marked renders these as <blockquote><p><strong>Keyword:</strong> ...</p></blockquote>
  html = html.replace(
    /<blockquote>\s*<p><strong>(Action|Note|Aside):<\/strong>([\s\S]*?)<\/p>\s*<\/blockquote>/g,
    (_, type: string, body: string) =>
      `<div class="callout callout-${type.toLowerCase()}"><strong>${type}:</strong>${body}</div>`,
  )

  // 2. Chapter meta: first paragraph starting with <strong>Branch:</strong>
  html = html.replace(
    /<p>(<strong>Branch:<\/strong>)/,
    '<p class="chapter-meta">$1',
  )

  // 3. Closing section: wrap last h2 and all following content
  // Reason: the last h2 is always the summary/wrap-up section by authoring convention
  const lastH2 = html.lastIndexOf('<h2>')
  if (lastH2 !== -1) {
    html =
      html.slice(0, lastH2) +
      '<section class="closing">' +
      html.slice(lastH2) +
      '</section>'
  }

  // 4. Rewrite "Chapter N:" headings to "Lesson N:"
  html = html.replace(/<h1>Chapter (\d+):/g, '<h1>Lesson $1:')

  // 5. Wrap everything in the chapter article element
  return `<article class="chapter">\n${html}\n</article>`
}
