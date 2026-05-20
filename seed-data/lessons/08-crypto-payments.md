# Chapter 08: Crypto Payments

---

Hyperlocal supports direct ETH payments on the Base network as an alternative to Stripe. This lesson explains why that matters, how the crypto payment flow works, and how to configure it.

Crypto payments are optional. If your community has no interest in Web3, skip this lesson and stay with Stripe. But if your members hold ETH, accepting it directly removes a friction point — no card required, no bank required.

---

## Why Base, and Why ETH

Base is a Layer 2 network built on top of Ethereum mainnet, operated by Coinbase. Key properties that make it appropriate for membership payments:

- **Low fees** — transactions cost fractions of a cent, not $5–50 like Ethereum mainnet
- **Fast finality** — blocks every 2 seconds, confirmation in under a minute
- **EVM-compatible** — wallets that work with Ethereum work with Base
- **Stablecoin-accessible** — you can convert received ETH to USDC on-chain or via Coinbase

The alternative — accepting payments in stablecoins directly — is possible but requires more configuration. For a private club, ETH on Base is the pragmatic starting point.

> **Aside:** Accepting crypto payments is not about ideology. It is about reducing friction for a specific audience. If your community has a meaningful overlap with Web3 builders, investors, or enthusiasts, forcing them through a Stripe card flow when they would rather pay in ETH creates unnecessary hesitation.

---

## The Crypto Payment Flow

```
1. Member selects a crypto-payment tier
2. Frontend requests a signed payment quote from /api/v1/memberships/checkout/crypto/quote
   → Response: ETH amount to send, receiver wallet address, HMAC-signed quote token, expiry
3. Member approves the transaction in their Web3 wallet (MetaMask, Coinbase Wallet, etc.)
4. On-chain transaction is broadcast to Base network
5. Member submits the transaction hash to /api/v1/memberships/checkout/crypto/verify
6. Server checks: HMAC valid, not expired, correct amount, ≥ 3 block confirmations, no reuse
7. If valid → membership activated (status: active)
```

The HMAC signature on the quote is what prevents a user from submitting a fake transaction hash — the quote token proves the server agreed to those terms at that moment in time.

---

## Prerequisites

You need:

1. A wallet address to receive payments (your "receiver wallet")
2. An Alchemy API key for Base (for reliable on-chain verification)
3. A WalletConnect project ID (for in-browser wallet connectivity)
4. A HMAC secret for quote signing

---

## Setting Up a Receiver Wallet

> **Action:** Create or designate a wallet to receive membership payments. This can be a hardware wallet (Ledger, Trezor), a Coinbase account address, or any EVM-compatible wallet you control.

> **Note:** Do not use a hot wallet (software wallet on your server) as the receiver. Use a wallet where you control the private key independently — ideally a hardware wallet for any real volume.

Copy the public address of your receiver wallet. You will store it in the `receiverWalletAddress` field in Settings.

> **Action:** In the Keystone admin UI, open **Settings** → set `receiverWalletAddress` to your wallet address.

---

## Alchemy API Key

Alchemy provides enhanced RPC access to Base, required for reliable block confirmation checking.

> **Action:** Create a free account at [alchemy.com](https://alchemy.com). Create a new app targeting **Base Mainnet** (and optionally **Base Sepolia** for testing). Copy the API key.

```bash .env (additions)
ALCHEMY_BASE_KEY=your_alchemy_base_mainnet_key
ALCHEMY_BASE_SEPOLIA_KEY=your_alchemy_base_sepolia_key
```

---

## WalletConnect Project ID

WalletConnect (now Reown) powers the wallet connection UI — the modal that lets members connect MetaMask, Coinbase Wallet, or any other EVM wallet.

> **Action:** Create an account at [reown.com](https://reown.com) (formerly WalletConnect Cloud). Create a project. Copy the Project ID.

Unlike most environment variables, this one is served to the browser at runtime via the `/api/v1/config/client` endpoint — not as a `NEXT_PUBLIC_` variable.

```bash .env (additions)
WALLETCONNECT_PROJECT_ID=your_project_id
```

---

## HMAC Quote Secret

The quote HMAC secret signs the payment quote so the server can verify it has not been tampered with.

> **Action:** Generate a 32+ character random secret:

```bash
openssl rand -base64 32
```

```bash .env (additions)
CRYPTO_QUOTE_HMAC_SECRET=your_generated_secret
```

---

## Testing with Base Sepolia

Before accepting real money, test on Base Sepolia — Base's public testnet.

> **Action:** In `.env`, set:

```bash .env
ENABLE_TESTNETS=true
```

With this flag set, the crypto payment flow targets Base Sepolia instead of Base mainnet. Get test ETH from [sepolia.base.org](https://sepolia.base.org) faucet (free) and run through a complete test payment.

Verify the payment flow end-to-end:

1. Connect a wallet in your browser to the site
2. Select a tier with `paymentType: one_time` or a crypto-specific tier
3. Complete the transaction on Base Sepolia
4. Confirm membership activates in the admin UI

When satisfied, set `ENABLE_TESTNETS=false` and configure `ALCHEMY_BASE_KEY` for mainnet.

---

## Membership Tier Configuration for Crypto

To make a tier purchasable with crypto, set `paymentType` to `one_time`. The payment flow does not support recurring crypto subscriptions (blockchain does not natively support recurring billing). Crypto-paid access is always a one-time purchase.

Common approach: offer the same content access as your Stripe subscription tier, but at a price that represents 1 year of the subscription value. Members who prefer crypto pay once for annual access; members who prefer cards pay monthly.

---

## Security Notes

**3 block confirmations** — hyperlocal waits for at least 3 confirmed blocks before activating a membership. This prevents activation on transactions that could be reverted.

**Quote expiry** — crypto quotes expire (default: 15 minutes). This prevents a user from requesting a quote when ETH is cheap and submitting it later when they actually send the transaction.

**No double-spend** — the `cryptoTxHash` field on `UserMembership` is unique. The same transaction hash cannot activate two memberships.

---

## What's Next

Payments are fully configured. In the next lesson we look at the community dashboard — reading your member stats, MRR estimate, and using the admin tools to understand how your club is growing.

## Optionality Is the Point

Not every community needs crypto payments. But having the option available means you will never have to turn away a paying member because of how they want to pay. That is the goal.
