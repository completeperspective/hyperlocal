# Chapter 12: Launch Day

---

You have deployed your instance, configured your site identity, designed your membership tiers, created your first course, set up payments, branded your theme, and learned how to manage your community. This final lesson is a launch checklist — the ordered sequence of verifications to run before you announce your club to the world.

Run through this list top to bottom before sending your first invite.

---

## Environment Variable Audit

Open your production `.env` and verify every required variable is set:

```
✅ DATABASE_URL              — PostgreSQL connection string
✅ AUTH_SESSION_NAME         — Cookie name (unique per site)
✅ AUTH_SESSION_SECRET       — 32+ char random string
✅ CLOUDINARY_CLOUD          — Cloud name
✅ CLOUDINARY_APIKEY         — API key
✅ CLOUDINARY_SECRET         — API secret
✅ CLOUDINARY_PROJECT        — Project folder name

Optional but recommended:
✅ STRIPE_SECRET_KEY         — Live key (sk_live_...)
✅ STRIPE_PUBLISHABLE_KEY    — Live key (pk_live_...)
✅ STRIPE_WEBHOOK_SECRET     — Live webhook secret (whsec_...)

Optional (crypto payments):
✅ WALLETCONNECT_PROJECT_ID  — If accepting crypto
✅ ALCHEMY_BASE_KEY          — If accepting crypto
✅ CRYPTO_QUOTE_HMAC_SECRET  — If accepting crypto
```

> **Note:** `ENABLE_TESTNETS` should be absent or `false` in production. Double-check that you are using `sk_live_` and `pk_live_` Stripe keys, not `sk_test_`.

---

## Settings Checklist

In the Keystone admin UI → **Settings**, verify:

```
✅ siteName          — Your club's name
✅ baseUrl           — https://yourclub.com (no trailing slash)
✅ metaTitle         — Compelling homepage title
✅ metaDescription   — One-sentence pitch for social previews
✅ copyright         — Your copyright line
✅ rootCourse        — Set to your main course (if course-first)
✅ theme             — Your custom theme selected
✅ allowSignup       — true (unless invite-only launch)
✅ isPrivate         — true if you want full auth-required access
```

---

## Content Checklist

```
✅ At least one course published with at least one free (status: published) lesson
✅ All paid lessons have status: membership
✅ Membership tiers have correct contentAccessPatterns
✅ Tier prices are correct in cents (not dollars)
✅ At least one active paid tier is visible on /get-access
```

> **Action:** Log in as a brand-new account with no membership. Navigate to your free lesson — you should see it. Navigate to a paid lesson — you should see the gate. Navigate to `/get-access` — you should see your paid tiers with prices.

---

## Payment Flow Test

```
✅ Stripe test checkout works with card 4242 4242 4242 4242
✅ Stripe live checkout works with a real card (authorize then refund)
✅ Webhook fires and membership activates after checkout
✅ Member can access gated content after activation
✅ Stripe Billing Portal accessible from /settings (member can cancel)
```

---

## Security Checklist

```
✅ Admin password changed from seed default (Admin1234!)
✅ Seed test accounts deleted (active@, pending@, expired@, failed@, blocked@)
✅ Keystone admin UI (port 3333) NOT exposed to public internet
✅ HTTPS live on production domain (Caddy or equivalent)
✅ SSH key authentication only — password auth disabled on VPS
✅ AUTH_SESSION_SECRET is random, not a dictionary word
```

> **Note:** If you are not sure whether port 3333 is exposed, run `curl -I https://yourclub.com:3333` from outside your VPS. A connection refused response means it is properly firewalled. An HTTP response means it is exposed and you need to close it.

---

## Backup Strategy

Before your first members sign up, set up automated PostgreSQL backups.

```bash
# Simple daily backup to a file
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

For production, use your VPS provider's snapshot feature or a tool like `pgbackup`. Store backups off-site (S3, Backblaze B2, etc.). Test restoring from backup before you need it.

---

## Announcing Your Club

Resist the urge to announce before you have at least one person other than yourself who can log in, complete a checkout, and access gated content. The launch checklist above should be run by someone else, not just you.

Once verified:

1. **Write the announcement** — explain what the club is for, who it is for, and what they get on day one. Make the value specific, not vague.
2. **Set the early access price** — a founding member discount creates urgency without devaluing the product. Close the founding tier once you hit your target number.
3. **Seed the community** — invite 5–10 people whose presence will make other members feel the community is alive. Ghost towns do not convert browsers to members.
4. **Be present** — for the first two weeks, respond to every question, fix every broken link, and note every piece of feedback. Your launch window is the highest-signal period for improving the experience.

---

## Post-Launch Operations

Week one will surface issues you did not anticipate. Common ones:

- A member cannot complete checkout → check the Stripe dashboard and webhook logs
- Content is accessible that should be gated → audit your contentAccessPatterns
- Members report email confirmation not arriving → check your email delivery setup
- Theme renders incorrectly on mobile → test at 375px width and adjust token values

Schedule 30 minutes a week for community operations: review new signups, follow up with expired memberships, and check the member table for anything unusual.

---

## The Ongoing Work

A platform launch is a starting line, not a finish line. The system you have built will run without you — payments process, content gates work, members can manage their own accounts. What it cannot do without you:

- Create new content worth paying for
- Welcome new members and make them feel the community's value immediately
- Handle the edge cases that do not fit the automated flows
- Decide when to raise prices, close tiers, or start new initiatives

The infrastructure handles the logistics. The community is still yours to build.

## You Are the Sysop Now

Every BBS had a sysop — the person who kept the lights on, set the rules, and shaped what kind of place it was. That is you now. You have the server, the domain, the member data, and the revenue. No platform can take that from you.

Run a good club.
