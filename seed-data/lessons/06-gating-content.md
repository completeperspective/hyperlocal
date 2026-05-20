# Chapter 06: How Content Gating Works

---

Content gating is the mechanism that turns your platform into a membership business. This lesson explains exactly how hyperlocal decides who can see what — from the middleware check to the member-facing gate page — and how to verify your configuration is working correctly.

Understanding the gate is not optional. A misconfigured access pattern can either lock paying members out of content they purchased, or let free members access content they should not see. Both are bad. Let's make it precise.

---

## The Access Check Path

When a member requests a page, hyperlocal runs through this sequence:

```
1. Next.js middleware checks if the user is authenticated.
   Not authenticated → redirect to /login

2. If authenticated, the server fetches the user's active membership tier.
   No active membership → redirect to /get-access

3. The tier's contentAccessPatterns are matched against the requested URL path.
   No pattern matches → show the content gate ("upgrade to access")

4. A pattern matches → render the page.
```

This check happens on every server-rendered page request. It is enforced server-side — there is no client-side JavaScript bypass.

> **Aside:** "Content gating" in many platforms is actually just a CSS overlay or a JavaScript redirect that technically-minded users can defeat. In hyperlocal, the gate is real: the server never renders the content for unauthorized users. The HTML is never sent to the browser.

---

## The `contentAccessPatterns` Field in Practice

Let's make the glob matching concrete.

Say you have two tiers:

```
Free tier        contentAccessPatterns: ["/courses/intro/**"]
Member tier      contentAccessPatterns: ["/courses/**", "/pages/**"]
```

And you have these URLs:

| URL | Free | Member |
|---|---|---|
| `/courses/intro/welcome` | ✅ | ✅ |
| `/courses/intro/lesson-2` | ✅ | ✅ |
| `/courses/advanced/lesson-1` | ❌ | ✅ |
| `/pages/community-guide` | ❌ | ✅ |
| `/admin` | ❌ | ❌ |

Admin URLs are protected by a separate admin middleware check — tier patterns do not apply there.

> **Note:** Patterns match on the URL **path** only. Query strings (`?ref=email`) are ignored. The match uses glob semantics: `*` matches any single path segment (no slashes), `**` matches zero or more segments (can cross slashes).

---

## The Lesson Status Field

The gate has two layers working together: the tier's `contentAccessPatterns` and the page's `status` field.

| Page status | Behavior |
|---|---|
| `draft` | Never shown in course index or navigable. Returns 404. |
| `published` | Accessible to anyone — even unauthenticated visitors. No tier check. |
| `membership` | Full tier check: authenticated + active membership + pattern match. |

This means you can have a published (free) first lesson and membership-gated subsequent lessons within the same course — a common structure for driving signups.

> **Action:** In the admin UI, find your free preview lesson (the one you want to give away) and set its `status` to `published`. Set all other lessons to `membership`.

---

## Membership Status Values

A user's ability to access gated content depends on their membership `status`:

| Status | Can access gated content? | Notes |
|---|---|---|
| `active` | ✅ Yes | Normal paying/free member |
| `pending` | ❌ No | Payment initiated, webhook not confirmed yet |
| `expired` | ❌ No | Subscription lapsed or one-time access period ended |
| `failed` | ❌ No | Payment failed — user should update payment method |
| `blocked` | ❌ No | Manually blocked by admin |

Only `active` memberships unlock gated content. If a Stripe webhook fails and a renewal is not confirmed, the status stays `pending` or transitions to `failed`. The user sees the gate page prompting them to resolve the payment issue.

---

## Verifying Your Gate Configuration

Testing the gate is easy — you just need accounts in different states.

The seed script creates test accounts for each membership status:

| Email | Password | Status |
|---|---|---|
| `admin@example.com` | `Admin1234!` | Admin (full access) |
| `active@example.com` | `Admin1234!` | Active free membership |
| `pending@example.com` | `Admin1234!` | Pending |
| `expired@example.com` | `Admin1234!` | Expired |
| `blocked@example.com` | `Admin1234!` | Blocked |

> **Action:** Log in as `active@example.com`. Navigate to a `membership`-status lesson. If your free tier's `contentAccessPatterns` match that lesson's URL, you should see the content. If not, you should see the gate page.

> **Action:** Log out. Try to navigate to any gated URL. You should be redirected to `/login` immediately — the content is never loaded.

---

## The Gate Page

When an authenticated user with an active membership hits a URL that their tier does not cover, they see a gate page at the same URL — not a redirect. The gate page shows:

- A message explaining they need a higher tier
- A link to `/get-access` to browse available membership options

You can customize the gate page copy in the frontend source, but the behavior is built-in.

---

## Common Configuration Mistakes

**Forgetting `/**` for your all-access tier:** If your top tier's patterns are too narrow, even paying members will hit the gate on some content. Always test with the highest tier account.

**Setting free lesson status to `membership`:** If you want a free preview, the page status must be `published`, not `membership`. A `membership` page with a free-tier pattern still requires an active (even free) membership.

**Overlapping patterns across tiers:** Patterns are not exclusive — a URL can match multiple tier patterns simultaneously. A member with any matching tier will have access. This is a feature (a user who upgrades gets everything the lower tiers covered), not a bug.

---

## What's Next

The gate is configured and verified. In the next lesson we connect Stripe so your paid tiers actually process payments.

## The Gate Is the Product

An ungateable community is a public forum. Your access control model is not a technical implementation detail — it *is* the membership product. Every decision about patterns, tier names, and pricing is a product decision. Get it right here before the members arrive.
