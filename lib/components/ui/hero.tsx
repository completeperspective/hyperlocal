import * as React from 'react'
import Link from 'next/link'
import type { HeroConfig } from '@/types/course'
import { buildGlowStyle, gridStyle, highlightStyle } from '@/ui/hero-styles'

interface HeroProps {
  config: HeroConfig
}

// Reason: these gradient/glow effects cannot be expressed in Tailwind v4 alone
// without custom config — inline styles are the intended approach per plan.
const heroBg: React.CSSProperties = {
  background: 'var(--hero-surface)',
  color: 'var(--primary-foreground)',
}

const scrimStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  // Darker on the text side (left), lets the image breathe on the right
  background:
    'linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.60) 50%, rgba(0,0,0,0.15) 100%)',
  zIndex: 1,
  pointerEvents: 'none',
}

const ctaStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  background: 'var(--primary)',
  color: 'var(--primary-foreground)',
  textDecoration: 'none',
  padding: '0.9rem 2rem',
  borderRadius: 'var(--radius)',
  fontWeight: 700,
  fontSize: '0.95rem',
  letterSpacing: '0.01em',
  boxShadow:
    '0 0 0 1px color-mix(in oklch, var(--primary) 40%, transparent), 0 8px 32px color-mix(in oklch, var(--primary) 35%, transparent), 0 2px 8px rgba(0,0,0,0.3)',
  transition: 'transform 0.2s, box-shadow 0.2s',
}

function TitleWithHighlight({
  title,
  highlight,
}: {
  title: string
  highlight?: string
}) {
  if (!highlight || !title.includes(highlight)) {
    return <>{title}</>
  }

  const idx = title.indexOf(highlight)
  const before = title.slice(0, idx)
  const after = title.slice(idx + highlight.length)

  return (
    <>
      {before}
      <span style={highlightStyle}>{highlight}</span>
      {after}
    </>
  )
}

export function Hero({ config }: HeroProps) {
  const isFullscreen = config.fullscreen ?? false

  return (
    <>
      <style>{`.hero-cta:hover{transform:translateY(-2px);box-shadow:0 0 0 1px rgba(233,30,140,0.5),0 16px 40px rgba(233,30,140,0.45),0 4px 12px rgba(0,0,0,0.3)}`}</style>
      <section
        data-forced-theme="dark"
        className={
          isFullscreen
            ? 'relative overflow-hidden min-h-screen flex items-center py-16 sm:py-20'
            : 'relative overflow-hidden py-24 md:py-28 pb-12'
        }
        style={
          config.backgroundImage
            ? { color: 'var(--primary-foreground)' }
            : heroBg
        }
      >
        {/* Full-bleed background — <picture> loads only the matching source */}
        {config.backgroundImage && (
          <picture style={{ position: 'absolute', inset: 0, display: 'block' }}>
            {config.backgroundImageMobile && (
              <source
                media="(max-width: 639px)"
                srcSet={config.backgroundImageMobile}
              />
            )}
            <img
              src={config.backgroundImage}
              alt=""
              aria-hidden="true"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />
          </picture>
        )}
        {/* Dark directional scrim — only when background image is present */}
        {config.backgroundImage && (
          <div aria-hidden="true" style={scrimStyle} />
        )}
        {/* Palette-driven radial glow overlays */}
        <div aria-hidden="true" style={buildGlowStyle(config.palette)} />
        {/* Subtle grid overlay */}
        {!config.hideGrid && <div aria-hidden="true" style={gridStyle} />}

        <div
          className={
            isFullscreen
              ? 'relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 flex flex-col gap-12 md:flex-row md:items-center md:gap-16'
              : 'relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 flex flex-col gap-12 md:flex-row md:items-center md:gap-16'
          }
        >
          {/* Content column */}
          <div
            className={
              isFullscreen
                ? 'flex flex-1 flex-col gap-6 text-center sm:text-left'
                : 'flex flex-1 flex-col gap-6'
            }
          >
            {config.eyebrow && (
              <div
                className={
                  isFullscreen
                    ? 'inline-flex items-center gap-2 self-center sm:self-start rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/80'
                    : 'inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/80'
                }
              >
                <span
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                  aria-hidden="true"
                />
                {config.eyebrow}
              </div>
            )}

            <h2
              className={
                isFullscreen
                  ? 'text-pretty text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight text-white'
                  : 'text-pretty text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl'
              }
            >
              {config.title && (
                <TitleWithHighlight
                  title={config.title}
                  highlight={config.titleHighlight}
                />
              )}
            </h2>

            {config.description && (
              <p
                className={
                  isFullscreen
                    ? 'max-w-prose text-lg md:text-xl lg:text-2xl leading-relaxed text-white/70'
                    : 'max-w-prose text-base leading-relaxed text-white/70 md:text-lg'
                }
              >
                {config.description}
              </p>
            )}

            {(config.ctaLabel || config.secondaryLabel) && (
              <div
                className={
                  isFullscreen
                    ? 'flex flex-wrap items-center gap-4 justify-center flex-col sm:flex-row md:justify-start'
                    : 'flex flex-wrap items-center gap-4'
                }
              >
                {config.ctaLabel && (
                  <Link
                    href={config.ctaHref ?? '#'}
                    className="hero-cta focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                    style={ctaStyle}
                  >
                    {config.ctaLabel}
                    <span style={{ fontSize: '1.1em', lineHeight: 1 }}>→</span>
                  </Link>
                )}
                {config.secondaryLabel && (
                  <a
                    href={config.secondaryHref ?? '#'}
                    className="text-sm font-medium text-white/70 underline-offset-4 hover:text-white hover:underline"
                  >
                    {config.secondaryLabel}
                  </a>
                )}
              </div>
            )}

            {config.stats && config.stats.length > 0 && (
              <div
                className={
                  isFullscreen
                    ? 'mt-2 flex flex-wrap gap-8 border-t border-white/10 pt-6 justify-center md:justify-start'
                    : 'mt-2 flex flex-wrap gap-8 border-t border-white/10 pt-6'
                }
              >
                {config.stats.map((stat) => (
                  <div key={stat.label} className="flex flex-col gap-0.5">
                    <div className="text-2xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="text-xs font-medium uppercase tracking-widest text-white/50">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visual column — hidden on small screens */}
          {config.image && (
            <div
              className={
                isFullscreen
                  ? 'relative hidden sm:block shrink-0'
                  : 'relative hidden shrink-0 md:block'
              }
            >
              {/* Glow behind image */}
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 scale-110 rounded-2xl blur-2xl"
                style={{
                  background:
                    'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(233,30,140,0.25) 0%, transparent 70%)',
                }}
              />
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={config.image}
                  alt=""
                  className={
                    isFullscreen
                      ? 'h-auto w-72 sm:w-80 md:w-96 xl:w-[420px] object-cover'
                      : 'h-auto w-80 object-cover xl:w-96'
                  }
                />
                {config.imageBadgeTitle && (
                  <div className="absolute bottom-4 right-4 rounded-xl border border-white/10 px-4 py-3 text-sm text-white backdrop-blur-md bg-[--hero-surface-overlay]">
                    <strong className="block font-semibold">
                      {config.imageBadgeTitle}
                    </strong>
                    {config.imageBadgeSubtitle && (
                      <span className="text-white/60">
                        {config.imageBadgeSubtitle}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
      {/* Divider between hero and content below — not needed after fullscreen heroes */}
      {!isFullscreen && <div className="h-px w-full bg-border/20" />}
    </>
  )
}
