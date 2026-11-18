# AGENTS.md

## Project

KoronKorko is a full-stack web app (www.koronkorko.com) with finance and aviation calculators.
Finance (12): compound interest, annualized return/CAGR, present value, investment time,
break-even point, markup, event probability, P/E ratio, dollar cost average, enterprise value,
liquidation price, dividend yield. Aviation calculators are listed in `constants/calculators.ts`
(`category: 'aviation'`). Anyone can use them; signed-in users can save, rename, update, import and delete
calculations. Free-plan users are limited to `FREE_PLAN_CALCULATION_LIMIT` saves per calculator;
premium is bought via Stripe. Currency and unit preferences (speed, altitude, temperature) are kept
in persisted Zustand stores (localStorage) and synced to `User.preferences` for signed-in users.

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
- Test `npm test` (Vitest, single run) · Watch `npm run test:watch`

## Structure

- `app/(calculators)/<name>-calculator/` – one route per calculator
- `app/api/<name>-calculations/` – calculation CRUD; `app/api/auth/` – user + preferences
- `app/actions/` – `auth.ts` (`authOptions`, `getAuthSession`), `subscription.ts` (server action)
- `components/` – shared components by area (`Form/`, `Report/`, `Modals/`, `Nav/`, `providers/`);
  shadcn/ui in `components/ui/`. `Nav/UnitPreferencesModal.tsx` (units button + modal),
  `Report/AviationDisclaimer.tsx`
- `constants/` – `api.ts` (API URLs, query keys), `calculators.ts` (list + categories), `data.ts` (currencies, limits, disclaimer)
- `hooks/` – `useCalculator`, `useCalculationMutations`, Zustand stores (`useUnits` for unit preferences), misc hooks
- `lib/` – `calculatorFns.ts`, `utils.ts` (formatting, `cn`), `units.ts` (unit definitions and
  conversions), `db.ts`, `stripe.ts`, `queryFns/`
- `schemas/index.ts` – all zod schemas · `types/calculations.ts` – form/report/calculation types
- `prisma/schema.prisma` · `public/assets/images/` · `docs/plans/` (plan files)

## Environment (names only)

`DATABASE_URL`, `NEXTAUTH_SECRET`, `GITHUB_ID`, `GITHUB_SECRET`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`STRIPE_{WEEKLY,MONTHLY,YEARLY}_PREMIUM_PRICE_ID`, `NEXT_PUBLIC_STRIPE_{WEEKLY,MONTHLY,YEARLY}_PREMIUM_LINK`,
`NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL`. `NEXTAUTH_URL` is read automatically by NextAuth:
`http://localhost:3000` for local development, not needed on Vercel.

## Adding a calculator (mirror `dividend-yield-calculator`)

1. `prisma/schema.prisma`: `type <X>CalculationFormData`, `model <X>Calculation` (id, userId,
   name, formData, createdAt, updatedAt, `user` relation), and a back-relation on `User`. Run `npx prisma generate`.
2. `schemas/index.ts`: `<x>FormDataSchema` (use helpers like `positiveNumberFieldSchema`).
3. `types/calculations.ts`: `I<X>FormData = z.infer<...>`, `<X>ReportProps`, add to `CalculationType`.
4. `lib/calculatorFns.ts`: `calculate<X>(formData): <X>ReportProps`.
5. `lib/calculatorFns.test.ts`: add a `describe` block with normal and edge cases. Expected values
   must come from standard formulas or worked examples, not from running the code.
6. `schemas/index.test.ts`: add a `describe` block for `<x>FormDataSchema` (valid input, missing,
   negative and out-of-range values, coercion, and `BUG:` cases for inputs with no valid result).
7. `constants/api.ts`: `<X>_CALCULATIONS_API_URL` + `_QUERY_KEY`, added to `API_URLS` / `QUERY_KEYS`.
8. `constants/calculators.ts`: `{ name, url, category, description }` (drives home page sections,
   search, metadata).
9. `app/api/<x>-calculations/route.ts` (`POST` with session + free-plan limit check, `GET`) and
   `[id]/route.ts` (`PUT`, `DELETE`, scoped by `userId`). Parse bodies with the zod schemas.
10. `app/(calculators)/<x>-calculator/`: `page.tsx` (metadata via `getCalculatorWithPathname`),
    `Calculator.tsx` (form + `useCalculator` + `useQuery(getCalculations)` + `FormControlsTop`),
    `Report.tsx` (`ReportSection`/`ReportGroup`), `Info.tsx` (static explanation + `ReportSource`).

## Adding an aviation calculator

Follow "Adding a calculator" with these differences:

1. Base units everywhere except the form: kt, ft, NM, hPa, °C, kg, L, degrees. Prisma formData,
   API bodies, `calculate<X>` input/output and stored values use base units and are never rounded.
2. `lib/units.ts`: if the calculator needs a quantity that has no preference yet, add it to
   `unitQuantities`/`unitOptions` (exact conversion factors, cited) and `unitFractionDigits`, as
   an optional field on the Prisma `unitPreferences` type, to `unitPreferencesSchema`, and test it
   in `lib/units.test.ts`. The units modal picks it up automatically.
