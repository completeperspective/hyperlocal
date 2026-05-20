import { cloudinaryImage } from '@keystone-6/cloudinary'
import { list } from '@keystone-6/core'
import { allowAll } from '@keystone-6/core/access'
import {
  checkbox,
  integer,
  json,
  password,
  relationship,
  select,
  text,
  timestamp,
} from '@keystone-6/core/fields'
import { document } from '@keystone-6/fields-document'
import { cloudinaryConfig } from './cloudinary'
import type { Context } from '.keystone/types'

export const lists = {
  User: list({
    access: allowAll,
    fields: {
      name: text({ validation: { isRequired: true } }),
      email: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
      recoveryPhrase: password(),
      isAdmin: checkbox(),
      profile: relationship({
        ref: 'Profile.owner',
        ui: {
          displayMode: 'cards',
          cardFields: ['nickname', 'description', 'location'],
          inlineConnect: true,
          inlineCreate: { fields: ['nickname', 'description', 'location'] },
        },
      }),
      walletAddress: text({
        isIndexed: 'unique',
        db: { isNullable: true },
        ui: {
          description:
            'EVM wallet address (EIP-55 checksummed). Set for wallet-auth users.',
        },
      }),
      mobile: text({
        isIndexed: 'unique',
        db: { isNullable: true },
        ui: {
          description:
            'Mobile/SMS number. Used for SMS login and future admin SMS features.',
        },
      }),
      // 1-to-1 with LearnerProfile (auto-created in afterOperation hook, same as Profile)
      learnerProfile: relationship({ ref: 'LearnerProfile.user', many: false }),
    },
    hooks: {
      async afterOperation(args) {
        if (args.operation !== 'create') return
        // Reason: Keystone infers context as KeystoneContext<BaseListTypeInfo>; cast
        // to the generated Context to access app-specific db.Profile.
        const context = args.context as unknown as Context
        try {
          const { generateNickname } =
            await import('./lib/utils/generate-nickname')
          await context.sudo().db.Profile.createOne({
            data: {
              owner: { connect: { id: args.item.id.toString() } },
              nickname: generateNickname(),
            },
          })
        } catch (err) {
          console.error(
            'Failed to auto-create Profile for user',
            args.item.id,
            err,
          )
        }
        try {
          await context.sudo().db.LearnerProfile.createOne({
            data: {
              user: { connect: { id: args.item.id.toString() } },
            },
          })
        } catch (err) {
          console.error(
            'Failed to auto-create LearnerProfile for user',
            args.item.id,
            err,
          )
        }
      },
    },
  }),
  Settings: list({
    access: allowAll,
    isSingleton: true,
    fields: {
      // Identity
      siteName: text({ label: 'Site Name' }),
      baseUrl: text({ label: 'Base URL' }),
      copyright: text({ label: 'Footer Note' }),

      // SEO
      metaTitle: text({ label: 'Meta Title' }),
      metaDescription: text({ label: 'Meta Description' }),
      ogImage: relationship({
        label: 'Open Graph Image',
        ref: 'OGImage',
      }),
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

      // Root Content
      rootPageIndex: relationship({
        ref: 'PageIndex',
        label: 'Root Page Index',
        ui: {
          description:
            'When set, the home page redirects to this PageIndex. Root Course takes priority if both are set.',
        },
      }),
      rootCourse: relationship({
        ref: 'Course',
        label: 'Root Course',
        ui: {
          description:
            'When set, the home page redirects to this course. Takes priority over Landing Page.',
        },
      }),
      transparentHeader: checkbox({
        label: 'Transparent Header on Home Page',
        defaultValue: true,
        ui: {
          description:
            'Header starts transparent over the hero and fades to solid on scroll. Disable for a always-solid header.',
        },
      }),
      // Web3 Auth
      allowWeb3Auth: checkbox({
        label: 'Allow Web3 Wallet Sign-In',
        defaultValue: true,
        ui: {
          description: 'Users can sign in with an EVM wallet (e.g. MetaMask).',
        },
      }),
      web3SignInMessage: text({
        label: 'Web3 Sign-In Message',
        defaultValue: 'Sign in with your wallet',
        ui: {
          description:
            'Statement shown in the wallet signing prompt (EIP-4361).',
        },
      }),
      receiverWalletAddress: text({
        db: { isNullable: true },
        ui: {
          description:
            'Checksummed EVM wallet address where crypto membership payments are sent.',
        },
      }),
    },
    graphql: { plural: 'ManySettings' },
  }),
  Theme: list({
    access: allowAll,
    fields: {
      name: text(),
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
          views: './admin/views/theme-color-picker',
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
          views: './admin/views/theme-color-picker',
        },
      }),
      radius: text({ defaultValue: '0.625rem' }),
      fontHeading: text({ defaultValue: "'Lobster', sans-serif" }),
      fontBody: text({ defaultValue: "'Open Sans', sans-serif" }),
      colorScheme: select({
        options: [
          { label: 'Monochromatic', value: 'monochromatic' },
          { label: 'Analogous', value: 'analogous' },
          { label: 'Complementary', value: 'complementary' },
          { label: 'Split Complementary', value: 'split-complementary' },
          { label: 'Triadic', value: 'triadic' },
          { label: 'Tetradic', value: 'tetradic' },
        ],
        ui: { displayMode: 'select' },
      }),
    },
  }),
  Hero: list({
    access: allowAll,
    fields: {
      // Reason: name identifies this hero in the picker so admins can reuse it across entities
      name: text({
        ui: { description: 'Identifier for this hero in the picker' },
      }),
      heroEyebrow: text({ ui: { description: 'Eyebrow badge text' } }),
      heroTitle: text({ ui: { description: 'Hero main heading' } }),
      heroTitleHighlight: text({
        ui: {
          description: 'Word/phrase inside title to apply gradient highlight',
        },
      }),
      heroDescription: text({
        ui: { displayMode: 'textarea', description: 'Hero body copy' },
      }),
      heroCtaLabel: text({ ui: { description: 'Primary CTA button label' } }),
      heroCtaHref: text({ ui: { description: 'Primary CTA button href' } }),
      heroSecondaryLabel: text({ ui: { description: 'Secondary link label' } }),
      heroSecondaryHref: text({ ui: { description: 'Secondary link href' } }),
      heroStat1Value: text({
        ui: { description: 'Stat 1 — value (e.g. "15")' },
      }),
      heroStat1Label: text({
        ui: { description: 'Stat 1 — label (e.g. "Lessons")' },
      }),
      heroStat2Value: text({ ui: { description: 'Stat 2 — value' } }),
      heroStat2Label: text({ ui: { description: 'Stat 2 — label' } }),
      heroStat3Value: text({ ui: { description: 'Stat 3 — value' } }),
      heroStat3Label: text({ ui: { description: 'Stat 3 — label' } }),
      heroImage: text({
        ui: { description: 'Hero visual image URL (right-column panel)' },
      }),
      heroImageBadgeTitle: text({
        ui: { description: 'Image badge bold title' },
      }),
      heroImageBadgeSubtitle: text({
        ui: { description: 'Image badge subtitle' },
      }),
      heroBackgroundImage: text({
        ui: {
          description:
            'Full-bleed background image URL (desktop). Overrides gradient when set.',
        },
      }),
      heroBackgroundImageMobile: text({
        ui: {
          description:
            'Full-bleed background image (mobile override). Falls back to desktop image on small screens.',
        },
      }),
      heroFullscreen: checkbox({
        defaultValue: false,
        ui: {
          description: 'Stretch hero to full viewport height (min-h-screen)',
        },
      }),
      heroHideGrid: checkbox({
        defaultValue: false,
        ui: {
          description: 'Hide the subtle grid overlay on the hero background',
        },
      }),
    },
  }),
  Page: list({
    access: allowAll,
    fields: {
      title: text(),
      description: text(),
      metaTitle: text(),
      metaDescription: text(),
      ogImage: relationship({ label: 'Open Graph Image', ref: 'OGImage' }),
      slug: text({
        isIndexed: 'unique',
        isFilterable: true,
      }),
      publishedAt: timestamp(),
      status: select({
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Private', value: 'private' },
          { label: 'Membership', value: 'membership' },
          { label: 'Published', value: 'published' },
        ],
        defaultValue: 'draft',
        ui: { displayMode: 'segmented-control' },
      }),
      content: document({
        formatting: true,
        dividers: true,
        links: true,
        layouts: [
          [2, 1],
          [1, 2, 1],
        ],
      }),
      trustedHtml: text({
        ui: {
          displayMode: 'textarea',
        },
      }),
      customCss: text({
        ui: {
          displayMode: 'textarea',
          description: 'Custom CSS to apply to trusted HTML',
        },
      }),
      // Reason: heroEnabled on the parent so the same Hero record can be shared across entities
      heroEnabled: checkbox({ defaultValue: false }),
      hero: relationship({
        ref: 'Hero',
        label: 'Hero Section',
        ui: { description: 'Linked hero section. Managed via the Hero tab.' },
      }),
      theme: relationship({
        ref: 'Theme',
        label: 'Custom Theme',
        ui: {
          description: 'Override the global site theme for this page.',
        },
      }),
      attachments: relationship({
        ref: 'PageAttachment.page',
        many: true,
        ui: {
          displayMode: 'cards',
          cardFields: ['title', 'filename'],
          inlineConnect: false,
          inlineCreate: {
            fields: ['cloudinaryUpload', 'title'],
          },
        },
      }),
    },
  }),
  PageAttachment: list({
    access: allowAll,
    fields: {
      page: relationship({ ref: 'Page.attachments' }),
      title: text(),
      // Reason: single upload field drives the Cloudinary file-picker UI in the admin;
      // resolveInput copies the returned metadata into the flat fields below so they
      // remain queryable via GraphQL.
      cloudinaryUpload: json({
        label: 'Upload File',
        ui: {
          views: './admin/views/cloudinary-raw-upload',
          createView: { fieldMode: 'edit' },
          itemView: { fieldMode: 'edit' },
        },
      }),
      // Populated from cloudinaryUpload via resolveInput — hidden in admin create/edit forms.
      filename: text({
        ui: {
          createView: { fieldMode: 'hidden' },
          itemView: { fieldMode: 'read' },
        },
      }),
      publicId: text({
        ui: {
          createView: { fieldMode: 'hidden' },
          itemView: { fieldMode: 'read' },
        },
      }),
      publicUrl: text({
        ui: {
          createView: { fieldMode: 'hidden' },
          itemView: { fieldMode: 'read' },
        },
      }),
      mimeType: text({
        ui: {
          createView: { fieldMode: 'hidden' },
          itemView: { fieldMode: 'read' },
        },
      }),
      format: text({
        ui: {
          createView: { fieldMode: 'hidden' },
          itemView: { fieldMode: 'read' },
        },
      }),
      bytes: integer({
        db: { isNullable: true },
        ui: {
          createView: { fieldMode: 'hidden' },
          itemView: { fieldMode: 'read' },
        },
      }),
    },
    hooks: {
      resolveInput({ resolvedData }) {
        // Reason: cloudinaryUpload JSON stores all file metadata after browser upload;
        // copy it to the individual flat fields so GraphQL queries can select them directly.
        const upload = resolvedData.cloudinaryUpload
        if (upload && typeof upload === 'object' && !Array.isArray(upload)) {
          const u = upload as Record<string, unknown>
          return {
            ...resolvedData,
            filename: (u.filename as string) ?? resolvedData.filename ?? '',
            publicId: (u.publicId as string) ?? resolvedData.publicId ?? '',
            publicUrl: (u.publicUrl as string) ?? resolvedData.publicUrl ?? '',
            mimeType: (u.mimeType as string) ?? resolvedData.mimeType ?? '',
            format: (u.format as string) ?? resolvedData.format ?? '',
            bytes: (u.bytes as number) ?? resolvedData.bytes ?? null,
          }
        }
        return resolvedData
      },
    },
  }),
  Profile: list({
    access: allowAll,
    fields: {
      owner: relationship({
        ref: 'User.profile',
      }),
      nickname: text(),
      description: text(),
      location: text({ defaultValue: 'Earth' }),
      isPublic: checkbox({ defaultValue: false }),
      image: relationship({
        ref: 'ProfileImage.profile',
      }),
      contactPreference: select({
        options: [
          { label: 'Email', value: 'email' },
          { label: 'SMS', value: 'sms' },
          { label: 'Both', value: 'both' },
          { label: 'None', value: 'none' },
        ],
        defaultValue: 'email',
        ui: {
          displayMode: 'segmented-control',
          description: 'How this user prefers to receive admin notifications.',
        },
      }),
    },
  }),
  ProfileImage: list({
    access: allowAll,
    fields: {
      profile: relationship({ ref: 'Profile.image' }),
      title: text(),
      source: cloudinaryImage({
        cloudinary: cloudinaryConfig,
        label: 'Source',
      }),
      altText: text(),
    },
  }),
  OGImage: list({
    access: allowAll,
    fields: {
      title: text(),
      source: cloudinaryImage({
        cloudinary: cloudinaryConfig,
        label: 'Source',
      }),
      altText: text(),
    },
  }),
  MembershipTier: list({
    access: allowAll,
    fields: {
      name: text({ validation: { isRequired: true } }),
      description: text(),
      priceInCents: integer({ defaultValue: 0 }),
      currency: select({
        options: [
          { label: 'USD', value: 'usd' },
          { label: 'CAD', value: 'cad' },
        ],
        defaultValue: 'usd',
        ui: { displayMode: 'segmented-control' },
      }),
      paymentType: select({
        options: [
          { label: 'Free', value: 'free' },
          { label: 'One-Time Payment', value: 'one_time' },
          { label: 'Subscription', value: 'subscription' },
        ],
        defaultValue: 'free',
        ui: { displayMode: 'segmented-control' },
      }),
      recurringInterval: select({
        options: [
          { label: 'Weekly', value: 'week' },
          { label: 'Monthly', value: 'month' },
          { label: 'Yearly', value: 'year' },
        ],
        db: { isNullable: true },
        ui: {
          displayMode: 'segmented-control',
          description: 'Billing interval — only applies to subscription tiers.',
        },
      }),
      stripeProductId: text({
        db: { isNullable: true },
        ui: {
          createView: { fieldMode: 'hidden' },
          itemView: { fieldMode: 'read' },
        },
      }),
      stripePriceId: text({
        db: { isNullable: true },
        ui: {
          createView: { fieldMode: 'hidden' },
          itemView: { fieldMode: 'read' },
        },
      }),
      isActive: checkbox({ defaultValue: true }),
      // Reason: glob patterns (e.g. ["/courses/**"]) that restrict which content
      // this tier can access. Empty array = no restrictions (backward compatible).
      contentAccessPatterns: json({
        ui: {
          description:
            'Array of glob patterns (e.g. ["/courses/**"]) that define which content this tier can access. Empty = no restrictions.',
        },
      }),
      members: relationship({ ref: 'UserMembership.tier', many: true }),
    },
    hooks: {
      async afterOperation(args) {
        // Reason: Keystone infers item as BaseItem (id: { toString(): string });
        // cast to the known shape since all fields are populated from the DB.
        const item = args.item as unknown as {
          id: string
          name: string
          priceInCents: number
          paymentType: string
          currency: string
          recurringInterval: string | null
          stripeProductId: string | null
        }
        if (args.operation !== 'create' && args.operation !== 'update') return
        if (!item.priceInCents || item.priceInCents === 0) return
        // Reason: only sync to Stripe when no product exists yet; updates to name/price
        // require manual Stripe dashboard edits (avoids unintentional price changes).
        if (item.stripeProductId) return

        if (!process.env.STRIPE_SECRET_KEY) return

        // Reason: Keystone infers context as KeystoneContext<BaseListTypeInfo>; cast
        // to the generated Context to access app-specific db.MembershipTier.
        const context = args.context as unknown as Context
        try {
          const { stripe } = await import('./lib/server/payments/stripe')
          const product = await stripe.products.create({ name: item.name })
          const price = await stripe.prices.create({
            product: product.id,
            unit_amount: item.priceInCents,
            currency: item.currency || 'usd',
            ...(item.paymentType === 'subscription'
              ? {
                  recurring: {
                    interval: (item.recurringInterval || 'month') as
                      | 'week'
                      | 'month'
                      | 'year',
                  },
                }
              : {}),
          })
          await context.sudo().db.MembershipTier.updateOne({
            where: { id: item.id },
            data: { stripeProductId: product.id, stripePriceId: price.id },
          })
        } catch (err) {
          console.error('Failed to sync Stripe product:', err)
        }
      },
    },
  }),
  UserMembership: list({
    access: allowAll,
    fields: {
      user: relationship({ ref: 'User', many: false }),
      tier: relationship({ ref: 'MembershipTier.members', many: false }),
      status: select({
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Active', value: 'active' },
          { label: 'Expired', value: 'expired' },
          { label: 'Failed', value: 'failed' },
          { label: 'Blocked', value: 'blocked' },
        ],
        defaultValue: 'pending',
        ui: { displayMode: 'segmented-control' },
      }),
      stripeCheckoutSessionId: text({
        db: { isNullable: true },
        ui: {
          createView: { fieldMode: 'hidden' },
          itemView: { fieldMode: 'read' },
        },
      }),
      stripeSubscriptionId: text({
        db: { isNullable: true },
        ui: {
          createView: { fieldMode: 'hidden' },
          itemView: { fieldMode: 'read' },
        },
      }),
      cryptoTxHash: text({
        db: { isNullable: true },
        ui: {
          createView: { fieldMode: 'hidden' },
          itemView: { fieldMode: 'read' },
        },
      }),
      paymentMethod: select({
        options: [
          { label: 'Free', value: 'free' },
          { label: 'Stripe', value: 'stripe' },
          { label: 'Crypto', value: 'crypto' },
        ],
        db: { isNullable: true },
      }),
      activatedAt: timestamp({ db: { isNullable: true } }),
      expiresAt: timestamp({ db: { isNullable: true } }),
    },
  }),
  Course: list({
    access: allowAll,
    fields: {
      title: text({ validation: { isRequired: true } }),
      description: text(),
      slug: text({
        isIndexed: 'unique',
        isFilterable: true,
      }),
      publishedAt: timestamp(),
      status: select({
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Private', value: 'private' },
          { label: 'Membership', value: 'membership' },
          { label: 'Published', value: 'published' },
        ],
        defaultValue: 'draft',
        ui: { displayMode: 'segmented-control' },
      }),
      metaTitle: text(),
      metaDescription: text(),
      ogImage: relationship({
        label: 'Open Graph Image',
        ref: 'OGImage',
      }),
      content: document({
        formatting: true,
        dividers: true,
        links: true,
        layouts: [
          [2, 1],
          [1, 2, 1],
        ],
      }),
      trustedHtml: text({
        ui: {
          displayMode: 'textarea',
        },
      }),
      customCss: text({
        ui: {
          displayMode: 'textarea',
          description: 'Custom CSS to apply to trusted HTML',
        },
      }),
      // Reason: heroEnabled on the parent so the same Hero record can be shared across entities
      heroEnabled: checkbox({ defaultValue: false }),
      hero: relationship({
        ref: 'Hero',
        label: 'Hero Section',
        ui: { description: 'Linked hero section. Managed via the Hero tab.' },
      }),
      theme: relationship({
        ref: 'Theme',
        label: 'Custom Theme',
        ui: {
          description:
            'Override the global site theme for this course. Leave unset to inherit the site default.',
        },
      }),

      // Direct pages on this course (no chapter grouping)
      pages: relationship({
        ref: 'Page',
        many: true,
        ui: {
          displayMode: 'select',
          labelField: 'title',
        },
      }),
      // Chapters — ordered groups of pages
      chapters: relationship({
        ref: 'Chapter.course',
        many: true,
        ui: {
          displayMode: 'cards',
          cardFields: ['title', 'sortOrder'],
          inlineCreate: { fields: ['title', 'sortOrder'] },
          inlineEdit: { fields: ['title', 'sortOrder', 'pages'] },
        },
      }),
      enrollments: relationship({ ref: 'CourseEnrollment.course', many: true }),
      lessonProgress: relationship({
        ref: 'CourseLessonProgress.course',
        many: true,
      }),
    },
  }),
  Chapter: list({
    access: allowAll,
    fields: {
      title: text({ validation: { isRequired: true } }),
      sortOrder: integer({ defaultValue: 0 }),
      course: relationship({ ref: 'Course.chapters' }),
      pages: relationship({
        ref: 'Page',
        many: true,
        ui: {
          displayMode: 'select',
          labelField: 'title',
        },
      }),
    },
  }),
  // Reason: mirrors the Profile pattern — keeps User clean (auth/identity only)
  // and gives the learning domain its own first-class entity for future extensibility
  // (streaks, badges, learning preferences, completion certificates).
  LearnerProfile: list({
    access: allowAll,
    fields: {
      user: relationship({ ref: 'User.learnerProfile', many: false }),
      // Denormalized counters — updated by toggleLessonComplete helper
      totalLessonsCompleted: integer({ defaultValue: 0 }),
      totalCoursesCompleted: integer({ defaultValue: 0 }),
      lastActiveAt: timestamp({ db: { isNullable: true } }),
      // Reason: json field reserved for future learner settings (pace, notifications, etc.)
      learningPreferences: json({ defaultValue: {} }),
      enrollments: relationship({
        ref: 'CourseEnrollment.learnerProfile',
        many: true,
      }),
      lessonProgress: relationship({
        ref: 'CourseLessonProgress.learnerProfile',
        many: true,
      }),
    },
  }),
  CourseEnrollment: list({
    access: allowAll,
    fields: {
      // Reason: keep direct user FK for efficient session-based Prisma queries
      user: relationship({ ref: 'User', many: false }),
      learnerProfile: relationship({
        ref: 'LearnerProfile.enrollments',
        many: false,
      }),
      course: relationship({ ref: 'Course.enrollments', many: false }),
      enrolledAt: timestamp({
        defaultValue: { kind: 'now' },
        db: { isNullable: false },
      }),
      lastAccessedAt: timestamp({ db: { isNullable: true } }),
      status: select({
        options: [
          { label: 'Enrolled', value: 'enrolled' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Completed', value: 'completed' },
        ],
        defaultValue: 'enrolled',
        ui: { displayMode: 'segmented-control' },
      }),
      completedAt: timestamp({ db: { isNullable: true } }),
    },
  }),
  CourseLessonProgress: list({
    access: allowAll,
    fields: {
      // Reason: keep direct user FK for efficient session-based Prisma queries
      user: relationship({ ref: 'User', many: false }),
      learnerProfile: relationship({
        ref: 'LearnerProfile.lessonProgress',
        many: false,
      }),
      // Reason: denormalized course ref enables efficient "all progress for user in course" queries
      course: relationship({ ref: 'Course.lessonProgress', many: false }),
      page: relationship({ ref: 'Page', many: false }),
      viewCount: integer({ defaultValue: 0 }),
      firstViewedAt: timestamp({ db: { isNullable: true } }),
      lastViewedAt: timestamp({ db: { isNullable: true } }),
      // Reason: null = not marked read; timestamp = marked read
      completedAt: timestamp({ db: { isNullable: true } }),
    },
  }),
  PageIndex: list({
    access: allowAll,
    fields: {
      title: text({ validation: { isRequired: true } }),
      slug: text({ isIndexed: 'unique', isFilterable: true }),
      // Reason: custom URL prefix without leading slash, e.g. "docs/v2".
      // Final URL: /{basePath}/{slug}/{page-slug}. Empty string = root-level index.
      basePath: text({
        isFilterable: true,
        ui: {
          description:
            'URL prefix without leading slash (e.g. "docs/v2"). Final URL: /{basePath}/{slug}/{page-slug}. Leave empty to publish at /{slug}/...',
        },
      }),
      publishedAt: timestamp(),
      status: select({
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Private', value: 'private' },
          { label: 'Membership', value: 'membership' },
          { label: 'Published', value: 'published' },
        ],
        defaultValue: 'draft',
        ui: { displayMode: 'segmented-control' },
      }),
      metaTitle: text(),
      metaDescription: text(),
      ogImage: relationship({ label: 'Open Graph Image', ref: 'OGImage' }),
      groupsLabel: text({
        defaultValue: 'Groups',
        ui: {
          description:
            'Plural label for grouped pages shown in the TOC (e.g. "Chapters", "Sections"). Singular form is auto-derived on the frontend.',
        },
      }),
      content: document({
        formatting: true,
        dividers: true,
        links: true,
        layouts: [
          [2, 1],
          [1, 2, 1],
        ],
      }),
      trustedHtml: text({ ui: { displayMode: 'textarea' } }),
      customCss: text({
        ui: {
          displayMode: 'textarea',
          description: 'Custom CSS to apply to trusted HTML',
        },
      }),
      // Reason: heroEnabled on the parent so the same Hero record can be shared across entities
      heroEnabled: checkbox({ defaultValue: false }),
      hero: relationship({
        ref: 'Hero',
        label: 'Hero Section',
        ui: { description: 'Linked hero section. Managed via the Hero tab.' },
      }),
      theme: relationship({
        ref: 'Theme',
        label: 'Custom Theme',
        ui: {
          description:
            'Override the global site theme for this page index. Leave unset to inherit the site default.',
        },
      }),
      pages: relationship({
        ref: 'Page',
        many: true,
        ui: { displayMode: 'select', labelField: 'title' },
      }),
      groups: relationship({
        ref: 'PageGroup.pageIndex',
        many: true,
        ui: {
          displayMode: 'cards',
          cardFields: ['title', 'sortOrder'],
          inlineCreate: { fields: ['title', 'sortOrder'] },
          inlineEdit: { fields: ['title', 'sortOrder', 'pages'] },
        },
      }),
    },
    hooks: {
      validateInput: async ({
        resolvedData,
        item,
        addValidationError,
        context,
      }) => {
        const newBasePath = (
          (resolvedData.basePath ??
            (item as Record<string, unknown>)?.basePath ??
            '') as string
        ).trim()
        const newSlug = (
          (resolvedData.slug ??
            (item as Record<string, unknown>)?.slug ??
            '') as string
        ).trim()
        if (!newSlug) return

        // Reason: reserved platform paths must be blocked to prevent the catch-all route
        // from shadowing core platform pages.
        const RESERVED = [
          'api',
          'courses',
          'admin',
          'dashboard',
          'profile',
          'settings',
          'onboarding',
          'login',
          'logout',
          'signup',
          'get-access',
          '_next',
          'static',
        ]
        const firstSegment = (newBasePath || newSlug)
          .split('/')[0]
          .toLowerCase()
        if (RESERVED.includes(firstSegment)) {
          addValidationError(
            `Base path cannot start with "${firstSegment}" — this is a reserved platform path.`,
          )
          return
        }

        const ctx = context.sudo() as unknown as Context
        const itemId = (item as Record<string, unknown>)?.id?.toString()

        // Compound uniqueness: no other PageIndex with same (basePath, slug)
        const existing = await ctx.db.PageIndex.findMany({
          where: {
            slug: { equals: newSlug },
            basePath: { equals: newBasePath },
            ...(itemId ? { id: { not: { equals: itemId } } } : {}),
          },
        })
        if (existing.length > 0) {
          addValidationError(
            `A PageIndex already exists at "${newBasePath ? newBasePath + '/' : ''}${newSlug}".`,
          )
          return
        }

        // Prefix conflict: no existing PageIndex whose basePath begins with this new full path
        const fullPath = newBasePath ? `${newBasePath}/${newSlug}` : newSlug
        const prefixConflicts = await ctx.db.PageIndex.findMany({
          where: {
            basePath: { startsWith: `${fullPath}/` },
            ...(itemId ? { id: { not: { equals: itemId } } } : {}),
          },
        })
        if (prefixConflicts.length > 0) {
          const conflict = prefixConflicts[0] as {
            basePath: string
            slug: string
          }
          addValidationError(
            `URL collision: another PageIndex exists at "${conflict.basePath}/${conflict.slug}", which shares a URL prefix with this index.`,
          )
        }
      },
    },
  }),
  PageGroup: list({
    access: allowAll,
    fields: {
      title: text({ validation: { isRequired: true } }),
      sortOrder: integer({ defaultValue: 0 }),
      pageIndex: relationship({ ref: 'PageIndex.groups' }),
      pages: relationship({
        ref: 'Page',
        many: true,
        ui: { displayMode: 'select', labelField: 'title' },
      }),
    },
  }),
}
