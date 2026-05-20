# Chapter 03: Site Identity

---

A running server with default settings looks like a blank canvas. This lesson is about picking up the brush. We will log in to the Keystone admin UI, configure the Settings singleton that drives your site's identity, and make the platform feel like your club rather than a template.

Everything in this lesson happens in the admin UI at `http://localhost:3333` (or your production domain on port 3333 if you have it exposed, or via SSH tunnel). This is the Keystone-powered backend interface — not visible to your members, only to admins.

---

## Logging In to Keystone Admin

> **Action:** Navigate to `http://localhost:3333` (or `https://your-vps-ip:3333` in production). Sign in with the admin credentials created during the seed step — default is `admin@example.com` / `Admin1234!`.

> **Note:** In production, your Keystone admin UI should **not** be exposed to the public internet. It runs on port 3333 inside your VPS. Access it via SSH port-forward: `ssh -L 3333:localhost:3333 user@yourserver` and then open `http://localhost:3333` locally.

Once logged in, you will see the Keystone dashboard: a left-side navigation listing every data model (list) in your instance. The most important one right now is **Settings**.

---

## The Settings Singleton

Settings is a singleton list — there is exactly one record, ever. It controls global configuration for the entire platform. Click **Settings** in the left nav, then click the single record that appears.

You will see fields organized into logical groups. Work through them:

### Site Identity

| Field | What it does | Example |
|---|---|---|
| `siteName` | The short name shown in the header and browser tab | `The Vinyl Archive` |
| `baseUrl` | Your public URL — used for links in emails and OG tags | `https://vinyl.yourdomain.com` |
| `metaTitle` | The `<title>` tag on the homepage | `The Vinyl Archive — Members Only` |
| `metaDescription` | The homepage meta description (search engines + social cards) | `A private community for serious record collectors.` |
| `copyright` | Footer copyright line | `© 2026 The Vinyl Archive` |

> **Action:** Fill in `siteName`, `baseUrl`, `metaTitle`, and `metaDescription` for your club. Click **Save** in the top right. These take effect immediately — no rebuild required.

### Access Control

| Field | What it does |
|---|---|
| `isPrivate` | When `true`, all content requires authentication. Unauthenticated visitors see only the login page. |
| `allowSignup` | When `false`, new registrations are disabled. Invite-only mode. |

> **Note:** For a private club in early stages, set `allowSignup: true` while you build your initial audience. Flip it to `false` later once you want to curate access more carefully.

### Root Navigation

The `rootCourse` and `rootPageIndex` fields control what your site's homepage routes serve. If you set `rootCourse`, navigating to `/` redirects to that course. If you set `rootPageIndex`, the homepage renders that page index's content. You will configure these after creating your first course in Lesson 5.

---

## The Config Client Endpoint

Hyperlocal deliberately avoids baking settings into the Docker image via `NEXT_PUBLIC_*` environment variables. Instead, the Next.js frontend fetches configuration at runtime from `/api/v1/config/client`. This means you can deploy one Docker image and adjust settings via the admin UI — no rebuild, no redeploy.

> **Aside:** This design is intentional. When you change `siteName` in the admin UI, every user who loads the page after that change sees the new name — because the value is fetched live, not compiled in. It makes your deployment pipeline much simpler: build once, configure always.

---

## Configuring the Theme

The Settings record also links to your active `Theme`. You will configure the full visual theme in Lesson 11 using Theme Forge. For now, the default theme (plain neutral colors) is functional.

If you want a quick placeholder look, click the **Theme** relation field and select `Default`, or leave it connected to whatever the seed script created.

---

## Creating Your First Admin User (Production)

If you are setting up a fresh production instance (not using the seed script), you need to create the first admin user manually through Keystone.

> **Action:** In the Keystone admin UI left nav, click **Users** → **Create User**. Set `email`, `password`, and `isAdmin: true`. This user will have full access to the admin panel.

After creating your real admin account, delete the seed admin (`admin@example.com`) to close that credential.

---

## Metadata and Social Cards

Your `metaTitle` and `metaDescription` are served by the Next.js root layout. When someone shares a link to your community on social media, these fields populate the Open Graph tags that generate the preview card.

To add a custom OG image, upload one to Cloudinary and set the `ogImage` URL field on Settings. Recommended dimensions: 1200×630px.

---

## What's Next

Your site now has a name and an identity. In the next lesson we will design your membership tiers — the access model that determines who sees what and how they pay.

## You Own the Config

Every field you just set is stored in your PostgreSQL database, on your server, under your control. When you change `siteName`, you are not submitting a support ticket or waiting for a platform approval. You are editing a record in your database.

That is what ownership looks like.
