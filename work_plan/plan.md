# Site Error Analysis and Execution Plan

## Observations
- Initial production build failed with `vite: not found`, indicating missing/incomplete dependencies.
- `node_modules` existed but `.bin` was missing until a full install completed.
- After completing `npm i`, the production build succeeded.

## Likely Root Cause
- Dependency installation was incomplete, so the Vite binary was not available when `npm run build` executed.

## Plan
1. Ensure dependencies are fully installed (`npm i`).
2. Verify Vite binary exists in `node_modules/.bin`.
3. Run a production build (`npm run build`) to confirm the site bundles.
4. If runtime errors persist in the deployed site, inspect frontend console/network for failing requests and match to Supabase Edge Function routes.
5. Validate Supabase Edge Function environment variables and CORS/auth headers (common production failure points).

## Execution Log
- Ran `npm i` to complete dependency installation.
- Verified `node_modules/.bin/vite` exists.
- Ran `npm run build` successfully (bundle produced).
- Reviewed Edge Function routing and CORS/auth middleware in `supabase/functions/server/index.tsx`.
- Noted CORS allows `*` with credentials true and expects auth headers (`Authorization`, `X-Access-Token`, `X-User-Token`).
- Enumerated required Edge Function env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, `HUGGINGFACE_API_KEY`, `REPLICATE_API_KEY`, `LOGO_PROVIDER`.
- Deployed runtime console/network checks pending due to no deployed URL context in repo.
- Re-ran `npm run build`; production bundle succeeded (chunk size warning noted).
- Re-ran `npm run build` again for final verification; same chunk size warning persists.
- Investigated deployment hints across repo; no frontend deployment URL/hosting config found in tracked project files.
- Traced API wiring and found mixed Edge Function IDs (`make-server-98397747` and `make-server-45024be7`) and a hardcoded Supabase project URL in `src/app/services/digitalCardApi.ts`.
- Updated `src/app/services/digitalCardApi.ts` to use shared `projectId` from `utils/supabase/info` instead of hardcoded project host.
- Kept digital-card and prompt/public-profile routes on `make-server-45024be7` after runtime probe confirmed that slug is currently reachable in production.
- Updated CORS allow headers in `supabase/functions/server/index.tsx` to include `apikey` and `x-client-info` to align with Supabase client preflight behavior.
- Added compatibility route aliases in `supabase/functions/server/index.tsx` for `/make-server-45024be7` and `/make-server-45024be7/api/digital-card`.
- Runtime probe results (with anon key headers): `.../functions/v1/make-server-45024be7/health` -> `200`, `.../functions/v1/make-server-98397747/health` -> `404`.
- Ran `npm run build` after endpoint/CORS/route updates; build succeeded (chunk size warning unchanged).
- Ran final `npm run build` after all endpoint alignment updates; build succeeded (chunk size warning unchanged).

## KV -> DB Migration Plan (Phased)
1. Lock active runtime path to one Edge Function slug and stop split-brain behavior (`45024be7` vs `98397747`).
2. Migrate critical state first (credits/package) from KV keys into `user_credits` with idempotent backfill.
3. Convert read/write endpoints for credits/package to Postgres-only and remove KV read fallback.
4. Migrate entity data in order: companies/contacts -> logos/naming metadata -> digital profiles/cards.
5. Add reconciliation checks (row counts + spot checks per user) after each phase.
6. Freeze new writes to `kv_store_45024be7` once endpoint parity is confirmed.
7. Keep KV read-only rollback window, then decommission KV routes/helpers.

## Migration Progress Log
- Confirmed deployed function split: `make-server-45024be7` and `make-server-98397747` both active.
- Confirmed runtime traffic currently hits `make-server-45024be7` for health checks.
- Confirmed deployed code still imports and uses `kv_store.tsx` on active slugs (mixed KV/DB behavior remains).
- Profiled current KV key distribution (`kv_store_45024be7`): credits(1), package(1), naming(2), logo(4), company(1), contact(1), digital-profile(0).
- Applied DB migration `kv_to_db_phase1_backfill_user_credits` (idempotent) to normalize/backfill credits-package state from KV patterns into `user_credits`.
- Applied follow-up DB migration `kv_to_db_phase1b_backfill_user_prefix_keys` for legacy key format `user:{uuid}:{credits|package}`.
- Verified `user_credits` now has normalized `package_id` (`premium` without extra quotes) and updated timestamp.
- Verified KV vs DB parity for existing `user:{uuid}:credits/package` keys (`237000` / `premium` matched in `user_credits`).
- Re-ran `npm run build` after migration/planning updates; build succeeded (chunk size warning unchanged).

## Next Execution Steps (In Progress)
1. Deploy a single canonical function path and remove split runtime writes (currently most impactful blocker).
2. Convert active runtime endpoints for `api/user/package` and remaining credit-touching branches to Postgres-only (remove `kv.get/kv.set` for these paths).
3. Add a temporary write-audit query (or logging marker) to detect any new writes to `kv_store_45024be7` after cutover.
4. Migrate non-critical entities in sequence: contacts/companies -> naming/logo metadata -> digital-profile/card artifacts.

