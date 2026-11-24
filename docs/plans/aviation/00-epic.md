# Epic: Aviation Calculators

Branch: `epic/aviation-calculators` (closed; merged into `master` in November 2026) · Plans:
`docs/plans/aviation/`

## Goal

Diversify KoronKorko beyond finance by adding 4 aviation calculators (crosswind, wind triangle,
density altitude, fuel planning). They work like the 12 finance calculators: anyone can use them,
signed-in users can save, rename, update, import and delete calculations, and free-plan users are
limited to `FREE_PLAN_CALCULATION_LIMIT` saves per calculator.

## Decisions

1. **Brand and categories.** The brand stays KoronKorko. Every entry in
   `constants/calculators.ts` gets a `category: 'finance' | 'aviation'` field. All 12 existing
   calculators become `'finance'`. The landing page (`app/page.tsx`) shows a Finance section and
   an Aviation section. The "Featured Apps" section (`featuredApps` in `constants/data.ts`) stays
   as it is.
2. **Full stack.** Aviation calculators are full stack like the finance ones: Prisma model, API
   routes (`POST`/`GET`, `PUT`/`DELETE`), save/rename/update/import/delete through `useCalculator`,
   free-plan limits (client `checkCalculationLimit` + server check in every `POST`), and unit
   tests.
3. **Base units.** Storage, API and math use base units only: speed **kt**, altitude/elevation
   **ft**, distance **NM**, pressure **hPa**, temperature **°C**, mass **kg**, volume **L**,
   angles/directions **degrees**. User unit preferences only affect input and display. Stored
   values are never rounded; only displayed values are (reports, messages, and unit inputs, which
   show 2 decimals while the form keeps the unrounded value).
4. **Unit-aware forms.** Forms show the user's unit next to each input, convert input to base units
   before calculating and saving, and convert base units back to the user's units when importing a
   saved calculation or changing units. Fields the user hasn't edited keep their exact base value
   (on unit changes, calculate, save and update), so toggling units never adds rounding drift.
   Limits are checked in base units (the same check on the client and in the API); validation
   messages show them in the user's unit, rounded inwards so every value up to the shown limit
   passes.
5. **Unit preferences UI.** The currency toggler (`components/Nav/PreferredCurrencyToggler.tsx`)
   stays unchanged. A new Nav button with the lucide `SlidersHorizontal` icon, shown on every page
   and screen size, opens a unit preferences modal (existing `components/ui/dialog.tsx` and
   `components/ui/select.tsx` styling) with a Save button. It starts with **speed, altitude and
   temperature**. Other unit preferences (pressure, fuel) are added only by the calculator that
   first needs them. Defaults follow ICAO: kt, ft, °C, hPa (added by 04) and L (added by 05).
6. **Preference storage.** Unit preferences are stored in `User.preferences` next to `theme` and
   `currency`, synced the same way as currency (`UserPreferencesProvider`, `updateUserPreferences`),
   with defaults for users who have none. `PUT /api/auth/preferences` validates the whole object
   with `userPreferencesSchema`. Locally they live in a persisted Zustand store.
