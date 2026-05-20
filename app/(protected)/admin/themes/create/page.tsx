import type { Metadata } from 'next'
import { ThemeForge } from './theme-forge'

export const metadata: Metadata = { title: 'Theme Forge | Admin' }

export default function ThemeCreatePage() {
  return <ThemeForge />
}
