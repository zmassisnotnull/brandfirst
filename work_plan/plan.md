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

## Cloudflare Deploy Command Failure (Pages vs Workers)
- Investigated latest failure after successful build; root cause is deploy command mismatch:
  - Running `npx wrangler deploy` on a Pages project triggers warning and then fails with missing Worker entrypoint/assets.
  - Project config (`wrangler.jsonc`) is Pages-oriented (`pages_build_output_dir`).
- Added `$schema` to `wrangler.jsonc` and explicit note that this config must use `wrangler pages deploy`.
- Added npm script in `package.json`:
  - `deploy:pages`: `npx wrangler pages deploy ./dist --project-name=brandfirst`
- Verified command wiring with `npm run deploy:pages -- --help` (Pages deploy help displayed successfully).
- Re-verified build with `npm run build` (success, chunk-size warning unchanged).

## Cloudflare Fallback Fix (Global `wrangler deploy` path)
- Confirmed some deployment environments still execute `npx wrangler deploy` directly.
- Updated `wrangler.jsonc` to include Workers-mode fallback assets config:
  - `"assets": { "directory": "./dist" }`
- Kept existing Pages configuration (`pages_build_output_dir`) unchanged to preserve project structure.
- Verified fallback behavior with `npx wrangler deploy --dry-run`:
  - warning about Pages vs Workers remains (expected),
  - previous fatal error (`Missing entry-point ...`) is resolved,
  - dry-run upload path completes successfully.
- Re-ran `npm run build` after config update; build succeeded.

## Deployed Site Preview Check
- Target URL: `https://brandfirst.spinus29.workers.dev/`.
- Browser automation attempt via Playwright MCP failed in this environment (`chrome` binary missing at `/opt/google/chrome/chrome`).
- HTTP-level availability checks passed:
  - `GET /` -> `200`, HTML served with title `Brandfirst.ai #BETA`.
  - `GET /assets/index-CHS9bmQz.js` -> `200`.
  - `GET /assets/index-mR83XKj6.css` -> `200`.
- Interpretation: deployment is reachable and core static assets are served/cached by Cloudflare; full interactive browser preview requires a runtime with installed browser binary.

## Print Feature Gap Analysis
- `src/features/branding/card-auto/api.ts`: `MOCK_MODE = true` keeps print flows in mock mode; real Edge Function calls for auto-generate/select-and-lock/fulfillment are not active.
- `supabase/functions/server/`: no handlers found for `/api/card/auto-generate`, `/api/card/select-and-lock`, or `/api/fulfillment/create` (docs mention these endpoints but server routes are missing).
- `src/features/branding/card-auto/CardConceptPickerDouble.tsx`: print PDF preview tab shows a placeholder (icon) and download button has no handler; `printPdfUrl` is never rendered or downloaded.
- `src/features/branding/card-auto/CardConceptPicker.tsx`: PDF is generated client-side and stored as a blob URL; `export_id` is mocked and PDF is not persisted to storage or linked to backend exports.
- `src/features/branding/card-auto/pdfGenerator.ts`: SVG rendering uses `drawSimpleSvgPath` fallback (rectangle) and does not parse real SVG paths; `logoFontUrl`/`bodyFontUrl` options are unused and only standard fonts are embedded.
- `src/app/pages/AutoCardMakerPageV2.tsx`: project/typography/logo IDs are random UUIDs; production flow will need real IDs from persisted entities.
- `src/app/App.tsx`: `print.brandfirst.ai` routes to `home` with no dedicated print site page; print subdomain is effectively a placeholder.
- `src/features/branding/card-auto/CardConceptPicker.tsx`: fulfillment flow persists selected card metadata to `localStorage` only; no server-side record for print jobs.

## Print Remediation Progress
- Added Edge Function routes for print flow on both slugs (`make-server-98397747`, `make-server-45024be7`):
  - `POST /api/card/auto-generate`
  - `POST /api/card/select-and-lock`
  - `POST /api/fulfillment/create`
