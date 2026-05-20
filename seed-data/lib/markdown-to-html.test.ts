import { describe, expect, it } from 'vitest'
import { markdownToHtml } from './markdown-to-html'

describe('markdownToHtml', () => {
  it('wraps output in article.chapter', () => {
    const html = markdownToHtml('# Hello')
    expect(html).toContain('<article class="chapter">')
    expect(html).toContain('</article>')
  })

  it('converts Action blockquote to callout-action div', () => {
    const html = markdownToHtml('> **Action:** Do the thing.')
    expect(html).toContain('<div class="callout callout-action">')
    expect(html).not.toContain('<blockquote>')
  })

  it('converts Note blockquote to callout-note div', () => {
    const html = markdownToHtml('> **Note:** Pay attention.')
    expect(html).toContain('class="callout callout-note"')
  })

  it('converts Aside blockquote to callout-aside div', () => {
    const html = markdownToHtml('> **Aside:** Background info.')
    expect(html).toContain('class="callout callout-aside"')
  })

  it('leaves non-callout blockquotes as <blockquote>', () => {
    const html = markdownToHtml('> **The principle:** Some text.')
    expect(html).toContain('<blockquote>')
    expect(html).not.toContain('class="callout')
  })

  it('adds code-label span when info string has a label', () => {
    const html = markdownToHtml('```typescript keystone.ts\nconst x = 1\n```')
    expect(html).toContain('<span class="code-label">keystone.ts</span>')
    expect(html).toContain('class="language-typescript"')
  })

  it('renders code block without label when no label in info string', () => {
    const html = markdownToHtml('```bash\npnpm dev\n```')
    expect(html).not.toContain('code-label')
    expect(html).toContain('class="language-bash"')
  })

  it('adds chapter-meta class to Branch paragraph', () => {
    const md = '# Chapter 01: Test\n\n**Branch:** `start` → `end`'
    const html = markdownToHtml(md)
    expect(html).toContain('class="chapter-meta"')
  })

  it('wraps last h2 in section.closing', () => {
    const md =
      '# Title\n\n## Section A\n\nContent\n\n## Wrapping Up\n\nFinal content'
    const html = markdownToHtml(md)
    expect(html).toContain('<section class="closing"><h2>Wrapping Up</h2>')
    expect(html).not.toContain('<section class="closing"><h2>Section A</h2>')
  })

  it('rewrites Chapter N: to Lesson N: in h1', () => {
    const html = markdownToHtml('# Chapter 03: Auth')
    expect(html).toContain('<h1>Lesson 03: Auth</h1>')
    expect(html).not.toContain('Chapter 03')
  })
})
