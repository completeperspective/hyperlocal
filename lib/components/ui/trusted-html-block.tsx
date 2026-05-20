'use client'

import { useEffect, useRef } from 'react'

const COPY_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>'
const CHECK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 15 4 10"/></svg>'

const BTN_STYLE =
  'position:absolute;top:8px;right:8px;width:28px;height:28px;' +
  'display:flex;align-items:center;justify-content:center;' +
  'background:transparent;border:1px solid transparent;cursor:pointer;' +
  'border-radius:6px;color:inherit;padding:0;'

export function TrustedHtmlBlock({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const wrappers: HTMLElement[] = []

    Array.from(container.querySelectorAll<HTMLPreElement>('pre')).forEach(
      (pre) => {
        const wrapper = document.createElement('div')
        wrapper.style.position = 'relative'
        pre.parentNode?.insertBefore(wrapper, pre)
        wrapper.appendChild(pre)
        wrappers.push(wrapper)

        const btn = document.createElement('button')
        btn.setAttribute('aria-label', 'Copy code')
        btn.setAttribute('type', 'button')
        btn.style.cssText = BTN_STYLE
        btn.innerHTML = COPY_SVG
        wrapper.appendChild(btn)

        btn.addEventListener('click', async () => {
          // Prefer <code> child text to avoid surrounding whitespace
          const text =
            pre.querySelector('code')?.textContent ?? pre.textContent ?? ''
          try {
            await navigator.clipboard.writeText(text)
            btn.innerHTML = CHECK_SVG
            setTimeout(() => {
              btn.innerHTML = COPY_SVG
            }, 2000)
          } catch {
            // Clipboard API unavailable or permission denied — fail silently
          }
        })
      },
    )

    // Cleanup so React Strict Mode double-invoke stays clean
    return () => {
      wrappers.forEach((wrapper) => {
        const pre = wrapper.querySelector('pre')
        if (pre) wrapper.parentNode?.insertBefore(pre, wrapper)
        wrapper.remove()
      })
    }
  }, [html])

  return <div ref={containerRef} dangerouslySetInnerHTML={{ __html: html }} />
}
