# Chapter 02: Deploy Your Instance

---

Before there is a community, there is a server. This lesson walks from an empty VPS to a running hyperlocal instance — DNS pointed, HTTPS live, admin UI reachable. By the end you will have a URL you can type into a browser and get a real response from software you control.

We will use Docker. You do not need to understand Docker deeply — you need to know how to copy a file and run a command. Everything else is provided.

---

## Choose Your Host

Any Linux VPS will work. Recommended providers and their entry-tier specs:

| Provider | Machine | RAM | Cost/mo |
|---|---|---|---|
| Hetzner Cloud | CX22 | 4 GB | ~$5 |
| DigitalOcean | Basic Droplet | 2 GB | $12 |
| Fly.io | shared-cpu-1x | 256 MB | Pay-as-you-go |
| Vultr | Cloud Compute | 2 GB | $12 |

For a club with under 1,000 members, 2 GB RAM is sufficient. Hetzner is the best price-to-performance option if you do not have a preference.

> **Note:** PostgreSQL and the Next.js process both run on the same machine in this setup. If you expect heavy traffic, consider a managed database (Neon, Supabase, or RDS) and a larger VM. For most private clubs, the single-server setup is fine.

> **Action:** Provision a Ubuntu 22.04 or 24.04 LTS server. Enable SSH key authentication. Note the public IP address.

---

## Install Docker

SSH into your server and run:

```bash server setup
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for group membership to take effect
```

Verify the install:

```bash
docker --version
docker compose version
```

---

## Clone the Repository

```bash
git clone https://github.com/yourorg/hyperlocal.git /opt/hyperlocal
cd /opt/hyperlocal
```

> **Action:** If you received hyperlocal as a zip archive rather than a git repo, unzip it to `/opt/hyperlocal`.

---

## Configure Environment Variables

Copy the sample environment file and fill in your values:

```bash
cp env.sample .env
```

Open `.env` in your editor. The essential fields for a first deployment:

```bash .env
# Server
PORT=3333

# Database — use your VPS IP or a managed DB host
DATABASE_URL=postgresql://hyperlocal:yourpassword@localhost:5432/hyperlocal

# Session security — generate with: openssl rand -base64 32
AUTH_SESSION_NAME=hl_session
AUTH_SESSION_SECRET=<32-char-minimum-random-string>
AUTH_SESSION_EXPIRES=86400

# Cloudinary — required for image uploads
CLOUDINARY_CLOUD=your-cloud-name
CLOUDINARY_APIKEY=your-api-key
CLOUDINARY_SECRET=your-api-secret
CLOUDINARY_PROJECT=hyperlocal
```

Leave Stripe and crypto fields blank for now — we will configure those in later lessons.

> **Note:** The `AUTH_SESSION_SECRET` must be at least 32 characters. Use `openssl rand -base64 32` on any Unix machine to generate a safe value. Do not use a dictionary word.

---

## Set Up PostgreSQL

If you are running PostgreSQL locally on the VPS:

```bash
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql -c "CREATE USER hyperlocal WITH PASSWORD 'yourpassword';"
sudo -u postgres psql -c "CREATE DATABASE hyperlocal OWNER hyperlocal;"
```

Verify:

```bash
psql postgresql://hyperlocal:yourpassword@localhost:5432/hyperlocal -c "\l"
```

---

## Build and Run

```bash
docker compose up -d
```

This builds the Keystone and Next.js processes and starts both. First build takes 3–5 minutes.

Check status:

```bash
docker compose logs -f
```

You should see:

```
keystone  | ✅  Keystone started on http://localhost:3333
nextjs    | ▲ Next.js ready on http://localhost:7777
```

---

## Set Up a Reverse Proxy with Caddy

Caddy is the simplest way to get HTTPS on a domain. Install it:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudflare.com/cloudflare-pkg/gpg' | sudo apt-key add -
curl -1sLf 'https://dl.cloudflare.com/cloudflare-pkg/ubuntu.deb' | sudo tee /etc/apt/sources.list.d/caddy.list
sudo apt update && sudo apt install -y caddy
```

Create `/etc/caddy/Caddyfile`:

```caddy /etc/caddy/Caddyfile
yourclub.com {
    reverse_proxy localhost:7777
}
```

Restart Caddy:

```bash
sudo systemctl restart caddy
```

Caddy automatically provisions a Let's Encrypt certificate for your domain. HTTPS is live within about 60 seconds.

---

## Point Your Domain

In your domain registrar's DNS settings, create an A record:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | @ | `<your VPS IP>` | 300 |
| A | www | `<your VPS IP>` | 300 |

DNS propagation takes 5–30 minutes depending on your registrar and TTL settings.

> **Action:** Once DNS has propagated, open `https://yourclub.com` in a browser. You should see the hyperlocal landing page — the default homepage before any content is configured.

---

## Seed the Database

Run the seed script to create initial data:

```bash
docker compose exec nextjs pnpm db:seed
```

This will ask for confirmation before wiping any existing data, then populate the database with default settings, membership tiers, and example content.

> **Note:** The seed script creates a default admin user (`admin@example.com` / `Admin1234!`). Change this password immediately after your first login.

---

## What's Next

Your instance is running. In the next lesson we will log in to the admin UI, configure your site identity, and set the metadata that search engines and social platforms will read when someone links to your community.

## Your Instance Is Live

You have a running hyperlocal installation at a URL you control. The VPS is yours. The database is yours. The member data that accumulates there will always be yours. That is the foundation everything else builds on.
