# hyperlocal

An open source community engagement platform. More BBS than social media network — built on Next.js 15 and KeystoneJS 6.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1.12-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![KeystoneJS](https://img.shields.io/badge/KeystoneJS-6-6B46C1?logo=keystone&logoColor=white)](https://keystonejs.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/completeperspective/hyperlocal/issues)

<!-- SCREENSHOTS: pending UI/UX pass — high-value screens to be identified and added -->

---

## What it is

hyperlocal is a self-hosted, open source community platform for small-to-medium groups — the kind of space that's more forum than feed. It ships the full stack in a single Next.js + KeystoneJS process: CMS-driven pages, course content, tiered memberships, Stripe and on-chain crypto payments, Cloudinary media management, and Web3 wallet authentication. The current release (0.5.x) covers content and membership infrastructure. v1.0 will layer in community features — threaded posts, member directory, direct messaging, and notifications.

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
- Coming soon: direct messaging (WebSocket), email blasts (Sendgrid), SMS (Twilio), user groups (Distro lists)

### Admin

- Full admin UI for managing users, content, membership tiers, themes, and settings
- **Theme Forge** — generate a complete design token set from a primary color, with WCAG scoring and harmony presets
- Cloudinary image management (avatars, OG images, hero backgrounds)
- OG image generation per page and course
- Private file attachments with signed download URLs

---

## Tech Stack

| Layer           | Technology                                                     |
| --------------- | -------------------------------------------------------------- |
| Frontend        | Next.js 15.1.12 (App Router), React 18, TypeScript 5           |
| Styling         | Tailwind CSS 4, shadcn/ui (new-york), Radix UI                 |
| CMS / Admin     | KeystoneJS 6                                                   |
| Database        | PostgreSQL + Prisma 5                                          |
| Auth            | iron-session, Reown AppKit + wagmi + viem                      |
| Payments        | Stripe (subscriptions + one-time), ETH on Base (chain ID 8453) |
| Media           | Cloudinary                                                     |
| Testing         | Vitest + React Testing Library + MSW                           |
| Package manager | pnpm                                                           |

---

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

## Roadmap

### Phase 2 — Communication channels

- [ ] **Direct messaging** — in-app WebSocket messaging between members
- [ ] **Email blast** — broadcast emails to members via Sendgrid
- [ ] **SMS** — Twilio SMS to members

### Phase 3 — Community

- [ ] **User groups** — segment members into distribution lists
- [ ] **Community posts** — BBS-style threaded discussion tied to the member dashboard
- [ ] **Community feed** — chronological activity stream for logged-in members
- [ ] **Notifications** — in-app alerts for replies, membership events, and admin actions
- [ ] **Member directory** — browsable public profiles for community members
- [ ] **Public profile pages** — shareable member profiles with post history

---

## Course

Built alongside [Practical Web Applications with TypeScript and GraphQL](https://learn.colpitts.dev/courses/pwa-typescript-graphql-course). The course covers the exact patterns used to build this platform — KeystoneJS data modeling, Next.js App Router, Stripe and crypto payment flows.

---

## Contributing

Issues and discussions are welcome. PRs are welcome — open an issue first to discuss what you'd like to change.

[Open an issue](https://github.com/completeperspective/hyperlocal/issues)

---

## License

[MIT](https://opensource.org/licenses/MIT)
