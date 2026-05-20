'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shuffle } from 'lucide-react'
import {
  autoContrast,
  CONTRAST_PAIRS,
  generateNameSuggestions,
  type HarmonyMode,
} from '@/utils/color-theory'
import type { ThemeGeneratorOptions } from '@/utils/theme-generator'
import { AppPreview } from './components/app-preview'
import { ForgeSlider } from './components/forge-slider'
import { ForgeTopBar } from './components/forge-top-bar'
import { HarmonyCards } from './components/harmony-cards'
import { HueRing } from './components/hue-ring'
import { PrimaryColorInput } from './components/primary-color-input'
import { TokenGrid } from './components/token-grid'
import { WcagXpBar } from './components/wcag-xp-bar'
import { useHistory } from './hooks/use-history'
import { useThemeGeneration } from './hooks/use-theme-generation'
import { useWcagScore } from './hooks/use-wcag-score'

interface ForgeState {
  primaryL: number
  primaryC: number
  primaryH: number
  harmonyMode: HarmonyMode
  satBias: number
  lightBias: number
}

export interface InitialTheme {
  id?: string
  name?: string
  lightMode?: Record<string, string>
  darkMode?: Record<string, string>
  colorScheme?: string | null
}

interface ThemeForgeProps {
  initialTheme?: InitialTheme | null
}

const forgeShellVars = {
  colorScheme: 'light dark',
  '--forge-bg': 'light-dark(oklch(0.88 0.003 265), oklch(0.13 0.006 265))',
  '--forge-panel': 'light-dark(oklch(0.96 0.004 265), oklch(0.17 0.008 265))',
  '--forge-panel-alt':
    'light-dark(oklch(0.93 0.005 265), oklch(0.20 0.008 265))',
  '--forge-border': 'light-dark(oklch(0.82 0.006 265), oklch(0.26 0.008 265))',
  '--forge-text': 'light-dark(oklch(0.22 0.008 265), oklch(0.88 0.004 265))',
  '--forge-text-muted':
    'light-dark(oklch(0.50 0.010 265), oklch(0.52 0.008 265))',
  '--forge-accent': 'light-dark(oklch(0.45 0.22 265), oklch(0.72 0.18 265))',
} as React.CSSProperties

function OnboardingCallout({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl border border-border"
        style={{ background: 'var(--forge-panel)' }}
      >
        <h2 className="text-lg font-bold mb-3 text-[--forge-text]">
          Welcome to Theme Forge ◆
        </h2>
        <p className="text-sm mb-2 text-[--forge-text-muted]">
          Drag the <strong className="text-[--forge-text]">hue ring</strong> to
          explore colors. Your brand tokens update in real time.
        </p>
        <p className="text-sm mb-2 text-[--forge-text-muted]">
          Hit <strong className="text-[--forge-accent]">Generate All</strong> to
          build the full 37-token palette.
        </p>
        <p className="text-sm mb-6 text-[--forge-text-muted]">
          Watch your <strong className="text-[--forge-text]">WCAG score</strong>{' '}
          rise as your palette becomes more accessible.
        </p>
        <button
          onClick={onDismiss}
          className="w-full h-10 rounded-lg font-semibold text-sm text-white hover:brightness-110 transition-all"
          style={{ background: 'light-dark(oklch(0.32 0 0), oklch(0.42 0 0))' }}
        >
          Got it, let&apos;s create!
        </button>
      </div>
    </div>
  )
}

