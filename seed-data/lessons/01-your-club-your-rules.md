# Chapter 01: Your Club, Your Rules

---

Before hyperlocal existed, there was the BBS. Text-mode, dial-up, 2400 baud — and somehow more *community* than anything that came after. The sysop was a real person with a real name. You knew everyone in the member list. Access was earned by reputation or application. Content didn't vanish into an algorithm — it stayed, accumulated, became the living record of a group of people who gave a damn about something.

Then the web happened, and the internet got enormous. Somewhere between Friendster and TikTok we traded ownership for scale, permanence for virality, and community for audience. The BBS sysop became a "content creator." The community became a "fanbase." The platform took 30%.

Hyperlocal exists to undo some of that. It is a self-hosted platform that lets you run a private, paid-access community on your own domain — with no algorithm deciding what your members see, no platform taking a cut of your revenue, and no CEO who can change the terms of service on a Tuesday morning.

---

## What Hyperlocal Actually Is

Hyperlocal is a web application — Next.js on the frontend, KeystoneJS as the data engine, PostgreSQL for storage. You self-host it on a VPS or cloud VM. The platform gives you everything a modern private club needs:

- **Member authentication** — email/password login and Web3 wallet sign-in
- **Membership tiers** — free entry, paid one-time purchases, and recurring subscriptions
- **Content management** — courses with chapters and lessons, dynamic pages, file attachments
- **Content gating** — tier-based URL access control using configurable patterns
- **Payment processing** — Stripe for card payments, ETH on Base network for crypto
- **Community management** — admin dashboard with member stats, search, filters, and MRR tracking
- **Theming** — a visual theme editor (Theme Forge) with custom colors, fonts, and WCAG scoring

What it is **not**: a social network. There is no feed, no likes, no engagement loop designed to maximize time-on-site. Hyperlocal is closer to a newsletter platform or a BBS than to Twitter or Discord. Members come for the content and the community — not the scroll.

> **Aside:** The earliest successful private internet communities operated on a simple principle — members paid because the alternative was a worse experience. Quality of community, not scale, is what makes a private club worth joining. Hyperlocal is infrastructure for that principle.

---

## Who This Course Is For

You are probably a writer, educator, developer, or community builder who wants to:

- Monetize knowledge without going through Substack, Patreon, or Teachable
- Own your member data completely — no platform can deplatform you
- Run a tight-knit community with real access control, not just a Discord with a Patreon role
- Offer your audience something with a URL you control, not an invite link to someone else's platform

Technical comfort helps but is not required to follow this course. We will use Docker, environment variables, and a domain registrar — tools that have clear documentation and a right answer at each step. This is an admin and operations course, not a programming course.

---

## The Economics of a Private Club

Let's talk about why this model works financially.

A public creator with 100,000 followers on a platform earns through ads, brand deals, or platform revenue share — all of which depend on maximizing impressions. The platform benefits from your content and extracts a percentage of whatever monetization they permit.

A private club with 200 paying members at $20/month earns $4,000/month in recurring revenue. Your platform fee is the VPS bill: roughly $20–50/month on a modest server. No algorithmic distribution to optimize for. No brand-safe content requirements. No policy change that demonetizes your account overnight.

The math changes completely when you own the platform.

> **Note:** Hyperlocal is not a get-rich-quick tool. A successful private club requires a real community, content worth paying for, and consistent effort to grow and retain members. The platform removes the *infrastructure* obstacle. The community is still your job.

---

## What You Will Build in This Course

By the time you finish this course, you will have:

1. A running instance of hyperlocal on your own domain with HTTPS
2. A Settings configuration with your site name, branding, and metadata
3. Membership tiers — at minimum a free entry tier and one paid tier
4. Course content with chapters and lessons gated behind membership
5. A working Stripe integration for card payments
6. A visual theme that looks like your community, not a generic template
7. A production-ready launch checklist you can actually use on day one

Each lesson builds directly on the last. You will not need to write code. Everything in this course happens through the admin UI, environment configuration, and your domain registrar.

## Let's Begin

The next lesson covers deployment: getting a VPS provisioned, Docker running, and your domain pointed at your new instance. Set aside about 45 minutes.
