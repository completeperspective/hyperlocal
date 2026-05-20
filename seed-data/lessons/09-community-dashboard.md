# Chapter 09: The Community Dashboard

---

The community dashboard is your real-time view of how your club is doing. It lives at `/admin/community` and shows you member counts, active memberships, MRR estimate, a searchable member table, and the tools for communicating with your community.

This lesson walks through each panel, explains what the numbers mean, and shows you how to use the filters to get actionable information.

---

## Getting There

> **Action:** Log in to the frontend admin panel at `https://yourclub.com/admin`. Navigate to **Community** (or `/admin/community`).

This is distinct from the Keystone admin UI (port 3333). The `/admin/community` page is part of the Next.js application — built for daily operational use by the club admin, not for schema management.

---

## The Stats Bar

At the top of the page, three numbers give you the headline view:

| Stat | What it means |
|---|---|
| **Total Users** | Everyone who has ever created an account, regardless of membership status |
| **Active Members** | Users with a membership currently in `active` status |
| **MRR Estimate** | Sum of all active memberships' tier prices — a rough monthly recurring revenue figure |

> **Note:** "MRR Estimate" is an approximation, not an accounting figure. It sums the `priceInCents` of every active membership's tier. It does not account for annual plans, lifetime deals, or crypto payments. Use it as a directional indicator, not a financial statement.

### Reading the Stats Over Time

These numbers are snapshots, not time-series. For trends, compare mental snapshots over time or run a database query. The dashboard tells you where you are; it does not tell you how you got here.

---

## The Member Table

The member table lists all users with their membership status, tier, and profile data. By default it shows 25 users per page, sorted by email.

### Columns

| Column | What it shows |
|---|---|
| Avatar + Name | Profile image and nickname (or email if no nickname set) |
| Email | Account email address |
| Role | Member or Admin |
| Wallet | Whether the user has connected a Web3 wallet |
| Membership | Tier name, status badge (active / pending / expired / failed / blocked), and payment method |
| Joined | Account creation date |
| Actions | Open user detail drawer |

### Filters

Use the filter bar above the table to narrow the view:

| Filter | Options |
|---|---|
| Search | Email or nickname substring match |
| Status | active / pending / expired / failed / blocked |
| Tier | Filter by a specific membership tier |
| Role | member / admin |
| Wallet | Has wallet connected / No wallet |

> **Action:** Filter by `status: expired` to see lapsed members. These are your win-back targets — people who were once paying members and may subscribe again with the right message.

> **Action:** Filter by `status: pending` to see memberships awaiting payment confirmation. If someone reports their payment went through but they cannot access content, this is where you check first.

---

## The User Detail Drawer

Clicking a user in the table opens a side drawer with their full profile:

- Profile image, nickname, location, bio
- Membership history: tier, status, activation date, expiry date
- Payment method used (free / stripe / crypto)
- Stripe subscription ID or crypto transaction hash (if applicable)
- Admin quick-actions: edit user, view full profile

The drawer gives you everything you need to resolve a support request without leaving the community page.

---

## The Communication Rail

At the top of the community page, above the member table, is the communication rail — a set of quick-action tools for engaging your community. It currently surfaces common communication tasks.

> **Note:** Communication features (email, announcements) are on the roadmap for future hyperlocal releases. The rail is the anchor point for those features as they ship. For now, use it as a prompt to think about community communication — even if the tooling is not fully built yet.

---

## Common Admin Workflows

### Resolving a "I paid but cannot access content" report

1. Find the user in the member table (search by email)
2. Check their membership `status` — is it `pending` instead of `active`?
3. If pending: check the Stripe dashboard for the payment. If it processed, the webhook may have failed. Manually set membership status to `active` via the Keystone admin UI → User Memberships.
4. If no membership record exists: the checkout may have been abandoned. Ask the user to retry.

### Identifying churn signals

Filter by `status: expired` and `status: failed`. Users in `expired` status have lapsed without cancelling (subscription billing failed). Users in `failed` status have a payment method issue. These are your highest-priority follow-ups.

### Finding high-value members

Sort or filter by tier name to see who is on your premium tier. These members represent your most committed audience — they are worth knowing by name.

---

## Pagination

Large member lists are paginated at 25 per page. Use the pagination controls at the bottom of the table to navigate. The current page, total count, and total pages are shown.

---

## What's Next

You can read your community. In the next lesson we look at the actions you can take — managing members, adjusting roles, handling blocked accounts, and communicating with your club.

## The Dashboard Is Not Metrics

Traditional platforms optimize for engagement metrics: daily actives, session length, pageviews. The community dashboard optimizes for membership health: who is paying, who lapsed, who is blocked. That is a fundamentally different signal. It measures whether your community is working, not whether people are addicted to scrolling.
