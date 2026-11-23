# 03 Wind Triangle Calculator

Epic: `epic/aviation-calculators` (closed, merged into `master`; see `00-epic.md`) · Branch:
`feature/wind-triangle-calculator` (was created from the epic after 01 and 02 and merged back
into it).

## Goal

Given a true course, true airspeed (TAS) and the wind direction and speed, calculate the wind
correction angle (WCA), the true heading to fly and the groundspeed — the E6B wind side
computation.

## Scope

- Full-stack calculator like `dividend-yield-calculator`: Prisma model, API routes, save, rename,
  update, import, delete, free-plan limit, tests.
- Validation that rejects winds for which the course cannot be flown.

## Out of scope

- Magnetic heading (no magnetic variation input), deviation, compass heading.
- Distance, time en route and fuel (no distance preference yet).
- Calculating the wind from heading/groundspeed (reverse problem).
- TAS from indicated airspeed.

## Foundation you rely on (from 01 and 02)

- `lib/units.ts`: `UnitPreferences`, `BASE_UNITS`, `UnitFields<T>`, `getUnitSymbol`,
  `formatBaseValue` (reports), `formDataToBaseUnits`, `formDataFromBaseUnits`, and from 02
  `normalizeDegrees`, `signedAngleDifference`, `toRadians`, `formatDegrees`.
