import { keystoneContext } from '@/server/keystone/context'
import { ThemeForge, type InitialTheme } from '../../create/theme-forge'

export default async function ThemeEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const raw = await keystoneContext.sudo().db.Theme.findOne({ where: { id } })
  // Keystone db objects have non-plain prototypes; serialize before passing to client component
  const theme: InitialTheme | null = raw
    ? JSON.parse(JSON.stringify(raw))
    : null

  return <ThemeForge initialTheme={theme} />
}
