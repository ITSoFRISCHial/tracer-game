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

### Cutover log (2026-11-17)

- Worker `tracer-game` (tag `39a790ca7087456ea00f7e6b2934e48f`) created; Workers Builds connected to `ITSoFRISCHial/tracer-game`, branch `main`.
- PR #1 merged as `11838ef`; native production build succeeded.
- `tracer.jeremyfrisch.org`: Vercel CNAME (`17a3d1d2f00df96c.vercel-dns-017.com`) replaced by a Cloudflare Worker Custom Domain.
- **Still to do by hand:** remove the Vercel project/Git integration (`tracer-game` on Vercel) so it stops building PRs. Vercel access was not available from this session.