3. `schemas/index.ts`: `create<X>FormDataSchema(units)` using `unitNumberFieldSchema` with limits
   in base units, plus `<x>FormDataSchema = create<X>FormDataSchema(BASE_UNITS)` for the API.
   Infer `I<X>FormData` from `<x>FormDataSchema`. Limits are enforced as displayed in the user's
   unit (rounded to `unitFractionDigits`).
4. `lib/calculatorFns.ts`: `calculate<X>` takes and returns base units. Cite the formula source in
   a one-line comment.
5. `Calculator.tsx`: export a module-level `<x>UnitFields` map (`UnitFields<I<X>FormData>`, must
   be a stable reference), base-unit `defaultValues`, schema via
   `useMemo(() => create<X>FormDataSchema(units), [units])`, pass `unitFields` to `useCalculator`,
   and use `NumberInputWithIcon iconType="unit"` with `getUnitSymbol(...)` (`unitSymbol="°"` for
   directions; `min0={false}` for inputs that may be negative).
6. `Report.tsx`: format with `formatUnitValue` in the user's units; end with
   `<AviationDisclaimer />`.
7. `Info.tsx`: explain the formula and sources, include the disclaimer sentence, end with
   `ReportSource`.
8. `constants/calculators.ts`: `category: 'aviation'`. Add the calculator to README's aviation
   section.
9. Tests: formula tests with expected values from ICAO/FAA/E6B worked examples or exact
   derivations; schema tests in base units and in at least one non-base unit (message shows the
   user's unit).

## Conventions

- Format money with `formatCurrency(value, currency)` from `lib/utils` (locale comes from the
  currency); `currency` from `useCurrencyStore`.
- Format aviation values with `formatUnitValue(value, quantity, units[quantity])` from `lib/units`;
  `units` from `useUnitsStore`.
- `PUT /api/auth/preferences` replaces the whole preferences object: every
  `updateUserPreferences` call sends `theme`, `currency` and `units`.
- Keep the free-plan limit checks: client-side (`checkCalculationLimit` in `lib/queryFns`) and
  server-side in every `POST` route.
- Use the `@/` import alias.
- Route handlers must `return` their error responses in `catch` blocks: `400` with the first zod
  issue message for a `ZodError`, `500` with `"Something went wrong"` for other errors.

## Testing

- New or changed logic in `lib/`, `schemas/`, `hooks/` or `lib/queryFns/` gets unit tests in the
  same task. Tests live next to the source as `*.test.ts`.
- Bug fixes: first write a test that fails because of the bug, then fix the code so it passes.
- Expected values come from the spec, formulas or worked examples, never from running the
  current code.
- Vitest runs in a Node environment. Don't add React component tests or new test dependencies
  (jsdom, Testing Library, Playwright) without asking.
- Mock external calls the way `lib/queryFns/calculations.test.ts` mocks axios. Never call the
  real database, Stripe or auth providers in tests.
- Stripe (checkout, webhook, customer portal) and auth flows are intentionally not tested. Don't
  add tests for them unless asked; mock subscription status where needed.
- If you find a bug you aren't fixing in the current task, add an `it.fails` test named
  `BUG: ...` instead of changing the code.
- Known bugs are `it.fails` tests named `BUG: ...`. When fixing a bug, change its `it.fails` to
  `it` and remove the `BUG: ` prefix.

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
  `usePremiumModal`), `create<Interface>()((set) => ...)`, default-exported; `persist` only for currency and units.

## Known issues (don't copy these patterns)

- In `getUsersSubscriptionData`, the not-signed-in check has a no-op `null;` instead of returning.
- Misspelled names: `ENTERPRICE_VALUE_*` constants and `lib/createCounpoundInterestChartData.ts`.
  Use correct spelling in new code; don't rename existing ones unless asked.
- The folder `components/Footer.tsx/` has `.tsx` in its name.
- Existing `react-hooks/exhaustive-deps` lint warnings. Don't fix them unless asked; changing hook
  dependencies can change behavior. New code shouldn't add new warnings.

## Rules for the agent

- Match the style and patterns of the surrounding code. Don't refactor, rename or restyle code
  outside the scope of the task.
- Run `npm run lint`, `npm run typecheck`, `npm run format:check` and `npm test` after
  changes; fix errors before finishing.
- CI (`.github/workflows/ci.yml`) runs `npx prisma generate`, lint, typecheck, format check and
  tests on every PR and push to `master`. It doesn't build; Vercel builds every push.
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
- Branch names: `<type>/<short-kebab-case-description>`, e.g. `feature/savings-goal-calculator`.
  Types: `feature/` (new functionality), `fix/` (bug fixes), `chore/` (tooling, config,
  dependencies), `docs/` (documentation only), `test/` (tests only), `epic/` (long-lived
  integration branch for a larger feature set).
- When I ask you to start work on a branch without naming it, propose a name following this rule.
- Always create new branches from an up-to-date `master`, except feature branches that belong
  to an epic: create them from the up-to-date `epic/` branch, and target their PRs at the epic,
  not `master`.
