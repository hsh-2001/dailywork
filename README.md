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

   For Firebase email-link sign-in, set `FIREBASE_API_KEY` as a runtime secret on the backend Worker that serves `WORKER_API_ORIGIN` (`daily-work.senghong-learning.workers.dev` in this repo). The Pages build needs all four `NEXT_PUBLIC_FIREBASE_*` values to build the frontend. Enable Email/Password and Email link (passwordless sign-in) in Firebase Authentication. Email links verify the address as part of sign-in. Existing local accounts can sign in with the same verified email and keep their existing Daily Work records. `.env` is local only; configure production values in Cloudflare. The `pnpm deploy` command passes `--keep-vars` so dashboard-configured Worker variables survive redeploys.

   Configure `API_CENTER`, `TELEGRAM_CHAT_ID`, and `TELEGRAM_API_TOKEN` as Worker secrets if the Telegram integration is used.
5. Build and run the Worker locally with `pnpm preview`.
6. Deploy with `pnpm deploy`.

The backend Worker name and runtime settings are in `wrangler.jsonc`; it is named `daily-work` to match the Pages proxy origin. Add a custom domain in the Cloudflare dashboard or configure a `workers_dev`/route entry in that file.

Cloudflare's OpenNext adapter supports the app's Neon PostgreSQL connection through the serverless driver.

## Deploy a static frontend to Cloudflare Pages

The Pages project serves a static Next.js export. Pages Functions proxy API requests and direct dynamic note URLs to the Worker configured by `WORKER_API_ORIGIN` in `cloudflare-pages/wrangler.jsonc`. In-app detail and edit navigation uses statically generated routes with the note ID in the query string, because a static export cannot generate unknown note IDs.

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
