# AGENTS.md

## Project

KoronKorko is a full-stack finance web app (www.koronkorko.com) with 12 finance calculators
(compound interest, annualized return/CAGR, present value, investment time, break-even point,
markup, event probability, P/E ratio, dollar cost average, enterprise value, liquidation price,
dividend yield). Anyone can use them; signed-in users can save, rename, update, import and delete
calculations. Free-plan users are limited to `FREE_PLAN_CALCULATION_LIMIT` saves per calculator;
premium is bought via Stripe. Currency is kept in a persisted Zustand store (localStorage) and
synced to `User.preferences` for signed-in users.

## Stack

- Next.js 14 (App Router), React 18, TypeScript (strict)
- Prisma 5 with MongoDB; NextAuth v4 (GitHub + Google, JWT sessions) with `@auth/prisma-adapter`
- Tailwind CSS + shadcn/ui (Radix, `components.json`), lucide-react / react-icons, next-themes
- TanStack Query v5 + axios (server state), Zustand (client state)
- react-hook-form + zod; sonner (toasts)
- Stripe (payment links + `app/api/webhooks/stripe` webhook); `@vercel/analytics`
- recharts, json-as-xlsx and date-fns (only in the compound interest breakdown)

## Commands

- Install `npm install` · Dev `npm run dev` · Build `npm run build` (runs `prisma generate` first)
- Lint `npm run lint` (`next/core-web-vitals`) · Typecheck `npm run typecheck`
- Format `npm run format` · Check formatting `npm run format:check` (Prettier)
- Prisma client `npx prisma generate` · Schema sync (no migrations) `npx prisma db push`
- Tests: none configured

## Structure

- `app/(calculators)/<name>-calculator/` – one route per calculator
- `app/api/<name>-calculations/` – calculation CRUD; `app/api/auth/` – user + preferences
- `app/actions/` – `auth.ts` (`authOptions`, `getAuthSession`), `subscription.ts` (server action)
- `components/` – shared components by area (`Form/`, `Report/`, `Modals/`, `Nav/`, `providers/`);
  shadcn/ui in `components/ui/`
- `constants/` – `api.ts` (API URLs, query keys), `calculators.ts` (list), `data.ts` (currencies, limits)
- `hooks/` – `useCalculator`, `useCalculationMutations`, Zustand stores, misc hooks
- `lib/` – `calculatorFns.ts`, `utils.ts` (formatting, `cn`), `db.ts`, `stripe.ts`, `queryFns/`
- `schemas/index.ts` – all zod schemas · `types/calculations.ts` – form/report/calculation types
- `prisma/schema.prisma` · `public/assets/images/`

## Environment (names only)

`DATABASE_URL`, `NEXTAUTH_SECRET`, `GITHUB_ID`, `GITHUB_SECRET`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`STRIPE_{WEEKLY,MONTHLY,YEARLY}_PREMIUM_PRICE_ID`, `NEXT_PUBLIC_STRIPE_{WEEKLY,MONTHLY,YEARLY}_PREMIUM_LINK`,
`NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL`. (`NEXTAUTH_URL` is not referenced in code.)

## Adding a calculator (mirror `dividend-yield-calculator`)

1. `prisma/schema.prisma`: `type <X>CalculationFormData`, `model <X>Calculation` (id, userId,
   name, formData, createdAt, updatedAt, `user` relation), and a back-relation on `User`. Run `npx prisma generate`.
2. `schemas/index.ts`: `<x>FormDataSchema` (use helpers like `positiveNumberFieldSchema`).
3. `types/calculations.ts`: `I<X>FormData = z.infer<...>`, `<X>ReportProps`, add to `CalculationType`.
4. `lib/calculatorFns.ts`: `calculate<X>(formData): <X>ReportProps`.
5. `constants/api.ts`: `<X>_CALCULATIONS_API_URL` + `_QUERY_KEY`, added to `API_URLS` / `QUERY_KEYS`.
6. `constants/calculators.ts`: `{ name, url, description }` (drives home page, search, metadata).
7. `app/api/<x>-calculations/route.ts` (`POST` with session + free-plan limit check, `GET`) and
   `[id]/route.ts` (`PUT`, `DELETE`, scoped by `userId`). Parse bodies with the zod schemas.
