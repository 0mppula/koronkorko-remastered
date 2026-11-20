# Epic: Aviation Calculators

Branch: `epic/aviation-calculators` · Plans: `docs/plans/aviation/`

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
   values are never rounded; only displayed values are.
4. **Unit-aware forms.** Forms show the user's unit next to each input, convert input to base units
   before calculating and saving, and convert base units back to the user's units when importing a
   saved calculation. Validation error messages show limits in the user's unit.
5. **Unit preferences UI.** The currency toggler (`components/Nav/PreferredCurrencyToggler.tsx`)
   stays unchanged. A new Nav button with the lucide `SlidersHorizontal` icon, shown on every page
   and screen size, opens a unit preferences modal (existing `components/ui/dialog.tsx` and
   `components/ui/select.tsx` styling) with a Save button. It starts with **speed, altitude and
   temperature**. Other unit preferences (pressure, fuel) are added only by the calculator that
   first needs them. Defaults follow ICAO: kt, ft, °C, and hPa once pressure exists.
6. **Preference storage.** Unit preferences are stored in `User.preferences` next to `theme` and
   `currency`, synced the same way as currency (`UserPreferencesProvider`, `updateUserPreferences`),
   with defaults for users who have none. Locally they live in a persisted Zustand store.
7. **Disclaimer.** A reusable, subtle disclaimer: a small muted line under each aviation report
   ("For training and educational use only. Not for flight planning or navigation.") plus a
   sentence in each aviation `Info.tsx`.
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
- [ ] **05 Fuel Planning Calculator** – `05-fuel-planning-calculator.md` –
      `feature/fuel-planning-calculator` (adds the fuel unit: L, US gal, kg, lb)

01 must be merged first. 02–05 depend on 01; 03 reuses angle helpers added in 02. 04 and 05 are
independent of each other but each extends the units system, so merge one before starting the
other to avoid conflicts in `lib/units.ts`, `prisma/schema.prisma` and the units modal.

## Branching

- Feature branches are created from an up-to-date `epic/aviation-calculators` (not `master`),
  named `feature/<kebab-case>` as listed above.
- Feature PRs target `epic/aviation-calculators`. CI (`.github/workflows/ci.yml`) runs on every PR:
  `npx prisma generate`, lint, typecheck, format check, tests.
- Keep the epic up to date with `master` when `master` changes (ask before merging/rebasing).
- When all features are done, one final PR from `epic/aviation-calculators` into `master`.

## Definition of done

- All 4 calculators (02–05) and the foundation (01) are merged into `epic/aviation-calculators`.
- `npm run lint`, `npm run typecheck`, `npm run format:check` and `npm test` pass on the epic.
- The epic's Vercel preview has been tested manually:
    - Landing page shows Finance and Aviation sections; search works across both; Featured Apps
      unchanged.
    - Each aviation calculator calculates correctly in every unit combination offered.
    - Signed in: save, rename, update, import and delete work; importing after switching units
      shows the same physical values in the new units; free-plan limit is enforced.
    - Unit preferences persist after reload (signed out, localStorage) and across devices (signed
      in, `User.preferences`); changing theme or currency does not reset unit preferences.
    - Disclaimer appears under every aviation report and in every aviation `Info.tsx`.
    - Finance calculators behave exactly as before.
- Final PR from the epic into `master` is open.

## Preview database

The owner is checking the preview database setup (which `DATABASE_URL` the epic's Vercel preview
uses) before the first feature that saves data is tested on the preview. That is 01, which writes
`User.preferences.units`. Don't test saving on the preview until this is confirmed. New MongoDB
collections are created on first insert and the new models have no unique indexes, so
`prisma db push` should not be needed; never run it without asking.

## Open questions

None at the moment.
