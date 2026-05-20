import { useEffect, useState } from 'react'
import { parse } from 'culori'
import { hexToOklch, oklchToHex, toLabel } from './theme-color-picker-utils'

// ─── Types ───────────────────────────────────────────────────────────────────

type FieldValue =
  | { kind: 'create'; value: string }
  | { kind: 'update'; value: string; initial: string }

interface FieldProps {
  field: { path: string; label: string }
  value: FieldValue
  onChange?: (value: FieldValue) => void
}

interface ColorTokenRowProps {
  tokenKey: string
  value: string
  onChange?: (newValue: string) => void
  isChanged?: boolean
}

type ColorMap = Record<string, string>

// ─── Token Groups ─────────────────────────────────────────────────────────────

const TOKEN_GROUPS: { label: string; tokens: string[] }[] = [
  {
    label: 'Core',
    tokens: ['background', 'foreground'],
  },
  {
    label: 'Cards & Popovers',
    tokens: ['card', 'cardForeground', 'popover', 'popoverForeground'],
  },
  {
    label: 'Brand',
    tokens: [
      'primary',
      'primaryForeground',
      'secondary',
      'secondaryForeground',
      'accent',
      'accentForeground',
    ],
  },
  {
    label: 'Status',
    tokens: [
      'info',
      'infoForeground',
      'warning',
      'warningForeground',
      'positive',
      'positiveForeground',
      'destructive',
      'destructiveForeground',
    ],
  },
  {
    label: 'UI Elements',
    tokens: ['muted', 'mutedForeground', 'border', 'input', 'ring'],
  },
  {
    label: 'Sidebar',
    tokens: [
      'sidebar',
      'sidebarForeground',
      'sidebarPrimary',
      'sidebarPrimaryForeground',
      'sidebarAccent',
      'sidebarAccentForeground',
      'sidebarBorder',
      'sidebarRing',
    ],
  },
  {
    label: 'Meta / Chart',
    tokens: ['meta1', 'meta2', 'meta3', 'meta4', 'meta5'],
  },
]

// ─── ColorTokenRow ────────────────────────────────────────────────────────────