- `hooks/useUnits.ts`: `useUnitsStore()` → `{ units }`.
- `schemas/index.ts`: `unitNumberFieldSchema(fieldName, quantity, unit, { min, max, minExclusive })`
  (limits checked in base units, messages rounded inwards in the user's unit), and from 02
  `headingFieldSchema(fieldName)` (1–360).
- `hooks/useCalculator.ts`: optional `unitFields`; base-unit `defaultValues`; conversions inside
  the hook, exact base values kept for untouched fields.
- `NumberInputWithIcon` `iconType="unit"` + `unitSymbol`; `CalculatorDisclaimer`
  (`category="aviation"`) and `calculatorDisclaimers.aviation`; `category` in
  `constants/calculators.ts`.
- `app/(calculators)/crosswind-calculator/` as the closest example.

If any name differs in the merged code, follow the code.

## Inputs and outputs (base units)

| Field                          | Base unit | Preference | Notes                                                         |
| ------------------------------ | --------- | ---------- | ------------------------------------------------------------- |
| `trueCourse` (input)           | degrees   | none       | 1–360                                                         |
| `trueAirspeed` (input)         | kt        | speed      | > 0, ≤ 600                                                    |
| `windDirection` (input)        | degrees   | none       | true, direction the wind blows **from**, 1–360                |
| `windSpeed` (input)            | kt        | speed      | 0–200                                                         |
| `windCorrectionAngle` (output) | degrees   | none       | signed; positive = correct right (into a wind from the right) |
| `trueHeading` (output)         | degrees   | none       | normalized                                                    |
| `groundspeed` (output)         | kt        | speed      | > 0 for valid input                                           |

`windTriangleUnitFields`: `{ trueAirspeed: 'speed', windSpeed: 'speed' }`.

**Direction reference (decided).** Everything is true: true course (from charts), true wind
direction (as in winds-aloft forecasts) and the output labelled **true heading**. There is no
magnetic variation input.

## Formulas

With `δ = windDirection − trueCourse` (angle of the wind relative to the course):

- `windCorrectionAngle = asin(windSpeed × sin(δ) / trueAirspeed)`
- `trueHeading = normalizeDegrees(trueCourse + windCorrectionAngle)`
- `groundspeed = trueAirspeed × cos(windCorrectionAngle) − windSpeed × cos(δ)`, computed as
  `trueAirspeed × √(1 − s²) − windSpeed × cos(δ)` with `s` the (clamped) `asin` argument

A solution exists only when `|windSpeed × sin(δ)| ≤ trueAirspeed` (otherwise `asin` is undefined)
and the resulting `groundspeed > 0`.

Sources: this is the closed-form solution of the wind triangle that the E6B wind side solves
graphically; it is described in the Navigation chapter of the FAA Pilot's Handbook of Aeronautical
Knowledge (FAA-H-8083-25, wind triangle) and given in this form in Ed Williams' "Aviation
Formulary" ("Wind Triangles (2) Find HD, GS"). Both are cited in the `calculateWindTriangle`
comment and `Info.tsx`. The test cases are verified as described in "Test cases".

## Zod schema rules (`schemas/index.ts`)

```ts
export const createWindTriangleFormDataSchema = (units: UnitPreferences) =>
	z
		.object({
			trueCourse: headingFieldSchema('True course'),
			trueAirspeed: unitNumberFieldSchema('True airspeed', 'speed', units.speed, {
				min: 0,
				minExclusive: true,
				max: 600,
			}),
			windDirection: headingFieldSchema('Wind direction'),
			windSpeed: unitNumberFieldSchema('Wind speed', 'speed', units.speed, { min: 0, max: 200 }),
		})
		.superRefine((data, ctx) => { ... });

export const windTriangleFormDataSchema = createWindTriangleFormDataSchema(BASE_UNITS);
```

- `superRefine` (like `breakEvenPointFormDataSchema`), both issues on `windSpeed`:
    - **No solution (decided):** if the wind's crosswind component exceeds the TAS,
      `|windSpeed × sin(δ)| > trueAirspeed`, there is no heading that holds the course. Message:
      `"The wind's crosswind component exceeds the true airspeed, so this course can't be flown"`.
    - Otherwise, if the groundspeed would be ≤ 0 (a headwind at least as strong as the TAS, or a
      pure crosswind equal to the TAS):
      `"The wind is too strong: groundspeed would be zero or negative"`
    - Both speeds are in the same unit within one schema, so the checks work in any unit.
    - Zod runs `superRefine` even when a field failed its own refine/min/max checks, so both
      checks are skipped unless `trueAirspeed > 0` and `windSpeed >= 0` (no duplicate issues).
    - Groundspeed counts as zero when `≤ trueAirspeed × 1e-9` (float noise); `calculateWindTriangle`
      clamps the `asin` argument to [−1, 1] against unit-conversion noise at crosswind = TAS.
- Limits (decided, base units): TAS > 0 and ≤ 600 kt, wind speed 0–200 kt; messages in the user's
  unit, rounded inwards (`"True airspeed must be greater than 0.00 kt"`, `"True airspeed cannot be
greater than 1,111.20 km/h"`). Course and wind direction 1–360 like 02.

## Unit preferences

Uses speed (from 01). Adds none.

## UI

- `Calculator.tsx`: mirror the crosswind calculator. Module-level `windTriangleUnitFields` and
  `defaultValues` (base units): `{ trueCourse: 360, trueAirspeed: 100, windDirection: 360,
windSpeed: 0 }`. Inputs in two `FormGroup`s: "True Course" (`°`), "True Airspeed" (speed
  symbol); "Wind Direction (true, from)" (`°`, `DynamicFormLabel`), "Wind Speed" (speed symbol, an
  empty field is set to 0 on blur).
- `Report.tsx`: `ReportGroup`s for True Course, True Airspeed, Wind (`"090° at 20.00 kt"`),
  `ReportDivider`, Wind Correction Angle (`formatDegrees(value)`: whole degrees as three digits,
  e.g. `"006° right"`; no side when it displays as `000°`; the side comes from the rounded
  absolute value), True Heading (`formatDegrees(value, { heading: true })`, north as `360°`),
  Groundspeed, then `<CalculatorDisclaimer category="aviation" />`. Every speed uses
  `formatBaseValue(value, 'speed', units.speed)` (2 decimals).
- `Info.tsx`: what the wind triangle is (course vs heading, TAS vs groundspeed, WCA); that all
  directions are true: the true course comes from the chart and the wind from winds-aloft
  forecasts, which are true, so the result is a true heading (converting it to a magnetic heading
  with the local variation is up to the pilot); that wind direction is where the wind blows from;
  the formula; `<p>{calculatorDisclaimers.aviation}</p>`; `ReportSource` to the FAA handbook page
  (`https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak`, text
  `"FAA Pilot's Handbook of Aeronautical Knowledge"`).

## Files to create or change

Follow "Adding a calculator" and "Adding an aviation calculator" in AGENTS.md:

1. `prisma/schema.prisma`: `type WindTriangleCalculationFormData { trueCourse Float trueAirspeed
Float windDirection Float windSpeed Float }`, `model WindTriangleCalculation` (same fields as
   `DividendYieldCalculation`), `WindTriangleCalculations WindTriangleCalculation[]` on `User`.
   Run `npx prisma generate`.
2. `schemas/index.ts`: schemas above.
3. `types/calculations.ts`: `IWindTriangleFormData`, `WindTriangleReportProps extends
IWindTriangleFormData { windCorrectionAngle; trueHeading; groundspeed }`, add to
   `CalculationType`.
4. `lib/calculatorFns.ts`: `calculateWindTriangle(formData): WindTriangleReportProps`.
5. `lib/calculatorFns.test.ts`: `describe('calculateWindTriangle')`.
6. `schemas/index.test.ts`: `describe('windTriangleFormDataSchema')`.
7. `constants/api.ts`: `WIND_TRIANGLE_CALCULATIONS_API_URL = '/api/wind-triangle-calculations'`,
   `WIND_TRIANGLE_CALCULATIONS_QUERY_KEY = 'wind-triangle-calculations'`, in `API_URLS`/`QUERY_KEYS`.
8. `constants/calculators.ts`:
   `{ name: 'Wind Triangle Calculator', url: 'wind-triangle-calculator', category: 'aviation', description: 'Calculate the true heading, wind correction angle and groundspeed, given the true course, true airspeed and the wind direction and speed. Additionally, logged in users can save their calculations.' }`.
9. `app/api/wind-triangle-calculations/route.ts` and `[id]/route.ts` (copy the dividend yield
   routes; `db.windTriangleCalculation`, `windTriangleFormDataSchema`).
10. `app/(calculators)/wind-triangle-calculator/`: `page.tsx`, `Calculator.tsx`, `Report.tsx`,
    `Info.tsx`.
11. `README.md` aviation entry and check off 03 in `00-epic.md` (not `AGENTS.md`:
    `constants/calculators.ts` is the source of truth for the calculator list).

## Test cases

`calculateWindTriangle` — expected values are derived from the standard formulas above (exact
derivations: sin 30° = 0.5, cos 30° = √3/2, asin(0.1) = 5.739170°, cos(asin 0.1) = √0.99), never
from running the code. **Verification (as done):** only list a source as confirming a case after
opening it and checking its numbers; the sources are listed in a comment at the top of the
`describe('calculateWindTriangle')` block in `lib/calculatorFns.test.ts`:

- Ed Williams, Aviation Formulary V1.47, "Wind Triangles (2) Find HD, GS"
  (`https://edwilliams.org/avform147.htm`): confirms the formula and the sign convention (wind from
  the right gives a positive WCA); it has no numeric example.
- Omni Wind Correction Angle Calculator worked example
  (`https://www.omnicalculator.com/physics/wind-correction-angle`): TC 090, TAS 100, wind 045/20 →
  WCA −8°, heading 082° (whole degrees). Added as an extra case (exact: WCA −8.1301°, GS 60√2).
- Omni Ground Speed Calculator FAQ (`https://www.omnicalculator.com/physics/ground-speed`): GS =
  TAS ∓ WS in a pure head/tailwind and GS = TAS in still air; confirms rows 1, 2 and 6.
- Rows 3, 4 and 5 were not found in any accessible source (online E6B calculators only run in the
  browser). Instead, every row and the Omni case are also checked by **vector addition** (TAS
  along the heading + wind = groundspeed along the course, nothing across it), an independent
  method that doesn't use the `asin` formula.

Use `toBeCloseTo(x, 4)` (WCA and headings `toBeCloseTo(x, 3)`); the Omni case compares whole
degrees because Omni rounds.

| TC  | TAS | Wind     | WCA               | True heading | Groundspeed            |
| --- | --- | -------- | ----------------- | ------------ | ---------------------- |
| 090 | 100 | 090 / 20 | 0                 | 090          | 80 (pure headwind)     |
| 090 | 100 | 270 / 20 | 0                 | 090          | 120 (pure tailwind)    |
| 360 | 100 | 090 / 50 | 30 (right)        | 030          | 86.6025 (100·√3/2)     |
| 010 | 100 | 280 / 50 | −30 (left)        | 340          | 86.6025                |
| 180 | 100 | 210 / 20 | 5.7392 (asin 0.1) | 185.7392     | 82.1782 (√9900 − 10√3) |
| 123 | 110 | 360 / 0  | 0                 | 123          | 110 (calm)             |

- Heading wraps across north (row 4, and TC 350 / wind 080 at 50 → 020) and stays in [0, 360).
- Inputs are returned unchanged in the report.
- Units: TAS 185.2 km/h and wind 92.6 km/h (= 100 kt and 50 kt) with TC 360 / wind 090 give the
  row-3 result; groundspeed is 160.3879 km/h (86.60254 × 1.852).
- A crosswind equal to the TAS after a km/h conversion (TC 360, TAS 185.2, wind 090/185.2 km/h)
  gives a finite result (WCA 90°, groundspeed 0) thanks to the clamp.

Schema: valid input passes; missing fields; negative speeds rejected; directions 0 and 360.1
rejected, 1 and 360 accepted; TAS 0 rejected with only `"True airspeed must be greater than 0.00 kt"`;
TAS 600 accepted, 600.1 rejected; wind 200 accepted, 200.1 rejected; numeric strings coerced.
No-solution case rejected on `windSpeed` with the crosswind message: TC 360, TAS 100, wind
090/150 (crosswind component 150 > 100). Groundspeed cases rejected on `windSpeed` with the wind
message: TC 090, TAS 100, wind 090/100 (groundspeed 0), 090/120 (negative), and TC 360, TAS 100,
wind 090/100 (pure crosswind equal to the TAS, groundspeed 0). A crosswind component equal to the
TAS with a tailwind is accepted. Same checks pass in km/h with limit messages in km/h
(`0.00 km/h`, `1,111.20 km/h`, `370.40 km/h`).

## Acceptance criteria

- `/wind-triangle-calculator` appears in the Aviation section and in search.
- Results match the test table; WCA side labels correct; heading always 3 digits with `°`.
- Inputs are labelled "True Course" and "Wind Direction (true, from)"; the output is labelled
  "True Heading".
- Unsolvable wind/TAS combinations show the field error instead of a NaN report, including on
  import of a saved calculation.
- The test file lists the sources that confirm each case, and the vector addition check covers
  every case.
- Switching speed units converts both speed inputs and the groundspeed without changing physical
  values; storage is in kt.
- Save, rename, update, import, delete and free-plan limit work.
- Disclaimer under the report and in Info. Lint, typecheck, format check and tests pass.

## Open questions

None at the moment.
