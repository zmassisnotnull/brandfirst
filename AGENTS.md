# AGENTS.md

# Repository Overview
- Frontend: Vite + React (TypeScript) in `src/`
- Styling: Tailwind CSS v4 + custom CSS in `src/styles/`
- Backend: Supabase Edge Functions (Deno) in `supabase/functions/`
- Path alias: `@` -> `src` (see `vite.config.ts`)
- Module system: ESM (`"type": "module"` in `package.json`)
- Vite plugins: React + Tailwind are required (see `vite.config.ts`)

# Build / Lint / Test Commands
## Install
- `npm i`

## Dev server
- `npm run dev`

## Production build
- `npm run build`

## Deploy
- `npm run deploy:pages` (Cloudflare Pages via Wrangler)

## Lint
- No `lint`/`format` scripts detected in `package.json`.
- No ESLint/Prettier/Stylelint/EditorConfig configs found in the repo.

## Tests
- No test script or test runner found.
- No single-test command available (add a test framework first).
- `preview`/`typecheck` scripts are not present in `package.json`.

# Code Style and Conventions
## General
- Prefer small, focused components and utilities; split large files when practical.
- Avoid unnecessary comments; add only for non-obvious behavior.
- Keep UI responsive; prefer flex/grid over absolute positioning.
- Keep files ESM-only; avoid CommonJS patterns.
- Do not introduce non-ASCII unless the file already uses it.

## TypeScript / React
- Prefer type-safe code; avoid `any` where possible.
- Use function components and hooks.
- Keep state and effects localized; extract logic into utilities when reused.
- Follow existing file formatting and import style within the file you edit.

## Imports
- Most files use single quotes; some UI components use double quotes. Match the local file.
- Group imports: external first, then internal; keep blank line separation when present.
- Use the `@` alias for `src` imports when it improves clarity.

## Naming
- Components: PascalCase (`LogoEditor`, `QRCardPricingPage`).
- Hooks: camelCase with `use` prefix (`useFontLoading`).
- Files: match existing naming in the folder (mixed case is present).
- CSS classes: Tailwind utility classes are standard.

## Error Handling
- Frontend: prefer explicit error messages via `console.error` where patterns exist.
- Edge Functions: return JSON errors with HTTP status; log context.
- Avoid empty catch blocks.

## Styling
- Tailwind is the primary styling system.
- Custom CSS is in `src/styles/` and imported by `src/main.tsx`.
- Keep class lists readable; split long strings only if the file already does.

## UI Components
- Shared primitives live in `src/app/components/ui/`.
- Utility class helper `cn` is in `src/app/components/ui/utils.ts`.
- Many components are local to pages; avoid global-only patterns.

## Icons and UI Libraries
- Icons commonly use `lucide-react`.
- Radix UI components are used for primitives; match their patterns.
- MUI is installed but not dominant in the UI layer.

## State and Side Effects
- Local state via React hooks is common; avoid introducing new state libraries.
- Side effects often log to console; keep error logs explicit.
- Keep network calls close to the component or service where used.

## Supabase Edge Functions (Deno)
- Files live in `supabase/functions/server/`.
- Use `Deno.env.get` for secrets; do not hardcode API keys.
- Ensure CORS middleware remains first in `index.tsx`.
- Use `createClient` from `@supabase/supabase-js` for DB/storage.

## API Conventions (Edge Functions)
- Base path uses `make-server-98397747` in routes (current value; verify if it changes).
- JSON error responses include `error` and set HTTP status.
- Log inputs and error context with `console.log`/`console.error`.
- Keep request validation near the top of each handler.

## Supabase Storage
- Asset bucket name is `make-45024be7-assets` (current value; verify if it changes).
- Prefer signed URLs for assets; do not make buckets public without need.
- Store assets under userId-prefixed paths when possible.

## Environment / Secrets
- Frontend uses `projectId` and `publicAnonKey` from `utils/supabase/info`.
- Edge Functions require `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and API keys.
- Do not log secrets; redact tokens in logs when present.

# Repository-Specific Notes
- No Cursor rules or Copilot instructions are present (checked `.cursorrules`, `.cursor/rules/`, `.github/copilot-instructions.md`).
- `guidelines/Guidelines.md` is a template and currently unused.
- `PROMPT_ENGINEERING_GUIDE.md` documents AI prompt contracts and workflows.
- `README-AI-SETUP.md` documents Hugging Face vs Replicate setup.

# Prompting Workflow
- Prompt engine: `src/app/utils/prompt-engine.ts`.
- Prompt contracts/types: `src/app/utils/prompt-contracts.ts`.
- Prompt builders: `src/app/utils/naming-prompts.ts`, `src/app/utils/logo-prompts.ts`, `src/app/utils/card-prompts.ts`.
- Orchestration: `src/app/utils/prompt-orchestration.ts`.
- Edge prompt endpoint in `supabase/functions/server/index.tsx` at `/make-server-98397747/api/ai/prompt`.
- Expect JSON-only responses; parse/validation errors should be logged.

# Fonts and Typography
- Font helpers live in `src/lib/fonts/`.
- Global font imports are in `src/styles/fonts.css` (via `src/styles/index.css`).
- Typography types are in `src/app/types/typography.ts`.
- Prefer keeping font loading hooks local to font usage sites.

# Project Structure Quick Map
- `src/main.tsx`: app entry, renders `App` and loads global styles.
- `src/app/App.tsx`: page router and core orchestration.
- `src/app/components/`: feature UI components and pages.
- `src/app/utils/`: prompt engine, prompt contracts, and shared utilities.
- `src/features/branding/`: logo and card editor features.
- `supabase/functions/server/`: Edge Functions API implementation.
- `src/styles/`: Tailwind base, theme, and font imports.

# Working Practices for Agents
- Before changes: scan for patterns in the same folder.
- After changes: run `npm run build` for frontend changes when feasible.
- Avoid introducing new dependencies unless required by the task.
- Do not modify unrelated files.

# Logging Guidance
- Use `console.error` for failures and `console.log` for checkpoints.
- Keep log messages short and include key identifiers.
- Avoid logging full tokens; truncate when debugging auth.

# Single-Test Guidance (Not Available Yet)
- There is no test framework installed.
- If tests are added later, document `npm test -- <pattern>` or `vitest run <file>` here.

# Pulling Patterns Before Edits
- UI components often include long class strings; keep existing style.
- Many files rely on local helpers; reuse before creating new utilities.
- Match import order and quote style in the file you edit.

# File Touch Guidance
- Frontend entry: `src/main.tsx`.
- App routing: `src/app/App.tsx`.
- UI primitives: `src/app/components/ui/`.
- Utilities: `src/app/utils/`.
- Supabase server: `supabase/functions/server/`.
