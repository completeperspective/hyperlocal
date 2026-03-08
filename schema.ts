import { list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'
import {
  checkbox,
  image,
  json,
  password,
  relationship,
  select,
  text,
} from '@keystone-6/core/fields'

export const lists = {
  // TODO: learn more about access control
  User: list({
    access: allowAll,
    fields: {
      name: text({ validation: { isRequired: true } }),
      email: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
      recoveryPhrase: password(),
      isAdmin: checkbox(),
    },
  }),
  Settings: list({
    access: allowAll,
    isSingleton: true,
    fields: {
      // Identity
      siteName: text({ label: 'Site Name' }),
      baseUrl: text({ label: 'Canonical Base URL' }),

      // SEO
      metaTitle: text({ label: 'Default Meta Title' }),
      metaDescription: text({ label: 'Default Meta Description' }),
      ogImage: image({ storage: 'images' }),
      robots: select({
        options: [
          { label: 'Public (index, follow)', value: 'index, follow' },
          { label: 'No Index', value: 'noindex, follow' },
          {
            label: 'Full Block',
            value: 'noindex, nofollow, noarchive, nosnippet',
          },
        ],
        defaultValue: 'noindex, nofollow, noarchive, nosnippet',
      }),

      // Access Control
      isPrivate: checkbox({ label: 'App is Private', defaultValue: true }),
      allowSignup: checkbox({
        label: 'Allow Public Signups',
        defaultValue: false,
      }),
      maintenanceMode: checkbox({
        label: 'Maintenance Mode',
        defaultValue: false,
      }),
      maintenanceMessage: text({ defaultValue: "We'll be back shortly." }),

      // Analytics
      gaTrackingId: text({ label: 'Google Analytics ID' }),

      // Social
      socialLinks: json({ label: 'Social Links' }),

      // Branding
      theme: relationship({ ref: 'Theme' }),
    },
    graphql: { plural: 'ManySettings' },
  }),
  Theme: list({
    access: allowAll,
    fields: {
      name: text(),
      // Theme Colors
      lightMode: json({
        defaultValue: {
          card: 'oklch(1 0 0)',
          info: 'oklch(0.70 0.15 240)',
          ring: 'oklch(0.708 0 0)',
          input: 'oklch(0.922 0 0)',
          meta1: 'oklch(0.646 0.222 41.116)',
          meta2: 'oklch(0.6 0.118 184.704)',
          meta3: 'oklch(0.398 0.07 227.392)',
          meta4: 'oklch(0.828 0.189 84.429)',
          meta5: 'oklch(0.769 0.188 70.08)',
          muted: 'oklch(0.97 0 0)',
          accent: 'oklch(0.7407 0.131 349.73)',
          border: 'oklch(0.922 0 0)',
          popover: 'oklch(1 0 0)',
          primary: 'oklch(0.6558 0.2557 359.13)',
          sidebar: 'oklch(0.985 0 0)',
          warning: 'oklch(75% 0.183 55.934)',
          positive: 'oklch(0.6868 0.1816 142.18)',
          secondary: 'oklch(0.4487 0.1742 358.82)',
          background: 'oklch(0.9665 0.0045 258.32)',
          foreground: 'oklch(0.2225 0.0019 286.24)',
          destructive: 'oklch(0.577 0.245 27.325)',
          sidebarRing: 'oklch(0.708 0 0)',
          sidebarAccent: 'oklch(0.97 0 0)',
          sidebarBorder: 'oklch(0.922 0 0)',
          cardForeground: 'oklch(0.2225 0.0019 286.24)',
          infoForeground: 'oklch(0.2225 0.0019 286.24)',
          sidebarPrimary: 'oklch(0.205 0 0)',
          mutedForeground: 'oklch(0.556 0 0)',
          accentForeground: 'oklch(0.2661 0.093 354.64)',
          popoverForeground: 'oklch(0.2225 0.0019 286.24)',
          primaryForeground: 'oklch(1 0 0)',
          sidebarForeground: 'oklch(0.2225 0.0019 286.24)',
          warningForeground: 'oklch(0.28 0.07 46)',
          positiveForeground: 'oklch(0.9665 0.0045 258.32)',
          secondaryForeground: 'oklch(1 0 0)',
          destructiveForeground: 'oklch(1 0 0)',
          sidebarAccentForeground: 'oklch(0.205 0 0)',
          sidebarPrimaryForeground: 'oklch(0.985 0 0)',
        },
        ui: {
          description: 'Light mode colors',
        },
      }),
      darkMode: json({
        defaultValue: {
          card: 'oklch(0.2545 0.0035 228.93)',
          info: 'oklch(0.70 0.15 240)',
          ring: 'oklch(0.556 0 0)',
          input: 'oklch(1 0 0 / 15%)',
          meta1: 'oklch(0.488 0.243 264.376)',
          meta2: 'oklch(0.696 0.17 162.48)',
          meta3: 'oklch(0.769 0.188 70.08)',
          meta4: 'oklch(0.627 0.265 303.9)',
          meta5: 'oklch(0.645 0.246 16.439)',
          muted: 'oklch(0.2545 0.0035 228.93)',
          accent: 'oklch(0.7407 0.131 349.73)',
          border: 'oklch(1 0 0 / 10%)',
          popover: 'oklch(0.2545 0.0035 228.93)',
          primary: 'oklch(0.5844 0.228 8.91)',
          sidebar: 'oklch(0.2545 0.0035 228.93)',
          warning: 'oklch(75% 0.183 55.934)',
          positive: 'oklch(0.6868 0.1816 142.18)',
          secondary: 'oklch(0.3589 0.082 11.05)',
          background: 'oklch(0.2225 0.0019 286.24)',
          foreground: 'oklch(0.9665 0.0045 258.32)',
          destructive: 'oklch(0.704 0.191 22.216)',
          sidebarRing: 'oklch(0.439 0 0)',
          sidebarAccent: 'oklch(0.269 0 0)',
          sidebarBorder: 'oklch(1 0 0 / 10%)',
          cardForeground: 'oklch(0.9665 0.0045 258.32)',
          infoForeground: 'oklch(0.9665 0.0045 258.32)',
          sidebarPrimary: 'oklch(0.488 0.243 264.376)',
          mutedForeground: 'oklch(0.556 0 0)',
          accentForeground: 'oklch(0.2661 0.093 354.64)',
          popoverForeground: 'oklch(0.9665 0.0045 258.32)',
          primaryForeground: 'oklch(1 0 0)',
          sidebarForeground: 'oklch(0.9665 0.0045 258.32)',
          warningForeground: 'oklch(0.99 0.02 95)',
          positiveForeground: 'oklch(0.9665 0.0045 258.32)',
          secondaryForeground: 'oklch(1 0 0)',
          destructiveForeground: 'oklch(0.9665 0.0045 258.32)',
          sidebarAccentForeground: 'oklch(0.985 0 0)',
          sidebarPrimaryForeground: 'oklch(0.985 0 0)',
        },
        ui: {
          description: 'Dark mode colors',
        },
      }),
      // UI Settings
      radius: text({
        defaultValue: '0.625rem',
      }),
      // Typograhy
      fontPrimary: text({
        defaultValue: "'Lobster', sans-serif",
      }),
      fontSecondary: text({
        defaultValue: "'Open Sans', sans-serif",
      }),
    },
  }),
}
