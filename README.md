# daily-work

## Deploy to Cloudflare Workers

This project uses the OpenNext Cloudflare adapter to run the Next.js app on Workers.

1. Install dependencies with `pnpm install`.
2. Before deploying schema changes, run `pnpm db:push` against the target database. This creates the per-user salary settings table used by the Salary & tax settings page.
3. For local Worker preview, keep `NEXTJS_ENV=development` in `.dev.vars`. Local secrets and application variables belong in `.env` (already gitignored).
4. Set production secrets before the first deploy:

   ```bash
   pnpm wrangler secret put DATABASE_URL
   pnpm wrangler secret put JWT_SECRET
   ```

   Add `TELEGRAM_CHAT_ID` and `TELEGRAM_API_TOKEN` as Worker secrets if the Telegram integration is used.
5. Build and run the Worker locally with `pnpm preview`.
6. Deploy with `pnpm deploy`.

The Worker name and runtime settings are in `wrangler.jsonc`; update `name` if deploying under a different Worker name. Add a custom domain in the Cloudflare dashboard or configure a `workers_dev`/route entry in that file.

Cloudflare's OpenNext adapter supports the app's Neon PostgreSQL connection through the serverless driver.
