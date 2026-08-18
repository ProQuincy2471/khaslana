#!/usr/bin/env bash
# Khaslana — Cloudflare Pages, as the real front door.
#
# The GitHub Pages URL is public: anyone with the link sees the app shell
# (the password screen only hides it visually, never removes it from the
# page source — open dev tools and it's all sitting right there). Access
# is what actually stops a request before Khaslana's own code ever runs.
# Access can only sit in front of a domain Cloudflare controls, which
# means the app has to be served from Cloudflare Pages, not github.io.
#
# Run this ONCE, after `npx wrangler login` has actually succeeded
# (check with `npx wrangler whoami` — it should print your account, not
# "You are not authenticated"). It does everything that's plain CLI work:
# creates the Pages project and deploys once by hand, so there's
# something live immediately instead of waiting on the first GitHub
# Actions run.
#
# What it does NOT do, because it isn't CLI work: the Access policy
# itself (Zero Trust dashboard — worth clicking through yourself rather
# than set blind), and the two GitHub secrets the auto-deploy workflow
# needs (also printed at the end, with the exact commands).

set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT="khaslana"
REPO="ProQuincy2471/khaslana"

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
echo "── first deploy ────────────────────────────────────────────"
npx wrangler pages deploy . --project-name="$PROJECT" --branch=main

echo ""
echo "── done with what CLI can do ───────────────────────────────"
echo "Still needed, by hand, in the dashboard:"
echo ""
echo "1. Zero Trust → Access → Applications → Add an application →"
echo "   Self-hosted → the *.pages.dev domain printed above → a policy"
echo "   allowing only your email → login method: One-time PIN."
echo ""
echo "2. So every future 'git push' redeploys on its own instead of"
echo "   running this script's last step by hand each time:"
echo "     - Cloudflare dashboard → My Profile → API Tokens → Create Token"
echo "       → 'Edit Cloudflare Workers' template (covers Pages) → scope"
echo "       it to this account."
echo "     - gh secret set CLOUDFLARE_API_TOKEN --repo $REPO"
echo "     - gh secret set CLOUDFLARE_ACCOUNT_ID --repo $REPO"
echo "       (the account id is in the Cloudflare dashboard's right sidebar,"
echo "       or from: npx wrangler whoami)"
