# daily-work

## Deploy to Cloudflare Workers

This project uses the OpenNext Cloudflare adapter to run the Next.js app on Workers.

1. Install dependencies with `pnpm install`.
2. Before deploying schema changes, apply `drizzle/0011_separate_bonus_calculation_settings.sql`, `drizzle/0012_special_day_bonus.sql`, `drizzle/0013_remark_based_bonus_rates.sql`, `drizzle/0014_record_day_type.sql`, `drizzle/0015_salary_settings_per_currency.sql`, and `drizzle/0016_bonus_exchange_rate.sql` to the target database in order, then run `pnpm db:push` to sync the schema.
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

## Deploy a static frontend to Cloudflare Pages

The Pages project serves a static Next.js export. Pages Functions proxy API requests and dynamic note pages to the existing `daily-work` Worker, which continues to handle authentication, database access, and server rendering for note details.

1. Keep `WORKER_API_ORIGIN` in `cloudflare-pages/wrangler.jsonc` pointed at the backend Worker URL.
2. Create the Pages project once:

   ```bash
   pnpm exec wrangler pages project create dailywork-one --production-branch main
   ```

3. Build and deploy the frontend:

   ```bash
   pnpm pages:deploy
   ```

   The production site is available at `https://dailywork-one.pages.dev`.

The existing `pnpm deploy` command continues to deploy the full-stack Worker independently.