- Updated frontend print API base wiring in `src/features/branding/card-auto/api.ts`:
  - default base URL now resolves from Supabase `projectId`
  - auth headers now include session token when available
  - mock mode changed to explicit opt-in (`VITE_PRINT_MOCK_MODE=true` in dev only)
- Fixed double-sided picker print UX in `src/features/branding/card-auto/CardConceptPickerDouble.tsx`:
  - preview tab now renders real PDF in iframe when URL exists
  - download button now fetches and saves PDF
- Updated single-sided picker in `src/features/branding/card-auto/CardConceptPicker.tsx` to call `selectAndLockCard` and use returned `print_export.id`.
- Improved PDF generator in `src/features/branding/card-auto/pdfGenerator.ts`:
  - supports `<svg ...><path d="..."/></svg>` extraction and `drawSvgPath` rendering attempt
  - loads custom font URLs (`logoFontUrl`, `bodyFontUrl`) with fallback handling
- Updated print subdomain initial page routing (`src/app/App.tsx`) to `auto-card-v2` and added render case for `AutoCardMakerPageV2`.
- Replaced volatile random IDs in `src/app/pages/AutoCardMakerPageV2.tsx` with stable placeholders to prevent per-render churn.
- Verification run completed:
  - LSP diagnostics: no issues on all modified files
  - `npm run build`: success (existing chunk-size warning unchanged)

## Unified Preview Operations (Logo Editor Integration)
- Extended shared preview contract in `src/app/components/LogoPreview.tsx`:
  - supports `renderResult` (`svgPathD`, `viewBox`, `color`) for server-rendered path previews
  - supports `rawText`, `fontFeatureSettings`, `rotateDeg`, and `backgroundColor` for live editor compatibility
  - adds inline SVG `<title>` for accessibility-safe rendered previews
- Extended `src/app/components/FontPreview.tsx`:
  - supports optional `fontFeatureSettings` and `rotateDeg`
  - allows editor flow to preserve kerning/ligature and rotation behavior through shared renderer
- Integrated logo editor preview path to shared renderer in `src/features/branding/logo-editor/LogoPreview.tsx`:
  - live mode now routes through shared `LogoPreview` with mapped editor state/font values
  - rendered mode now routes through shared `LogoPreview` using `renderResult`
  - existing empty-font/empty-text guard states preserved
- Hardened fallback/compatibility behavior:
  - centralized fallback message path for non-renderable logo inputs
  - removed divergent live/rendered branch code that previously operated separately in logo editor
- Verification run completed:
  - LSP diagnostics: no issues on all modified files
  - `npm run build`: success (existing chunk-size warning unchanged)

## Logo/Text Preview Consistency Remediation
- Added shared preview renderer `src/app/components/LogoPreview.tsx` and centralized logo rendering priority:
  - text-based font preview first when `brandName + font/fontFamily` exist
  - SVG data URL preview next via `LogoSvgRenderer`
  - image URL preview fallback via `<img>`
  - explicit fallback message when no renderable logo source exists
- Updated `src/app/components/MyBrandingBox.tsx` to use shared `LogoPreview` for:
  - logo grid cards (My Logo list)
  - logo detail modal preview
  - this removes duplicated conditional rendering branches that previously diverged from other screens
- Updated `src/app/components/HomePage.tsx` showcase logo cards to use shared `LogoPreview` and removed inline duplicate `transformText` + branch logic.
- Updated `src/app/components/CardCreationChoice.tsx` selected-logo summary to use shared `LogoPreview` so text logos and SVG logos display consistently before plan selection.
- Updated `src/app/components/LogoCreationPage.tsx` Step 6 result grid text rendering to apply `transformText(..., logo.transform)` consistently (matching modal preview behavior).
- Verification run completed:
  - LSP diagnostics: no issues on all modified files
  - `npm run build`: success (existing chunk-size warning unchanged)