## Canonical Cutover Progress
- Switched frontend canonical function slug back to `make-server-98397747` in:
  - `src/app/services/digitalCardApi.ts`
  - `src/app/utils/prompt-engine.ts`
  - `src/app/components/PublicProfile.tsx`
  - `src/app/components/LogoUploader.tsx`
- Deployed updated Edge Function code to `make-server-98397747` (new active version: `21`).
- Runtime verification after deploy:
  - `GET /functions/v1/make-server-98397747/health` -> `200`
  - `GET /functions/v1/make-server-98397747/api/user/credits?userId=...` -> `200` with payload `{ "credits": 237000, "package": "premium" }`
- Re-ran `npm run build`; build succeeded (chunk size warning unchanged).

## KV Write Monitoring Progress
- Applied DB migration `kv_cutover_monitoring_artifacts` to add:
  - table `kv_migration_audit_snapshots`
  - view `kv_migration_domain_counts`
  - function `capture_kv_migration_snapshot(note)`
- Captured baseline snapshot with note `post-canonical-cutover-baseline`.
- Baseline snapshot result: total_keys(22), credits(1), package(1), naming(2), logo(4), company(1), contact(1), digital_profile(0), card(0), logo_upload(6), other(6).
- Runtime check still shows legacy slug responding:
  - `GET /functions/v1/make-server-45024be7/health` -> `200` (`{"status":"ok"}`)
  - `GET /functions/v1/make-server-45024be7/api/user/credits?...` -> `200` (`{"credits":237000}`)
  - This indicates 450 path remains active and still not fully aligned with canonical payload shape.
- Re-ran `npm run build`; build succeeded (chunk size warning unchanged).

## Next Execution Steps (Updated)
1. Deploy DB-first server bundle to `make-server-45024be7` to eliminate remaining KV-backed runtime branch.
2. After deployment, run snapshot diff with `capture_kv_migration_snapshot('after-450-db-cutover')` and compare against baseline.
3. If `credits/package` domain counts do not grow after traffic tests, proceed to remove KV write calls in legacy deployment path.

## Execution Note
- Attempted delegated automation to mirror `make-server-98397747` bundle into `make-server-45024be7`, but delegate execution did not complete within timeout window in this session.
- Legacy slug verification remains available and tracked; DB monitoring baseline is already in place for immediate post-deploy diff once `45024be7` mirror deploy is executed.

## Legacy Slug Cutover Completion
- Deployed `make-server-45024be7` as a proxy-to-canonical function (new version: `161`) so legacy requests are forwarded to `make-server-98397747` DB-first runtime.
- Proxy behavior verification:
  - `GET /functions/v1/make-server-45024be7/health` -> `200` and canonical-style payload with timestamp.
  - `GET /functions/v1/make-server-45024be7/api/user/credits?...` -> `200` and DB-shape payload `{ "credits": 237000, "package": "premium" }`.
- Captured post-cutover snapshot via `capture_kv_migration_snapshot('after-450-proxy-cutover')`.
- Snapshot comparison (baseline vs post-cutover) showed no growth in KV domain counts (still total_keys=22, credits=1, package=1), indicating no immediate new KV write regression from tested paths.

## Cloudflare GitHub Deploy Config
- Added root `wrangler.jsonc` for Cloudflare Pages + GitHub deployment while preserving existing project structure.
- Config uses Vite output directory `./dist` via `pages_build_output_dir` and sets `compatibility_date`.
- Included commented templates for optional `compatibility_flags` and `vars` without changing current runtime behavior.

## Cloudflare Build Failure Fix (npm ci lock mismatch)
- Investigated Cloudflare log error: `npm clean-install` failed because `package.json` and `package-lock.json` were out of sync.
- Confirmed lock inconsistency symptom: lock references `@csstools/css-parser-algorithms` / `@csstools/css-tokenizer` as dependency constraints but lock install graph was not CI-consistent.
- Regenerated dependency graph locally with `npm install` to refresh lock metadata.
- Re-verified CI path with `npm ci` (success).
- Re-verified production bundling with `npm run build` (success, existing chunk-size warning unchanged).

## Cloudflare Retry Investigation (Second Failure)
- Reproduced and re-audited the same Cloudflare `npm clean-install` error after retry deployment.
- Root cause confirmed again: `package-lock.json` had stale references to `@csstools/css-parser-algorithms@3.0.5` and `@csstools/css-tokenizer@3.0.4` without concrete lock nodes.
- Performed full lock reset (`rm -rf node_modules package-lock.json && npm install`) to force clean lock graph generation.
- Verified lockfile now contains required nodes:
  - `node_modules/@csstools/css-parser-algorithms`
  - `node_modules/@csstools/css-tokenizer`
- Re-ran Cloudflare-equivalent sequence locally: `npm ci && npm run build` -> both succeeded.
- Current repo delta includes updated `package-lock.json`; this must be pushed so Cloudflare picks up the fixed lockfile.
