# Chapter 07: Stripe Payments

---

Revenue is what keeps the lights on. This lesson walks through connecting Stripe to your hyperlocal instance — getting API keys, configuring webhooks, and verifying that a subscription or one-time purchase actually activates a membership.

If you skipped setting up paid tiers in Lesson 4, do that first. Stripe needs existing tiers to sync products against.

---

## How the Stripe Integration Works

Hyperlocal uses Stripe in two flows:

**Subscription flow** — for `subscription` payment type tiers:
1. Member clicks "Subscribe" → hyperlocal creates a Stripe Checkout session
2. Member completes payment on Stripe-hosted checkout page
3. Stripe redirects back to your site with a session ID
4. Your `/api/v1/memberships/checkout/stripe/verify` endpoint confirms the session and sets membership `status: pending`
5. Stripe fires a `checkout.session.completed` webhook
6. Your webhook handler at `/api/v1/memberships/webhooks/stripe` receives it and sets `status: active`

**One-time payment flow** — for `one_time` payment type tiers — identical to the subscription flow, but Stripe creates a one-time payment intent instead of a recurring subscription object.

> **Aside:** The two-step confirm → webhook approach is intentional. The redirect back from Stripe can be intercepted or faked by a clever user. The webhook comes directly from Stripe's servers and is signed — it is the authoritative signal that money actually changed hands. Memberships only go `active` on the webhook, not the redirect.

---

## Creating a Stripe Account

> **Action:** Go to [stripe.com](https://stripe.com) and create an account if you do not have one. Verify your email. Complete the business identity section if you plan to accept live payments.

For testing, Stripe does not require full business verification. You can start in test mode immediately.

---

## Getting Your API Keys

> **Action:** In the Stripe dashboard, navigate to **Developers** → **API Keys**.

You need three values:

| Key | Location in Stripe | Environment variable |
|---|---|---|
| Secret key | Starts with `sk_test_` (test) or `sk_live_` | `STRIPE_SECRET_KEY` |
| Publishable key | Starts with `pk_test_` (test) or `pk_live_` | `STRIPE_PUBLISHABLE_KEY` |
| Webhook signing secret | Created when you add a webhook endpoint | `STRIPE_WEBHOOK_SECRET` |

> **Note:** Never commit API keys to a git repository. Store them only in your `.env` file. The `.gitignore` already excludes `.env`.

Add the secret and publishable keys to your `.env`:

```bash .env (additions)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

Restart your application after editing `.env`:

```bash
docker compose restart
```

---

## Syncing Tiers to Stripe Products

When hyperlocal starts with `STRIPE_SECRET_KEY` set, open any paid `MembershipTier` record in the Keystone admin UI and click **Save** (even without changes). The `afterOperation` hook will fire, create a Stripe product and price for that tier, and store the Stripe product and price IDs back on the tier record.

You should see `stripeProductId` and `stripePriceId` fields populated on the tier after the save.

> **Action:** In the admin UI, open each paid membership tier. Click Save. Verify that `stripeProductId` and `stripePriceId` are now filled in. In the Stripe dashboard under **Products**, you should see matching entries.

---

## Configuring the Webhook

Stripe needs a URL to notify when payments complete. You will register a webhook endpoint that points to your server.

> **Action:** In the Stripe dashboard, navigate to **Developers** → **Webhooks** → **Add Endpoint**.

- **Endpoint URL**: `https://yourclub.com/api/v1/memberships/webhooks/stripe`
- **Events to listen for**: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

After creating the webhook, click it to reveal the **Signing secret** — a value starting with `whsec_`. Add it to your `.env`:

```bash .env (additions)
STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret
```

Restart the application.

---

## Testing with the Stripe CLI

The Stripe CLI lets you forward real Stripe webhook events to your local development server — essential for testing without a public domain.

```bash
# Install Stripe CLI (macOS)
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to your local dev server
stripe listen --forward-to localhost:7777/api/v1/memberships/webhooks/stripe
```

The CLI prints a temporary webhook signing secret for local testing. Use this in your local `.env` (not production).

> **Action:** With the Stripe CLI listening, trigger a test checkout. Use Stripe's test card number `4242 4242 4242 4242` with any future expiry date and any CVC. The CLI will show webhook events arriving in real time.

---

## Test Membership Flow End-to-End

1. Log in as a non-admin test user (or create a fresh account)
2. Navigate to `/get-access` — your membership pricing page
3. Click a paid tier's subscribe button
4. Complete checkout with the Stripe test card
5. Verify you are redirected back to the dashboard with a success message
6. Confirm the membership shows `status: active` in the admin UI under **User Memberships**

If the webhook fires correctly, `status` moves from `pending` to `active` within seconds of the redirect.

---

## Going Live

When you are ready for real payments:

1. Complete Stripe business verification in the dashboard
2. Replace `sk_test_` / `pk_test_` keys with `sk_live_` / `pk_live_` in `.env`
3. Create a new live-mode webhook endpoint (separate from the test endpoint)
4. Replace `STRIPE_WEBHOOK_SECRET` with the live webhook signing secret
5. Restart the application

> **Note:** Stripe test-mode and live-mode are completely separate environments. Test data (customers, subscriptions, products) does not transfer to live mode. You will need to re-sync your tiers to Stripe in live mode.

---

## What's Next

Card payments are live. The next lesson adds crypto payment support via ETH on the Base network — an optional but powerful addition for Web3-friendly communities.

## Revenue Is Infrastructure

Stripe is not glamorous. It is plumbing. But plumbing that works reliably means you can focus on your community instead of chasing failed payments and manual refunds. Get the plumbing right, then forget about it.
