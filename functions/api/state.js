/* Khaslana — the sync endpoint.

   One document, one owner. GET returns the last state saved from any
   device; POST replaces it. No user table, no sessions — this app has
   exactly one user, and Cloudflare Access is what decides whether a
   request gets this far at all.

   Belt and suspenders: Access is configured to gate the whole domain,
   but if that policy is ever loosened or misapplied to a specific route,
   this still checks the identity Access stamped on the request against
   ALLOWED_EMAIL before touching the KV store. A request with no Access
   header, or the wrong one, gets a 403 here regardless of what the edge
   policy currently says. */

const KV_KEY = 'khaslana-state';

function authorized(request, env) {
  const email = request.headers.get('Cf-Access-Authenticated-User-Email');
  if (!env.ALLOWED_EMAIL) return true;   // not configured yet — Access alone is the gate
  return email && email.toLowerCase() === env.ALLOWED_EMAIL.toLowerCase();
}

export async function onRequestGet({ request, env }) {
  if (!authorized(request, env)) return new Response('Forbidden', { status: 403 });
  const raw = await env.KHASLANA_KV.get(KV_KEY);
  if (!raw) return new Response(JSON.stringify({ state: null, updatedAt: 0 }), { headers: { 'content-type': 'application/json' } });
  return new Response(raw, { headers: { 'content-type': 'application/json' } });
}

export async function onRequestPost({ request, env }) {
  if (!authorized(request, env)) return new Response('Forbidden', { status: 403 });
  let body;
  try { body = await request.json(); } catch { return new Response('Bad JSON', { status: 400 }); }
  if (!body || typeof body !== 'object' || typeof body.state !== 'object') {
    return new Response('Expected {state, updatedAt}', { status: 400 });
  }
  const payload = JSON.stringify({ state: body.state, updatedAt: body.updatedAt || Date.now() });
  await env.KHASLANA_KV.put(KV_KEY, payload);
  return new Response(payload, { headers: { 'content-type': 'application/json' } });
}
