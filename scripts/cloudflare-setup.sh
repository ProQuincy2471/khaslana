#!/usr/bin/env bash
# Khaslana — one-shot Cloudflare setup.
#
# Run this ONCE, after `npx wrangler login` has actually succeeded
# (check with `npx wrangler whoami` — it should print your account, not
# "You are not authenticated"). It does everything that's just CLI work:
# creates the Pages project, creates the KV namespace, wires the KV id
# into wrangler.toml, sets ALLOWED_EMAIL as a Pages secret, and deploys
# once by hand so there's something live immediately instead of waiting
# on the first GitHub Actions run.
#
# What it does NOT do, because these aren't CLI operations: the
# Cloudflare Access policy (Zero Trust dashboard — this is the actual
# login gate, worth clicking through yourself rather than having it set
# blind), and adding CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID as
# GitHub secrets for the auto-deploy workflow (also printed at the end).

set -euo pipefail
cd "$(dirname "$0")/.."

ALLOWED_EMAIL="${ALLOWED_EMAIL:-jordanzamora2471@gmail.com}"
PROJECT="khaslana"
KV_NAME="khaslana-state"

echo "── checking login ──────────────────────────────────────────"
WHOAMI=$(npx wrangler whoami 2>&1)
echo "$WHOAMI"
if echo "$WHOAMI" | grep -qi "not authenticated"; then
  echo ""
  echo "Not logged in yet. Run: npx wrangler login"
  exit 1
fi

echo ""
echo "── Pages project ───────────────────────────────────────────"
npx wrangler pages project create "$PROJECT" --production-branch=main || echo "(already exists — fine)"

echo ""
echo "── KV namespace ────────────────────────────────────────────"
# --update-config writes the id straight into wrangler.toml itself —
# more reliable than scraping the printed id out of terminal output,
# which has changed shape across wrangler versions before.
if grep -q "REPLACE_WITH_YOUR_KV_NAMESPACE_ID" wrangler.toml; then
  npx wrangler kv namespace create "$KV_NAME" --binding=KHASLANA_KV --update-config || {
    echo "If this says the namespace already exists, find its id with:"
    echo "  npx wrangler kv namespace list"
    echo "and paste it into wrangler.toml by hand (replace"
    echo "REPLACE_WITH_YOUR_KV_NAMESPACE_ID), then re-run this script."
    exit 1
  }
  echo "wrangler.toml updated with the real namespace id."
else
  echo "wrangler.toml already has a real KV id — skipping creation."
fi

echo ""
echo "── ALLOWED_EMAIL secret ────────────────────────────────────"
echo "$ALLOWED_EMAIL" | npx wrangler pages secret put ALLOWED_EMAIL --project-name="$PROJECT"

echo ""
echo "── first deploy ────────────────────────────────────────────"
npx wrangler pages deploy . --project-name="$PROJECT" --branch=main

echo ""
echo "── done with what CLI can do ───────────────────────────────"
echo "Still needed, by hand, in the dashboard:"
echo ""
echo "1. Cloudflare Zero Trust → Access → Applications → Add an application"
echo "   → Self-hosted → your Pages domain (printed above, *.pages.dev unless"
echo "   you added a custom one) → policy allowing only: $ALLOWED_EMAIL"
echo "   → login method: One-time PIN."
echo ""
echo "2. For GitHub Actions to auto-deploy on every future push (instead of"
echo "   running this script's last step by hand each time):"
echo "     - Cloudflare dashboard → My Profile → API Tokens → Create Token"
echo "       → 'Edit Cloudflare Workers' template (covers Pages + KV) → scope"
echo "       it to this account."
echo "     - gh secret set CLOUDFLARE_API_TOKEN --repo ENARMINDMK/khaslana"
echo "     - gh secret set CLOUDFLARE_ACCOUNT_ID --repo ENARMINDMK/khaslana"
echo "       (the account id is in the Cloudflare dashboard's right sidebar,"
echo "       or from: npx wrangler whoami)"
