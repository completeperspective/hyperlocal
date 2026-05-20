# hyperlocal

An open source community engagement platform for niche groups. More BBS than social media network — built on Next.js 15 and KeystoneJS 6.

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp env.sample .env
```

Fill in the required values (see [Environment Variables](#environment-variables) below).

### 3. Start the development servers

```bash
pnpm dev
```

| Service            | URL                   |
| ------------------ | --------------------- |
| Frontend (Next.js) | http://localhost:7777 |
| Keystone Admin UI  | http://localhost:3333 |

---

## Seeding App Data

`pnpm db:seed` wipes the database and inserts a complete working dataset. Run it once against a fresh environment.

**What gets seeded:**

- **Users** — an admin user and a sample member user (credentials in `seed-data/data.ts`)
- **Profiles** — display names, descriptions, and avatar images for each user
- **Membership tiers** — supports free and paid tiers
- **Settings** — command and control -- site name, seo metadata, feature flags, etc
- **Pages** — four lorem ipsum lesson pages (`example-lesson-one` through `example-lesson-four`)
- **Course** — `example-course` with two chapters grouping the four lesson pages
- **Page index** — a `home` page index wired as the site root, with a full-screen hero promoting hyperlocal

```bash
pnpm db:seed
```

> The seed script will prompt for confirmation before wiping data.

### Other data commands

| Command               | Purpose                                                           |
| --------------------- | ----------------------------------------------------------------- |
| `pnpm db:studio`      | Open Prisma Studio to browse the database                         |
| `pnpm db:generate`    | Regenerate the Prisma client after schema changes                 |
| `pnpm course:publish` | Upsert course pages into any target database (no wipe)            |
| `pnpm course:dist`    | Build static HTML previews to `dist/course/` (no database needed) |

---

## Features

### Content & Courses

- CMS-driven pages via **PageIndex** — slug-routed pages organized into groups
- **Course** content hierarchy: Course → Chapter → Page with publish status and access gating
- Lesson progress tracking and course enrollment per learner
- **Hero builder** — configurable full-screen or standard hero blocks with stats, CTAs, and background images

### Membership & Access

- Tiered memberships: free, Stripe (card payments), and direct crypto (ETH on Base)
- Per-page and per-course content gating by membership status
- Stripe subscription and one-time payment flows with webhook handling
- On-chain crypto payment verification (minimum 3 block confirmations, Base mainnet or Base Sepolia)

### Community & Users

- User registration, login, and profile management (display name, bio, location, avatar)
- Web3 wallet connection and wallet-based authentication via Reown AppKit + wagmi
- Community dashboard: member stats, MRR estimate, and searchable member table
- Coming Soon: notifications, in app chat, email and sms blasts, user groups (distribution lists)

### Admin

- Full admin UI for managing users, content, membership tiers, themes, and settings
- **Theme Forge** — generate a complete design token set from a primary color, with WCAG scoring and harmony presets
- Cloudinary image management (avatars, OG images, hero backgrounds)
- OG image generation per page and course
- Private file attachments with signed download URLs

---

## Roadmap

- **Community posts** — BBS-style threaded discussion tied to the member dashboard
- **Member directory** — browsable public profiles for community members
- **Direct messaging** — member-to-member private messages
- **Notifications** — in-app alerts for replies, membership events, and admin actions
- **Community feed** — chronological activity stream for logged-in members
- **Public profile pages** — shareable member profiles with post history
- **Onboarding flow** — guided setup wizard for new community members

---

## Membership & Payments

### Environment Variables

Copy `env.sample` to `.env` and fill in:

```bash
# Core
DATABASE_URL=postgresql://user:pass@localhost/dbname
AUTH_SESSION_SECRET=<at-least-32-random-chars>

# Stripe (required for paid memberships)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Crypto payments (optional)
WALLETCONNECT_PROJECT_ID=...
ALCHEMY_BASE_KEY=...              # Base mainnet
ALCHEMY_BASE_SEPOLIA_KEY=...      # Base Sepolia testnet
ENABLE_TESTNETS=true              # Set to use Base Sepolia instead of mainnet
CRYPTO_QUOTE_HMAC_SECRET=<at-least-32-random-chars>

# Cloudinary (required for image uploads)
CLOUDINARY_CLOUD=...
CLOUDINARY_APIKEY=...
CLOUDINARY_SECRET=...
CLOUDINARY_PROJECT=...
```

### Stripe Setup

1. Create membership tiers in the Keystone admin UI. Setting `priceInCents > 0` automatically syncs a Stripe product and price.
2. Point your Stripe webhook to `https://your-domain.com/api/v1/memberships/webhooks/stripe`. Required events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`

### Crypto Setup

Set `Settings.receiverWalletAddress` to your checksummed EVM wallet address in the Keystone admin UI. This enables the crypto payment path.

> The USD→ETH conversion rate is a placeholder constant. Replace with a live price oracle before production.

---

## Development Commands

```bash
# Dev
pnpm dev              # Keystone (port 3333) + Next.js (port 7777) concurrently
pnpm keystone:dev     # Keystone only
pnpm next:dev         # Next.js only

# Build
pnpm build            # keystone:build + next:build
pnpm next:start       # Start production Next.js server

# Quality
pnpm validate         # lint + format:check + type-check + test (full gate)
pnpm lint             # ESLint
pnpm format           # Prettier --write
pnpm type-check       # tsc --noEmit
pnpm test             # Vitest (single pass)
pnpm test:watch       # Vitest watch mode
pnpm test:coverage    # Vitest with coverage report
```
