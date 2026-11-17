# Deployment

The app is a static Next.js export (`output: "export"` in `next.config.ts`) served by
**Cloudflare Workers static assets**. It was previously hosted on Vercel; Vercel is no
longer used (see "Migration notes").

## How it is wired

- `wrangler.jsonc` – Worker name `tracer-game`, serves `./out` as static assets.
- Cloudflare Workers Builds is connected to the GitHub repo `ITSoFRISCHial/tracer-game`:
  every push to `main` builds (`npm run build`) and deploys to production; pull requests get
  preview builds.
- Production hostname: `tracer.jeremyfrisch.org` (Cloudflare custom domain).

## Day to day

Merge to `main`; Cloudflare builds and deploys. Check status with:

```bash
~/.local/bin/deploy-cloudflare status
~/.local/bin/deploy-cloudflare logs
```

Manual deploy from a laptop (needs `wrangler login`): `npm run build && npx wrangler deploy`.

## Limits

No server code. Adding route handlers, middleware or ISR means switching from static export
to an adapter (vinext or OpenNext) – update `next.config.ts` and this file.

## Migration notes

Vercel → Cloudflare. Details of the actual cutover (IDs, DNS) are recorded below.