8. `app/(calculators)/<x>-calculator/`: `page.tsx` (metadata via `getCalculatorWithPathname`),
   `Calculator.tsx` (form + `useCalculator` + `useQuery(getCalculations)` + `FormControlsTop`),
   `Report.tsx` (`ReportSection`/`ReportGroup`), `Info.tsx` (static explanation + `ReportSource`).

## Conventions

- Format money with `formatCurrency(value, currency)` from `lib/utils` (locale comes from the
  currency); `currency` from `useCurrencyStore`.
- Keep the free-plan limit checks: client-side (`checkCalculationLimit` in `lib/queryFns`) and
  server-side in every `POST` route.
- Use the `@/` import alias.

## Code style

- Formatting is enforced by Prettier via `.prettierrc` (tabs, width 4, single quotes,
  print width 100, `es5` trailing commas); `.prettierignore` excludes `.next`, `node_modules`, `package-lock.json`.
- Components: `const Name = (props) => {...}` arrow functions with `export default Name`; props
  typed with `interface` (`interface ReportProps`). shadcn/ui files are formatted by Prettier like the rest of the code.
- Naming: component files/folders PascalCase (`Form/SubmitButton.tsx`); routes kebab-case;
  hooks `useX.ts`; lib/constants camelCase; shadcn files lowercase.
- `page.tsx`, `layout.tsx` and `Info.tsx` are server components; anything using hooks/state
  (`Calculator.tsx`, most `Report.tsx`, providers, Nav, Form) starts with `'use client';`.
- Data: client calls `lib/queryFns/*` (axios) via TanStack Query; calculation mutations go through
  `useCalculator` → `useCalculationMutations` (toasts + query invalidation). Route handlers do
  the DB work via `db` from `lib/db`. Server actions are rare (`getUsersSubscriptionData`).
- Zustand: one store per file in `hooks/` (`useCurrency`, `useLoadingStore`, `useLoginModal`,
  `usePremiumModal`), `create<Interface>()((set) => ...)`, default-exported; `persist` only for currency.

## Known issues (don't copy these patterns)

- Catch blocks in `app/api` route handlers create the 500 response without returning it. New
  code must `return` it.
- In `getUsersSubscriptionData`, the not-signed-in check has a no-op `null;` instead of returning.
- Misspelled names: `ENTERPRICE_VALUE_*` constants and `lib/createCounpoundInterestChartData.ts`.
  Use correct spelling in new code; don't rename existing ones unless asked.
- The folder `components/Footer.tsx/` has `.tsx` in its name.
- Existing `react-hooks/exhaustive-deps` lint warnings. Don't fix them unless asked; changing hook
  dependencies can change behavior. New code shouldn't add new warnings.

## Rules for the agent

- Match the style and patterns of the surrounding code. Don't refactor, rename or restyle code
  outside the scope of the task.
- Run `npm run lint`, `npm run typecheck` and `npm run format:check` after changes; fix
  errors before finishing.
- Don't add new dependencies without asking. Keep changes small and focused.
- Never edit or print `.env*` files or secrets (`.env.example` holds names only and may be edited).
- After changing `prisma/schema.prisma`, run `npx prisma generate`. Never run
  `prisma db push` without asking, since it changes the real database.
- Don't change Stripe or auth logic unless the task is explicitly about it.
- Reuse existing shadcn/ui and `components/Form`/`Report` components before creating new ones.

## Git

- Never run `git push`, `git merge`, `git rebase`, `git stash` or create/switch branches
  unless I explicitly ask in the current task.
- Only commit if I've said so in the current task (e.g. "you can make commits"). Without
  that, leave changes uncommitted. Only commit files related to the task.
- Never run destructive commands (`git reset --hard`, `git clean`, `git checkout -- .`,
  `git restore` on files you didn't change, force push) even if asked to "clean up". Ask me
  first and explain what would be lost.
- Read-only git commands (`git status`, `git diff`, `git log`, `git show`, `git blame`) are
  always fine.
- Commit messages: short, imperative mood, no trailing period (e.g. "Add dividend yield
  calculator").