export function ThemeForge({ initialTheme }: ThemeForgeProps) {
  const router = useRouter()

  // Parse the saved primary token to seed the slider controls.
  const savedPrimary = initialTheme?.lightMode?.primary
  const parsedPrimary = useMemo(() => {
    if (!savedPrimary) return null
    const match = savedPrimary.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
    if (!match) return null
    return {
      l: parseFloat(match[1]),
      c: parseFloat(match[2]),
      h: parseFloat(match[3]),
    }
  }, [savedPrimary])

  const [primaryL, setPrimaryL] = useState(parsedPrimary?.l ?? 0.65)
  const [primaryC, setPrimaryC] = useState(parsedPrimary?.c ?? 0.22)
  const [primaryH, setPrimaryH] = useState(parsedPrimary?.h ?? 270)
  const [harmonyMode, setHarmonyMode] = useState<HarmonyMode>(() => {
    const VALID: HarmonyMode[] = [
      'monochromatic',
      'analogous',
      'complementary',
      'split-complementary',
      'triadic',
      'tetradic',
    ]
    const stored = initialTheme?.colorScheme
    // Reason: colorScheme may be null or a pre-migration value; fall back to complementary
    return VALID.includes(stored as HarmonyMode)
      ? (stored as HarmonyMode)
      : 'complementary'
  })
  const [satBias, setSatBias] = useState(0)
  const [lightBias, setLightBias] = useState(0)
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light')
  const [themeName, setThemeName] = useState(initialTheme?.name ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showWcagWarning, setShowWcagWarning] = useState(false)
  const prevScoreRef = useRef<number>(0)

  const initialTokens = useMemo(
    () =>
      initialTheme?.lightMode && initialTheme?.darkMode
        ? {
            light: initialTheme.lightMode as Record<string, string>,
            dark: initialTheme.darkMode as Record<string, string>,
          }
        : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const opts: ThemeGeneratorOptions = useMemo(
    () => ({
      primaryL,
      primaryC,
      primaryH,
      harmonyMode,
      saturationBias: satBias,
      lightnessBias: lightBias,
    }),
    [primaryL, primaryC, primaryH, harmonyMode, satBias, lightBias],
  )

  const {
    lightTokens,
    darkTokens,
    pendingTokenKeys,
    pendingCount,
    isGenerating,
    generateAll,
    setToken,
  } = useThemeGeneration(opts, initialTokens)
  const activeTokens = previewMode === 'light' ? lightTokens : darkTokens
  const { score, level, pairResults } = useWcagScore(activeTokens)
  const failingCount = pairResults.filter((r) => r.level === 'FAIL').length
  const history = useHistory<ForgeState>({
    primaryL,
    primaryC,
    primaryH,
    harmonyMode,
    satBias,
    lightBias,
  })

  const nameSuggestions = useMemo(
    () => generateNameSuggestions(primaryH),
    [primaryH],
  )

  // First-load: show onboarding for new themes and auto-generate the palette.
  // For edit mode (initialTheme provided), tokens are already loaded — skip generate.
  useEffect(() => {
    if (!localStorage.getItem('themeForge_onboardingDismissed')) {
      setShowOnboarding(true)
    }
    if (!initialTokens) {
      generateAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function restoreState(state: ForgeState) {
    setPrimaryL(state.primaryL)
    setPrimaryC(state.primaryC)
    setPrimaryH(state.primaryH)
    setHarmonyMode(state.harmonyMode)
    setSatBias(state.satBias)
    setLightBias(state.lightBias)
  }

  // Undo / redo keyboard shortcut
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.key !== 'z') return
      e.preventDefault()
      if (e.shiftKey) {
        const next = history.redo()
        if (next) restoreState(next)
      } else {
        const prev = history.undo()
        if (prev) restoreState(prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [history])

  // Reason: rollDice delays generateAll by 650ms but generateAll closes over opts.
  // By the time the timeout fires React has re-rendered with new opts, so we must
  // call the *latest* generateAll via a ref rather than the stale closure.
  const generateAllRef = useRef(generateAll)
  useEffect(() => {
    generateAllRef.current = generateAll
  }, [generateAll])

  const rollDice = useCallback(() => {
    const randomHue = Math.floor(Math.random() * 360)
    const modes: HarmonyMode[] = [
      'complementary',
      'analogous',
      'triadic',
      'split-complementary',
    ]
    const randomMode = modes[Math.floor(Math.random() * modes.length)]
    setPrimaryH(randomHue)
    setHarmonyMode(randomMode)
    setTimeout(() => generateAllRef.current(), 650)
  }, [])

  function handleGenerateAll() {
    prevScoreRef.current = score
    generateAll()
    history.push({
      primaryL,
      primaryC,
      primaryH,
      harmonyMode,
      satBias,
      lightBias,
    })
  }

  function handleFixAccessibility() {
    const tokens = previewMode === 'light' ? lightTokens : darkTokens
    for (const { bg, level: pairLevel } of pairResults) {
      if (pairLevel !== 'FAIL') continue
      const fgKey = CONTRAST_PAIRS.find(([b]) => b === bg)?.[1]
      if (!fgKey) continue
      const bgValue = tokens[bg]
      if (!bgValue) continue
      setToken(previewMode, fgKey, autoContrast(bgValue))
    }
  }

  async function handleSave(force = false) {
    if (!themeName.trim()) {
      const nameInput = document.querySelector<HTMLInputElement>(
        'input[list="theme-name-suggestions"]',
      )
      nameInput?.focus()
      return
    }
    if (!force && score < 40) {
      setShowWcagWarning(true)
      return
    }
    setIsSaving(true)
    try {
      const body = {
        name: themeName.trim(),
        lightMode: lightTokens,
        darkMode: darkTokens,
        radius: '0.625rem',
        fontHeading: "'Lobster', sans-serif",
        fontBody: "'Open Sans', sans-serif",
        colorScheme: harmonyMode,
      }
      const url = initialTheme?.id
        ? `/api/v1/admin/themes/${initialTheme.id}`
        : '/api/v1/admin/themes'
      const method = initialTheme?.id ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      const theme = await res.json()
      router.push(`/admin/themes/${theme.id}/edit`)
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col overflow-hidden bg-[--forge-bg] text-[--forge-text]"
      style={{ ...forgeShellVars }}
    >
      <ForgeTopBar
        themeName={themeName}
        onThemeNameChange={setThemeName}
        mode={previewMode}
        onModeChange={setPreviewMode}
        onSave={() => handleSave(false)}
        onExport={() => {
          const data = {
            name: themeName.trim() || 'Untitled Theme',
            lightMode: lightTokens,
            darkMode: darkTokens,
            radius: '0.625rem',
            fontHeading: "'Lobster', sans-serif",
            fontBody: "'Open Sans', sans-serif",
          }
          navigator.clipboard.writeText(JSON.stringify(data, null, 2))
        }}
        onCancel={() => router.push('/admin/themes')}
        isSaving={isSaving}
        canSave={!!lightTokens.primary}
        nameSuggestions={nameSuggestions}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop layout */}
        <div className="hidden lg:contents">
          {/* Left panel */}
          <aside
            className="w-80 shrink-0 border-r border-border bg-[--forge-panel] flex flex-col overflow-y-auto p-4 gap-5"
            style={{ boxShadow: '4px 0 12px -4px oklch(0 0 0 / 0.08)' }}
          >
            <HueRing
              hue={primaryH}
              chroma={primaryC}
              lightness={primaryL}
              onChange={setPrimaryH}
            />
            <PrimaryColorInput
              primaryL={primaryL}
              primaryC={primaryC}
              primaryH={primaryH}
              onChange={(l, c, h) => {
                setPrimaryL(l)
                setPrimaryC(c)
                setPrimaryH(h)
              }}
            />
            <HarmonyCards
              selected={harmonyMode}
              primaryH={primaryH}
              primaryL={primaryL}
              primaryC={primaryC}
              onChange={setHarmonyMode}
            />
            <ForgeSlider
              label="Chroma"
              value={primaryC}
              min={0}
              max={0.37}
              step={0.01}
              onChange={setPrimaryC}
              gradientCss={`linear-gradient(to right, oklch(${primaryL} 0 ${primaryH}), oklch(${primaryL} 0.37 ${primaryH}))`}
              displayValue={primaryC.toFixed(2)}
            />
            <ForgeSlider
              label="Lightness"
              value={primaryL}
              min={0.1}
              max={0.95}
              step={0.01}
              onChange={setPrimaryL}
              gradientCss={`linear-gradient(to right, black, oklch(0.65 ${primaryC} ${primaryH}), white)`}
              displayValue={primaryL.toFixed(2)}
            />
            <ForgeSlider
              label="Saturation Bias"
              value={satBias}
              min={-0.5}
              max={0.5}
              step={0.05}
              onChange={setSatBias}
              displayValue={
                satBias > 0 ? `+${satBias.toFixed(2)}` : satBias.toFixed(2)
              }
            />
            <div className="mt-auto pt-4 border-t border-border">
              <button
                onClick={rollDice}
                className="w-full h-9 rounded-lg border border-border bg-[--forge-panel-alt] text-sm text-[--forge-text-muted] hover:text-[--forge-text] transition-all flex items-center justify-center gap-2 active:scale-[0.97]"
              >
                <Shuffle size={14} /> Roll Random
              </button>
            </div>
          </aside>

          {/* Center panel */}
          <main className="flex-1 min-w-0 overflow-hidden flex">
            <AppPreview tokens={activeTokens} mode={previewMode} />
          </main>

          {/* Right panel */}
          <aside
            className="w-[340px] shrink-0 border-l border-border bg-[--forge-panel] flex flex-col overflow-hidden"
            style={{ boxShadow: '-4px 0 12px -4px oklch(0 0 0 / 0.08)' }}
          >
            <WcagXpBar
              score={score}
              levelName={level}
              previousScore={prevScoreRef.current}
              primaryH={primaryH}
              primaryC={primaryC}
              failingCount={failingCount}
              onFix={handleFixAccessibility}
            />
            <TokenGrid
              tokens={activeTokens}
              pendingTokenKeys={pendingTokenKeys}
              mode={previewMode}
              pairResults={pairResults}
              isGenerating={isGenerating}
              generateAll={handleGenerateAll}
              pendingCount={pendingCount}
              onTokenChange={(key, val) => setToken(previewMode, key, val)}
            />
          </aside>
        </div>

        {/* Mobile fallback */}
        <div className="flex lg:hidden items-center justify-center flex-1 text-center px-8">
          <p className="text-sm text-[--forge-text-muted]">
            Theme Forge is designed for desktop use. Please open this on a
            larger screen.
          </p>
        </div>
      </div>

      {/* Onboarding */}
      {showOnboarding && (
        <OnboardingCallout
          onDismiss={() => {
            setShowOnboarding(false)
            localStorage.setItem('themeForge_onboardingDismissed', '1')
          }}
        />
      )}

      {/* WCAG warning dialog */}
      {showWcagWarning && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-border"
            style={{ background: 'var(--forge-panel)' }}
          >
            <h3 className="font-bold mb-2 text-[--forge-text]">
              Low Accessibility Score
            </h3>
            <p className="text-sm mb-4 text-[--forge-text-muted]">
              Your theme scores {score}/100 — below the recommended minimum of
              40. Some text may be hard to read.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowWcagWarning(false)}
                className="flex-1 h-9 rounded-lg text-sm border border-border text-[--forge-text] transition-colors"
                style={{ background: 'var(--forge-panel-alt)' }}
              >
                Keep editing
              </button>
              <button
                onClick={() => {
                  setShowWcagWarning(false)
                  handleSave(true)
                }}
                className="flex-1 h-9 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-110"
                style={{
                  background: 'light-dark(oklch(0.32 0 0), oklch(0.42 0 0))',
                }}
              >
                Save anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