7. **Disclaimer.** A reusable, subtle disclaimer per calculator category: `calculatorDisclaimers`
   in `constants/data.ts` (`Record<CalculatorCategory, string>`, so a new category without a text
   is a type error) and `components/Report/CalculatorDisclaimer.tsx` (`category` prop), a small
   muted line at the end of every report. Aviation: "For training and educational use only. Not
   for flight planning or navigation."; finance: "For informational and educational purposes
   only. Not financial advice.". Every `Info.tsx` also renders
   `<p>{calculatorDisclaimers.<category>}</p>` before `ReportSource`. Finance calculators got
   their disclaimer in the epic too (in 04's branch), so all calculators follow one pattern.
8. **README.** The foundation adds an "Aviation Calculators" section to `README.md` (heading and
   a short intro). Each calculator branch adds its own entry there, in the same format as the
   existing calculator list.

## Feature order and status

Each feature has its own plan file and branch. Update this checklist in the feature's PR.

- [x] **01 Foundation** – `01-foundation.md` – `feature/aviation-foundation`
      (categories + landing sections, units store/modal/sync, `lib/units.ts`, unit-aware input,
      disclaimer, AGENTS.md checklist, copy)
- [x] **02 Crosswind Calculator** – `02-crosswind-calculator.md` – `feature/crosswind-calculator`
- [x] **03 Wind Triangle Calculator** – `03-wind-triangle-calculator.md` –
      `feature/wind-triangle-calculator`
- [x] **04 Density Altitude Calculator** – `04-density-altitude-calculator.md` –
      `feature/density-altitude-calculator` (adds the pressure unit)
- [x] **05 Fuel Planning Calculator** – `05-fuel-planning-calculator.md` –
      `feature/fuel-planning-calculator` (adds the fuel unit: L, US gal, kg, lb, and the fuel
      density unit context)

01 must be merged first. 02–05 depend on 01; 03 reuses angle helpers added in 02. 04 and 05 are
independent of each other but each extends the units system, so merge one before starting the
other to avoid conflicts in `lib/units.ts`, `prisma/schema.prisma` and the units modal.

## Branching

Historical: this is how the epic was run. The epic is closed; new aviation work branches from an
up-to-date `master` (see 06 and 07).

- Feature branches are created from an up-to-date `epic/aviation-calculators` (not `master`),
  named `feature/<kebab-case>` as listed above.
- Feature PRs target `epic/aviation-calculators`. CI (`.github/workflows/ci.yml`) runs on every PR:
  `npx prisma generate`, lint, typecheck, format check, tests.
- Keep the epic up to date with `master` when `master` changes (ask before merging/rebasing).
- When all features are done, one final PR from `epic/aviation-calculators` into `master`.

## Definition of done

- [x] All 4 calculators (02–05) and the foundation (01) are merged into
      `epic/aviation-calculators`.
- [x] `npm run lint`, `npm run typecheck`, `npm run format:check` and `npm test` pass on the epic.
- [x] The epic's Vercel preview has been tested manually:
    - [x] Landing page shows Finance and Aviation sections; search works across both; Featured
          Apps unchanged.
    - [x] Each aviation calculator calculates correctly in every unit combination offered.
    - [x] Signed in: save, rename, update, import and delete work; importing after switching
          units shows the same physical values in the new units; free-plan limit is enforced.
    - [x] Unit preferences persist after reload (signed out, localStorage) and across devices
          (signed in, `User.preferences`); changing theme or currency does not reset unit
          preferences.
    - [x] Disclaimer appears under every aviation report and in every aviation `Info.tsx`.
    - [x] Finance calculators behave exactly as before, apart from the new finance disclaimer.
- [x] The epic is merged into `master` (via the fuel planning PR, which included the whole epic).

## Outcome

All 4 calculators (crosswind, wind triangle, density altitude, fuel planning) and the foundation
shipped to `master` in November 2026. The epic is closed.

Follow-ups found during the epic (not part of it):

- Finance inputs and reports follow the browser locale.
- A zod `preprocess` quirk, documented as a `BUG:` test.
- An `<a>` inside a `<button>` in the nav (invalid HTML).
- The not-signed-in check in `getUsersSubscriptionData` is a no-op (`null;` instead of
  returning).
- A second wave of aviation calculators: true airspeed and time-speed-distance are planned in
  `06-true-airspeed-calculator.md` and `07-time-speed-distance-calculator.md` (one branch,
  `feature/tas-and-tsd-calculators`, from `master`); both are done.
- A third wave, planned on `feature/aviation-wave-3` (from `master`):
  `08-heading-calculator.md` (true, magnetic and compass heading), `09-cloud-base-calculator.md`,
  `10-glide-distance-calculator.md`, `11-turn-performance-calculator.md` and
  `12-descent-planning-calculator.md` (adds the vertical speed unit and per-unit fraction digits).
  All five are implemented on that one branch, in order 08 → 12.
  Done: 08, 09, 10, 11, 12. Only 12 extends `lib/units.ts`, Prisma `unitPreferences` and the units
  modal.
- `13-weight-and-balance-calculator.md` on `feature/weight-and-balance-calculator` (from
  `master`): adds the weight and arm units, rows with stable row ids (`useFieldArray`) and a list
  of composite types in Prisma. Done (Part A foundation, Part B calculator).

## Preview database

The owner is checking the preview database setup (which `DATABASE_URL` the epic's Vercel preview
uses) before the first feature that saves data is tested on the preview. That is 01, which writes
`User.preferences.units`. Don't test saving on the preview until this is confirmed. New MongoDB
collections are created on first insert and the new models have no unique indexes, so
`prisma db push` should not be needed; never run it without asking.

## Open questions

None at the moment.