function ColorTokenRow({
  tokenKey,
  value,
  onChange,
  isChanged,
}: ColorTokenRowProps) {
  const [localText, setLocalText] = useState(value)
  const [isInvalid, setIsInvalid] = useState(false)

  // Sync local text when the committed value changes externally (e.g., color picker update)
  useEffect(() => {
    setLocalText(value)
    setIsInvalid(false)
  }, [value])

  const hexValue = oklchToHex(value)
  // Reason: detect alpha by string since oklchToHex returns null for both alpha and invalid;
  // the '/' separator is unique to the CSS color / alpha syntax.
  const hasAlpha = value.includes('/') && hexValue === null
  const isReadOnly = !onChange

  function handleColorPickerChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange?.(hexToOklch(e.target.value))
  }

  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLocalText(e.target.value)
    setIsInvalid(false)
  }

  function handleTextBlur() {
    if (!onChange || !localText.trim()) return
    const parsed = parse(localText)
    if (!parsed) {
      setIsInvalid(true)
      return
    }
    onChange(localText.trim())
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '5px 0',
        paddingLeft: isChanged ? 5 : 8,
        minHeight: 32,
        borderLeft: isChanged ? '3px solid #f59e0b' : '3px solid transparent',
      }}
    >
      {/* Label */}
      <span
        style={{
          width: 180,
          flexShrink: 0,
          fontSize: '0.8125rem',
          color: '#374151',
          lineHeight: '1.4',
        }}
      >
        {toLabel(tokenKey)}
      </span>

      {/* Swatch + picker group */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
      >
        {/* Color swatch — checkerboard reveals alpha transparency naturally */}
        <div
          style={{ position: 'relative' }}
          title={
            hasAlpha ? 'Alpha channel — use text input to edit' : undefined
          }
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 3,
              border: '1px solid rgba(0,0,0,0.12)',
              flexShrink: 0,
              background: `${localText}, repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%) 0 0 / 8px 8px`,
            }}
          />
          {hasAlpha && (
            <span
              style={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                background: '#9ca3af',
                color: 'white',
                fontSize: '0.5rem',
                fontWeight: 700,
                padding: '1px 3px',
                borderRadius: 3,
                lineHeight: 1,
                pointerEvents: 'none',
              }}
            >
              A
            </span>
          )}
        </div>

        {/* Color picker — absent for read-only or alpha colors */}
        {isReadOnly ? null : hasAlpha ? (
          <div
            title="Alpha channel — edit the OKLCH value directly"
            style={{
              width: 24,
              height: 20,
              borderRadius: 3,
              border: '1px dashed #d1d5db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: 'default',
            }}
          >
            <span style={{ fontSize: 10, color: '#9ca3af', lineHeight: 1 }}>
              α
            </span>
          </div>
        ) : (
          <input
            type="color"
            className="ks-color-picker"
            value={hexValue ?? '#000000'}
            onChange={handleColorPickerChange}
          />
        )}
      </div>

      {/* Value display — editable text input or read-only code element */}
      <div style={{ flex: 1, marginLeft: 8 }}>
        {isReadOnly ? (
          <code
            style={{
              fontSize: '0.8125rem',
              fontFamily: 'monospace',
              color: '#6b7280',
              wordBreak: 'break-all',
              display: 'block',
            }}
          >
            {value}
          </code>
        ) : (
          <>
            <input
              type="text"
              value={localText}
              onChange={handleTextChange}
              onBlur={handleTextBlur}
              spellCheck={false}
              style={{
                width: '100%',
                fontSize: '0.8125rem',
                fontFamily: 'monospace',
                padding: '3px 8px',
                border: `1px solid ${isInvalid ? '#dc2626' : '#d1d5db'}`,
                borderRadius: 4,
                background: 'white',
                color: '#111827',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
            {isInvalid && (
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: '0.75rem',
                  color: '#dc2626',
                }}
              >
                Invalid color value
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Field ────────────────────────────────────────────────────────────────────

export function Field({ field, value, onChange }: FieldProps) {
  const currentMap: ColorMap = (() => {
    try {
      return value.value ? JSON.parse(value.value) : {}
    } catch {
      return {}
    }
  })()

  const initialMap: ColorMap = (() => {
    if (value.kind === 'update') {
      try {
        return value.initial ? JSON.parse(value.initial) : {}
      } catch {
        return {}
      }
    }
    return {}
  })()

  function handleChange(tokenKey: string, newColor: string) {
    if (!onChange) return
    const updated = { ...currentMap, [tokenKey]: newColor }
    onChange({ ...value, value: JSON.stringify(updated) })
  }

  const isLight = field.path === 'lightMode'

  const banner = {
    wrapper: {
      padding: '10px 14px',
      marginBottom: 8,
      borderRadius: 6,
      border: isLight ? '1px solid #fde68a' : '1px solid #334155',
      background: isLight ? '#fffbeb' : '#1e293b',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    } as React.CSSProperties,
    dot: {
      width: 10,
      height: 10,
      borderRadius: '50%',
      flexShrink: 0,
      background: isLight ? '#f59e0b' : '#6366f1',
    } as React.CSSProperties,
    title: {
      margin: 0,
      fontSize: '0.875rem',
      fontWeight: 700,
      color: isLight ? '#92400e' : '#e2e8f0',
    } as React.CSSProperties,
    subtitle: {
      margin: '2px 0 0',
      fontSize: '0.6875rem',
      color: isLight ? '#a16207' : '#94a3b8',
    } as React.CSSProperties,
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderBottom: '1px solid #f3f4f6',
      }}
    >
      {/* Normalize native color picker appearance across browsers */}
      <style>{`
        .ks-color-picker {
          -webkit-appearance: none;
          appearance: none;
          padding: 0;
          border: 1px solid #d1d5db;
          border-radius: 3px;
          cursor: pointer;
          width: 24px;
          height: 20px;
          background: none;
          flex-shrink: 0;
        }
        .ks-color-picker::-webkit-color-swatch-wrapper { padding: 0; }
        .ks-color-picker::-webkit-color-swatch { border: none; border-radius: 2px; }
        .ks-color-picker::-moz-color-swatch { border: none; border-radius: 2px; }
      `}</style>

      {/* Mode banner — visually distinguishes light vs dark at a glance */}
      <div style={banner.wrapper}>
        <div style={banner.dot} />
        <div>
          <p style={banner.title}>{isLight ? 'Light Mode' : 'Dark Mode'}</p>
          <p style={banner.subtitle}>
            {isLight
              ? 'Colors applied when the user prefers a light theme'
              : 'Colors applied when the user prefers a dark theme'}
          </p>
        </div>
      </div>

      {/* Column header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '3px 0 5px 8px',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: 4,
        }}
      >
        <span
          style={{
            width: 180,
            flexShrink: 0,
            fontSize: '0.625rem',
            color: '#9ca3af',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Token
        </span>
        <span
          style={{
            width: 56,
            flexShrink: 0,
            fontSize: '0.625rem',
            color: '#9ca3af',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Color
        </span>
        <span
          style={{
            flex: 1,
            marginLeft: 8,
            fontSize: '0.625rem',
            color: '#9ca3af',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          OKLCH Value
        </span>
      </div>

      {TOKEN_GROUPS.map((group, groupIndex) => (
        <div key={group.label}>
          <p
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: '#9ca3af',
              margin: 0,
              padding: groupIndex === 0 ? '0 0 5px 8px' : '14px 0 5px 8px',
              borderTop: groupIndex === 0 ? 'none' : '1px solid #e5e7eb',
            }}
          >
            {group.label}
          </p>
          {group.tokens.map((tokenKey) => (
            <ColorTokenRow
              key={tokenKey}
              tokenKey={tokenKey}
              value={currentMap[tokenKey] ?? ''}
              onChange={
                onChange
                  ? (newVal) => handleChange(tokenKey, newVal)
                  : undefined
              }
              isChanged={
                value.kind === 'update' &&
                currentMap[tokenKey] !== initialMap[tokenKey]
              }
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── List view exports ────────────────────────────────────────────────────────

export function Cell({
  item,
  field,
}: {
  item: Record<string, unknown>
  field: { path: string }
}) {
  const data = item[field.path]
  const count =
    data && typeof data === 'object' ? Object.keys(data as object).length : 0
  return (
    <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
      {count} tokens
    </span>
  )
}

export function CardValue({
  item,
  field,
}: {
  item: Record<string, unknown>
  field: { path: string }
}) {
  const data = item[field.path]
  const count =
    data && typeof data === 'object' ? Object.keys(data as object).length : 0
  return (
    <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
      {count} color tokens
    </span>
  )
}

// ─── Controller ───────────────────────────────────────────────────────────────

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
