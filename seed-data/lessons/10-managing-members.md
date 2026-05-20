# Chapter 10: Managing Your Members

---

A private club requires active curation. Unlike public platforms where moderation is reactive, a private community with real access controls gives you proactive tools — you can promote trusted members, block bad actors, manually adjust membership status, and manage the member lifecycle from enrollment to cancellation.

This lesson covers the day-to-day admin operations that keep your club healthy.

---

## Member Roles

Every user in hyperlocal has one of two roles: **Member** or **Admin**.

| Role | What they can do |
|---|---|
| Member | Access content permitted by their tier. View their own profile and settings. Manage their own membership. |
| Admin | Everything a member can do, plus: access `/admin` panel, create and edit content, manage other users, view community dashboard, configure settings. |

> **Note:** Admin status is an all-or-nothing flag (`isAdmin: true`). There is no partial admin role (e.g., "content editor only"). If you add a co-admin, they will have full administrative access. Only grant admin status to people you fully trust.

### Promoting a Member to Admin

> **Action:** In the Keystone admin UI, navigate to **Users** → find the user → set `isAdmin: true` → Save.

Alternatively, from the Next.js admin panel: `/admin/users/{id}/edit` → toggle the Admin switch → Save.

---

## The Member Lifecycle

Every membership follows a predictable state machine:

```
Created account
     ↓
No membership → directed to /get-access
     ↓
Checkout initiated → status: pending
     ↓
Payment confirmed (webhook) → status: active
     ↓
Either:
  - Subscription renews → stays active
  - Payment fails → status: failed
  - Admin cancels → status: expired
  - Member cancels (Stripe) → status: expired on next billing cycle
  - Admin blocks → status: blocked
```

Understanding this flow helps you diagnose problems quickly. A user who "paid but can't access anything" is almost always stuck in `pending` because a webhook failed.

---

## Manually Adjusting Membership Status

There are legitimate reasons to manually change a membership status:

- Webhook failed and a payment that processed did not activate the membership
- You want to give a free trial to a specific person
- A member needs a courtesy extension past their expiry date
- You need to block a member for conduct reasons

> **Action:** Keystone admin UI → **User Memberships** → find the record → change `status` field → Save.

Be deliberate with manual `active` grants — you are bypassing the payment system. Document why you did it (a note in Keystone's admin, or a spreadsheet) so future-you understands the data.

---

## Blocking a Member

Blocking sets a membership status to `blocked`. The user can still log in, but all gated content returns the gate page.

Use blocking for:
- Members who violate community standards
- Accounts you suspect are fraudulent
- Test accounts you want to deactivate without deletion

> **Action:** Admin UI → **User Memberships** → find the record → set `status: blocked` → Save.

A blocked user can still see the public (published) content but will see the gate on any membership content. They will not receive an explicit "you are blocked" message — they simply cannot access gated URLs. Adjust this UX in the frontend source if you want explicit communication.

---

## Cancelling a Membership

### Stripe-billed memberships

Members can cancel their own subscription via the `/settings` page, which redirects to the Stripe customer billing portal. When they cancel:

1. Stripe immediately cancels the subscription
2. A `customer.subscription.deleted` webhook fires
3. Hyperlocal sets the membership `status` to `expired`
4. The member loses access to gated content

Cancellation is immediate (not at end of billing period) in the default configuration. To offer "cancel at end of period" — a better member experience — modify the Stripe subscription cancellation settings in your Stripe dashboard and adjust the webhook handler accordingly.

### Manually-granted memberships

For memberships that were granted manually (free, admin-set), set `status: expired` and optionally set `expiresAt` to the desired end date.

---

## Editing User Profiles

Sometimes you need to update a user's information — correct a typo in their nickname, update their email address, or upload a replacement avatar.

> **Action:** Next.js admin panel → `/admin/users/{id}/edit` — this page exposes the user edit form with fields for name, email, role, and profile data.

For profile images, use the Keystone admin UI's Profile Image UI to upload a replacement via Cloudinary.

---

## Deleting a User

User deletion is permanent and cascades through related records. Be certain before you proceed.

> **Action:** Next.js admin panel → `/admin/users` → open user detail drawer → **Delete User** button. Confirm in the dialog.

This deletes the User, their Profile, any UserMembership records, and their course enrollment and progress data. It does not delete Stripe customer records — you may want to cancel their Stripe subscription manually first.

> **Note:** Under GDPR and similar data privacy regulations, you are required to delete user data upon request. The delete user flow covers your hyperlocal database. You are separately responsible for any data in Stripe (customer records, payment history) and Cloudinary (profile images).

---

## User Stats at a Glance

The `/admin/users/{id}/edit` page includes a stats sidebar with:

- Account creation date
- Membership tier and status
- Total course enrollments
- Number of completed lessons

This is useful context when responding to support requests — you can quickly see if someone is an active learner or has never logged in after signing up.

---

## What's Next

You know how to manage your members. In the next lesson we look at branding — using Theme Forge to make your club look distinctly like yours.

## Curation Is Your Job

The access controls are infrastructure. The actual culture of your community is shaped by the members you promote, the members you remove, and the norms you establish in your content. No software does that for you. The dashboard and management tools make it possible to act quickly and deliberately. What you do with them is entirely up to you.
