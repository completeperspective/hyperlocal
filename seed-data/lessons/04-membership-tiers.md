# Chapter 04: Designing Your Membership Tiers

---

Membership tiers are the economic foundation of your private club. They determine who gets access to what content, how they pay, and how recurring revenue flows. Getting them right before you start creating content saves a lot of restructuring later.

This lesson covers what tiers are, how the payment types work, how content access patterns gate your content, and how to think about pricing for a community that is just starting out.

---

## What a Tier Is

A membership tier (`MembershipTier` in the database) represents a named level of access. When a user has an **active** membership tied to a tier, they can access any URL that tier's content access patterns permit.

Each tier has:

| Field | Purpose |
|---|---|
| `name` | What members see — "Member", "Founding Member", "All-Access" |
| `description` | Short explanation shown on the pricing/membership page |
| `priceInCents` | Price in cents. `0` = free tier. `2999` = $29.99. |
| `paymentType` | `free`, `one_time`, or `subscription` |
| `recurringInterval` | For `subscription` type: `month` or `year` |
| `isActive` | Whether this tier is purchasable. Inactive tiers are hidden from the signup flow. |
| `contentAccessPatterns` | Glob patterns for the URLs this tier unlocks |

---

## Payment Types

### `free`

The entry tier. No payment required — anyone who signs up gets this tier immediately (if you grant it automatically) or can self-enroll. Good for:
- A "newsletter subscriber" level with access to a few free lessons
- A community lurker tier that can read public threads but not premium content
- Pre-launch list building

### `one_time`

A single payment that grants access indefinitely (or until a manually set `expiresAt`). Syncs to a Stripe product automatically when `STRIPE_SECRET_KEY` is configured. Good for:
- "Lifetime access" to a specific course
- A founding member deal: pay once, access forever

### `subscription`

A recurring payment (monthly or yearly) billed through Stripe. The membership status stays `active` as long as payments succeed. If a payment fails, the status transitions to `failed`. Good for:
- Ongoing community access
- Regular content drips (new lessons monthly)
- Any content where you plan to keep adding value over time

---

## Content Access Patterns

The `contentAccessPatterns` field is an array of glob patterns. When an authenticated user tries to access a URL, the middleware checks whether any of their active tier's patterns match.

Common patterns:

| Pattern | Matches |
|---|---|
| `/courses/**` | All course URLs |
| `/courses/my-course/**` | Only that specific course |
| `/pages/**` | All dynamic pages |
| `/**` | Everything — full access |
| `/community/**` | Any URL under `/community/` |

> **Note:** Patterns are evaluated on the URL path only, not query strings. The matching uses standard glob syntax: `*` matches any single segment, `**` matches zero or more segments.

### Designing Your Access Layers

A typical three-tier structure:

```
Free tier       → /courses/intro-course/**
                  (first course only — the hook)

Member tier     → /courses/**
  ($9/mo)         (all courses)

All-Access tier → /**
  ($29/mo)        (courses + pages + any future content)
```

The free tier creates a "taste" of your content. The paid tiers unlock progressively more. Members who see value in the free tier are your warmest prospects for conversion.

---

## Creating Tiers in the Admin UI

> **Action:** In the Keystone admin UI, navigate to **Membership Tiers** → **Create Membership Tier**.

Start with your free tier:

- `name`: `Member`
- `description`: `Free access to introductory content.`
- `priceInCents`: `0`
- `paymentType`: `free`
- `isActive`: `true`
- `contentAccessPatterns`: `["/courses/intro-to-your-club/**"]`

Save. Then create your first paid tier:

- `name`: `Founding Member`
- `description`: `Full access to all content — reserved for the first 100 members.`
- `priceInCents`: `1999`
- `paymentType`: `subscription`
- `recurringInterval`: `month`
- `isActive`: `true`
- `contentAccessPatterns`: `["/**"]`

> **Aside:** "Founding Member" framing is a proven conversion lever for early communities. It creates genuine scarcity (you can enforce the 100-cap by deactivating the tier), rewards early adopters with a lower price, and builds identity. When the founding tier closes, the standard tier should be priced higher — reinforcing the value of acting early.

---

## Stripe Sync

When you save a paid tier (any tier with `priceInCents > 0`) and `STRIPE_SECRET_KEY` is configured, hyperlocal automatically creates a matching Stripe product and price via a `afterOperation` hook on the `MembershipTier` list. You do not need to create products manually in the Stripe dashboard.

If Stripe is not yet configured, the tier saves to your database and the Stripe sync is silently skipped. You can configure Stripe later (Lesson 7) and the sync will run when you next save the tier.

---

## Pricing Philosophy

There is no universally correct price for a private club. Some principles to guide you:

**Price for commitment, not reach.** A $5/month tier attracts people who are mildly curious. A $20/month tier attracts people who are serious. Serious members participate more, stick around longer, and make the community better for everyone else.

**Your free tier should demonstrate value, not give it away.** Make the free tier good enough that someone understands why they should pay — not so good that they never need to.

**Raise prices as you grow.** It is much easier to raise prices for new members while grandfathering existing members than to lower prices. Start where your content's current value honestly sits, not where you hope it will be.

---

## What's Next

With tiers designed, the next lesson covers creating course content — the actual value your members are paying for.

## The Access Model You Just Built

Every URL in your platform is now either open (matched by a free tier pattern), gated (matched only by paid tier patterns), or inaccessible (matched by nothing). You have the full economic model in place before you have written a single piece of content. That is the right order.
