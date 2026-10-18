# daily-work

## Deploy to Cloudflare Workers

This project uses the OpenNext Cloudflare adapter to run the Next.js app on Workers.

1. Install dependencies with `pnpm install`.
2. For local Worker preview, keep `NEXTJS_ENV=development` in `.dev.vars`. Local secrets and application variables belong in `.env` (already gitignored).
3. Set production secrets before the first deploy:

   ```bash
   pnpm wrangler secret put DATABASE_URL
   pnpm wrangler secret put JWT_SECRET
   ```

   Add `TELEGRAM_CHAT_ID`, `TELEGRAM_API_TOKEN`, and `REDIS_URL` as Worker secrets if those integrations are used.
4. Build and run the Worker locally with `pnpm preview`.
5. Deploy with `pnpm deploy`.

The Worker name and runtime settings are in `wrangler.jsonc`; update `name` if deploying under a different Worker name. Add a custom domain in the Cloudflare dashboard or configure a `workers_dev`/route entry in that file.

Cloudflare's OpenNext adapter supports the app's Neon PostgreSQL connection through the serverless driver. The optional Redis cache uses `ioredis`; validate that integration in Worker preview and use a Workers-compatible Redis client/service if it cannot connect from the Worker runtime.
