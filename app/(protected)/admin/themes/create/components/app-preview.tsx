'use client'

import { useEffect, useRef, useState } from 'react'

interface AppPreviewProps {
  tokens: Record<string, string>
  mode: 'light' | 'dark'
}

const SIDEBAR_ITEMS = [
  { label: 'Home', icon: '⌂' },
  { label: 'Courses', icon: '📚' },
  { label: 'Progress', icon: '📈' },
  { label: 'Community', icon: '💬' },
  { label: 'Settings', icon: '⚙' },
]

const META_BARS = [
  { label: 'JavaScript', pct: 93, token: '--meta-1' },
  { label: 'React', pct: 96, token: '--meta-2' },
  { label: 'TypeScript', pct: 92, token: '--meta-3' },
  { label: 'Node.js', pct: 94, token: '--meta-4' },
  { label: 'CSS / Design', pct: 88, token: '--meta-5' },
]

export function AppPreview({ tokens, mode }: AppPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)
  const [activeNav, setActiveNav] = useState('Home')
  const [hoveredNav, setHoveredNav] = useState<string | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width
      setScale((width - 64) / 1200)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const cssVars = {
    '--primary': tokens.primary,
    '--primary-foreground': tokens.primaryForeground,
    '--secondary': tokens.secondary,
    '--secondary-foreground': tokens.secondaryForeground,
    '--accent': tokens.accent,
    '--accent-foreground': tokens.accentForeground,
    '--background': tokens.background,
    '--foreground': tokens.foreground,
    '--card': tokens.card,
    '--card-foreground': tokens.cardForeground,
    '--popover': tokens.popover,
    '--popover-foreground': tokens.popoverForeground,
    '--muted': tokens.muted,
    '--muted-foreground': tokens.mutedForeground,
    '--border': tokens.border,
    '--input': tokens.input,
    '--ring': tokens.ring,
    '--sidebar': tokens.sidebar,
    '--sidebar-foreground': tokens.sidebarForeground,
    '--sidebar-primary': tokens.sidebarPrimary,
    '--sidebar-primary-foreground': tokens.sidebarPrimaryForeground,
    '--sidebar-accent': tokens.sidebarAccent,
    '--sidebar-accent-foreground': tokens.sidebarAccentForeground,
    '--sidebar-border': tokens.sidebarBorder,
    '--sidebar-ring': tokens.sidebarRing,
    '--destructive': tokens.destructive,
    '--destructive-foreground': tokens.destructiveForeground,
    '--positive': tokens.positive,
    '--positive-foreground': tokens.positiveForeground,
    '--info': tokens.info,
    '--info-foreground': tokens.infoForeground,
    '--warning': tokens.warning,
    '--warning-foreground': tokens.warningForeground,
    '--meta-1': tokens.meta1,
    '--meta-2': tokens.meta2,
    '--meta-3': tokens.meta3,
    '--meta-4': tokens.meta4,
    '--meta-5': tokens.meta5,
  } as React.CSSProperties

  function navItemStyle(label: string): React.CSSProperties {
    const isActive = label === activeNav
    const isHovered = label === hoveredNav && !isActive
    if (isActive) {
      return {
        background: 'var(--sidebar-primary)',
        color: 'var(--sidebar-primary-foreground)',
        fontWeight: 600,
        outline: `2px solid var(--sidebar-ring)`,
        outlineOffset: -2,
      }
    }
    if (isHovered) {
      return {
        background: 'var(--sidebar-accent)',
        color: 'var(--sidebar-accent-foreground)',
        fontWeight: 500,
      }
    }
    return { background: 'transparent', color: 'var(--sidebar-foreground)' }
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden flex items-start justify-center p-8 bg-[--forge-bg]"
      style={{
        backgroundImage:
          'radial-gradient(light-dark(oklch(0.70 0.006 265 / 0.40), transparent) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      <div
        style={{
          ...cssVars,
          width: 1200,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          transition: 'all 150ms ease-out',
          fontFamily: 'system-ui, sans-serif',
          boxShadow:
            '0 4px 32px oklch(0 0 0 / 0.22), 0 1px 4px oklch(0 0 0 / 0.12)',
        }}
        className="rounded-xl overflow-hidden shadow-2xl relative"
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div
          style={{
            background: 'var(--background)',
            borderBottom: '1px solid var(--border)',
            height: 56,
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: 28,
          }}
        >
          <span
            style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 18 }}
          >
            Brand
          </span>
          {['Courses', 'Dashboard', 'Community'].map((label) => (
            <span
              key={label}
              style={{ color: 'var(--foreground)', fontSize: 13 }}
            >
              {label}
            </span>
          ))}
          <div style={{ flex: 1 }} />
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--muted)',
              border: '2px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              color: 'var(--muted-foreground)',
            }}
          >
            A
          </div>
          <button
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              padding: '7px 18px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
            }}
          >
            Get Access
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', height: 620 }}>
          {/* Sidebar */}
          <div
            style={{
              width: 232,
              background: 'var(--sidebar)',
              borderRight: '1px solid var(--sidebar-border)',
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--sidebar-foreground)',
                opacity: 0.45,
                padding: '4px 12px 8px',
              }}
            >
              Navigation
            </p>
            {SIDEBAR_ITEMS.map(({ label, icon }) => (
              <div
                key={label}
                style={{
                  padding: '9px 12px',
                  borderRadius: 7,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'background 120ms, color 120ms',
                  ...navItemStyle(label),
                }}
                onMouseEnter={() => setHoveredNav(label)}
                onMouseLeave={() => setHoveredNav(null)}
                onClick={() => setActiveNav(label)}
              >
                <span style={{ fontSize: 15, lineHeight: 1 }}>{icon}</span>
                {label}
              </div>
            ))}

            <div
              style={{
                height: 1,
                background: 'var(--sidebar-border)',
                margin: '12px 4px',
              }}
            />

            {/* Sidebar primary CTA */}
            <button
              style={{
                background: 'var(--sidebar-primary)',
                color: 'var(--sidebar-primary-foreground)',
                border: 'none',
                borderRadius: 7,
                padding: '9px 12px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              ✦ Upgrade to Pro
            </button>

            <div style={{ flex: 1 }} />

            {/* User row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 7,
                background: 'var(--sidebar-accent)',
                color: 'var(--sidebar-accent-foreground)',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--sidebar-primary)',
                  color: 'var(--sidebar-primary-foreground)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                A
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>
                  Adam C.
                </p>
                <p style={{ fontSize: 10, opacity: 0.7, lineHeight: 1.2 }}>
                  Pro Member
                </p>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div
            style={{
              flex: 1,
              background: 'var(--background)',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              overflowY: 'hidden',
            }}
          >
            {/* Row 1 – Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
              }}
            >
              {/* Course card */}
              <div
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    color: 'var(--card-foreground)',
                    fontWeight: 700,
                    fontSize: 15,
                    marginBottom: 6,
                  }}
                >
                  Full-Stack with Next.js
                </div>
                <div
                  style={{
                    color: 'var(--muted-foreground)',
                    fontSize: 12,
                    marginBottom: 14,
                    lineHeight: 1.5,
                  }}
                >
                  Build and ship production-ready features with real tooling.
                </div>
                {/* Progress bar */}
                <div
                  style={{
                    height: 5,
                    background: 'var(--muted)',
                    borderRadius: 3,
                    marginBottom: 14,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: '62%',
                      height: '100%',
                      background: 'var(--primary)',
                      borderRadius: 3,
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  <button
                    style={{
                      background: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                      padding: '6px 14px',
                      borderRadius: 5,
                      fontSize: 12,
                      fontWeight: 600,
                      border: 'none',
                    }}
                  >
                    Continue
                  </button>
                  <span
                    style={{ color: 'var(--muted-foreground)', fontSize: 11 }}
                  >
                    62% complete
                  </span>
                </div>
              </div>

              {/* Status badges card */}
              <div
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    color: 'var(--card-foreground)',
                    fontWeight: 700,
                    fontSize: 15,
                    marginBottom: 12,
                  }}
                >
                  Status Indicators
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 7,
                    marginBottom: 14,
                  }}
                >
                  {[
                    {
                      token: 'positive',
                      fg: 'positive-foreground',
                      label: 'Completed',
                    },
                    {
                      token: 'info',
                      fg: 'info-foreground',
                      label: 'In Review',
                    },
                    {
                      token: 'warning',
                      fg: 'warning-foreground',
                      label: 'Pending',
                    },
                    {
                      token: 'destructive',
                      fg: 'destructive-foreground',
                      label: 'Overdue',
                    },
                  ].map(({ token, fg, label }) => (
                    <span
                      key={token}
                      style={{
                        background: `var(--${token})`,
                        color: `var(--${fg})`,
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                {/* Input + ring demo */}
                <div
                  style={{
                    border: '1px solid var(--input)',
                    borderRadius: 6,
                    padding: '7px 12px',
                    fontSize: 12,
                    color: 'var(--foreground)',
                    background: 'var(--background)',
                    outline: `2px solid var(--ring)`,
                    outlineOffset: 2,
                  }}
                >
                  Search courses…
                </div>
              </div>
            </div>

            {/* Row 2 – Buttons */}
            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              {[
                { bg: 'primary', fg: 'primary-foreground', label: 'Primary' },
                {
                  bg: 'secondary',
                  fg: 'secondary-foreground',
                  label: 'Secondary',
                },
                { bg: 'accent', fg: 'accent-foreground', label: 'Accent' },
              ].map(({ bg, fg, label }) => (
                <button
                  key={bg}
                  style={{
                    background: `var(--${bg})`,
                    color: `var(--${fg})`,
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    border: 'none',
                  }}
                >
                  {label}
                </button>
              ))}
              <button
                style={{
                  background: 'var(--muted)',
                  color: 'var(--muted-foreground)',
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                }}
              >
                Muted
              </button>
              <div style={{ flex: 1 }} />
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--muted-foreground)',
                  fontStyle: 'italic',
                }}
              >
                Component palette
              </span>
            </div>

            {/* Row 3 – Meta / Chart */}
            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: 20,
                flex: 1,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    color: 'var(--card-foreground)',
                    fontWeight: 700,
                    fontSize: 15,
                  }}
                >
                  Skill Progress
                </span>
                <span
                  style={{ color: 'var(--muted-foreground)', fontSize: 11 }}
                >
                  chart colors · meta 1–5
                </span>
              </div>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 11 }}
              >
                {META_BARS.map(({ label, pct, token }) => (
                  <div key={label}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 5,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--card-foreground)',
                          fontWeight: 500,
                        }}
                      >
                        {label}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--muted-foreground)',
                          fontWeight: 600,
                        }}
                      >
                        {pct}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 8,
                        background: 'var(--muted)',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: `var(${token})`,
                          borderRadius: 4,
                          transition: 'width 400ms ease-out',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mode badge */}
        <div className="absolute bottom-3 right-3 text-xs px-2 py-0.5 rounded-full bg-black/40 text-white/80 backdrop-blur-sm">
          {mode === 'light' ? 'Light Preview' : 'Dark Preview'}
        </div>
      </div>
    </div>
  )
}
