# 03 Wind Triangle Calculator

Epic: `epic/aviation-calculators` (see `00-epic.md`) · Branch: `feature/wind-triangle-calculator`
(create from up-to-date `epic/aviation-calculators` after 01 and 02 are merged, PR back into it).

## Goal

Given a true course, true airspeed (TAS) and the wind direction and speed, calculate the wind
correction angle (WCA), the true heading to fly and the groundspeed — the E6B wind side
computation.

## Scope

- Full-stack calculator like `dividend-yield-calculator`: Prisma model, API routes, save, rename,
  update, import, delete, free-plan limit, tests.
- Validation that rejects winds for which the course cannot be flown.

## Out of scope

- Magnetic heading (variation/deviation), compass heading.
- Distance, time en route and fuel (no distance preference yet).
- Calculating the wind from heading/groundspeed (reverse problem).
- TAS from indicated airspeed.

## Foundation you rely on (from 01 and 02)

- `lib/units.ts`: `UnitPreferences`, `BASE_UNITS`, `UnitFields<T>`, `getUnitSymbol`,
  `formatUnitValue`, `formDataToBaseUnits`, `formDataFromBaseUnits`, and from 02
  `normalizeDegrees`, `signedAngleDifference`, `toRadians`, `formatDegrees`.
- `hooks/useUnits.ts`: `useUnitsStore()` → `{ units }`.
- `schemas/index.ts`: `unitNumberFieldSchema(fieldName, quantity, unit, { min, max, minExclusive })`
  (limits in base units, messages in the user's unit), `positiveNumberFieldSchemaWithMax`.
- `hooks/useCalculator.ts`: optional `unitFields`; base-unit `defaultValues`; conversions inside
  the hook.
- `NumberInputWithIcon` `iconType="unit"` + `unitSymbol`; `AviationDisclaimer`;
  `category` in `constants/calculators.ts`.
- `app/(calculators)/crosswind-calculator/` as the closest example.

If any name differs in the merged code, follow the code.

## Inputs and outputs (base units)

| Field                          | Base unit | Preference | Notes                                                         |
| ------------------------------ | --------- | ---------- | ------------------------------------------------------------- |
| `trueCourse` (input)           | degrees   | none       | 0–360                                                         |
| `trueAirspeed` (input)         | kt        | speed      | > 0                                                           |
| `windDirection` (input)        | degrees   | none       | true, direction the wind blows **from**, 0–360                |
| `windSpeed` (input)            | kt        | speed      | ≥ 0                                                           |
| `windCorrectionAngle` (output) | degrees   | none       | signed; positive = correct right (into a wind from the right) |
| `trueHeading` (output)         | degrees   | none       | normalized                                                    |
| `groundspeed` (output)         | kt        | speed      | > 0 for valid input                                           |

`windTriangleUnitFields`: `{ trueAirspeed: 'speed', windSpeed: 'speed' }`.

## Formulas

With `δ = windDirection − trueCourse` (angle of the wind relative to the course):

- `windCorrectionAngle = asin(windSpeed × sin(δ) / trueAirspeed)`
- `trueHeading = normalizeDegrees(trueCourse + windCorrectionAngle)`
- `groundspeed = trueAirspeed × cos(windCorrectionAngle) − windSpeed × cos(δ)`

A solution exists only when `|windSpeed × sin(δ)| ≤ trueAirspeed` (otherwise `asin` is undefined)
and the resulting `groundspeed > 0`.

Sources: this is the closed-form solution of the wind triangle that the E6B wind side solves
graphically; it is described in the Navigation chapter of the FAA Pilot's Handbook of Aeronautical
Knowledge (FAA-H-8083-25, wind triangle) and given in this form in Ed Williams' "Aviation
Formulary" ("heading and groundspeed from course, TAS and wind"). Cite them in the
`calculateWindTriangle` comment and `Info.tsx`. Verify the formula against the Formulary before
implementing (see open questions).

## Zod schema rules (`schemas/index.ts`)

```ts
export const createWindTriangleFormDataSchema = (units: UnitPreferences) =>
	z
		.object({
			trueCourse: positiveNumberFieldSchemaWithMax('True course', 360),
			trueAirspeed: unitNumberFieldSchema('True airspeed', 'speed', units.speed, {
				min: 0,
				minExclusive: true,
				max: 600,
			}),
			windDirection: positiveNumberFieldSchemaWithMax('Wind direction', 360),
			windSpeed: unitNumberFieldSchema('Wind speed', 'speed', units.speed, { min: 0, max: 200 }),
		})
		.superRefine((data, ctx) => { ... });

export const windTriangleFormDataSchema = createWindTriangleFormDataSchema(BASE_UNITS);
```

- `superRefine` (like `breakEvenPointFormDataSchema`): if `|windSpeed × sin(δ)| > trueAirspeed` or
  the groundspeed would be ≤ 0, add an issue on `windSpeed`:
  `"Wind is too strong for this true airspeed and course"`. Both speeds are in the same unit
  within one schema, so the check works in any unit.
- Limits: TAS > 0 and ≤ 600 kt, wind speed 0–200 kt (proposals, see open questions); messages in
  the user's unit.

## Unit preferences

Uses speed (from 01). Adds none.

## UI

- `Calculator.tsx`: mirror the crosswind calculator. `defaultValues` (base units, proposal):
  `{ trueCourse: 360, trueAirspeed: 100, windDirection: 360, windSpeed: 0 }`. Inputs in two
  `FormGroup`s: "True Course" (`°`), "True Airspeed" (speed symbol); "Wind Direction (true,
  from)" (`°`), "Wind Speed" (speed symbol).
- `Report.tsx`: `ReportGroup`s for True Course, True Airspeed, Wind (`"090° at 20 kt"`),
  `ReportDivider`, Wind Correction Angle (absolute value + `"right"`/`"left"`, no side when it
  displays as 0), True Heading (`formatDegrees`), Groundspeed (`formatUnitValue`), then
  `<AviationDisclaimer />`.
- `Info.tsx`: what the wind triangle is (course vs heading, TAS vs groundspeed, WCA), that wind
  direction is "from" and must be true to match a true course (winds aloft forecasts are true),
  the formula, the disclaimer sentence, `ReportSource` to the FAA handbook page
  (`https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak`).

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
11. `README.md` aviation entry, `AGENTS.md` Project list, check off 03 in `00-epic.md`.

## Test cases

`calculateWindTriangle` — exact derivations (sin 30° = 0.5, cos 30° = √3/2, asin(0.5) = 30°,
cos(asin 0.1) = √0.99); use `toBeCloseTo(x, 4)` (headings `toBeCloseTo(x, 3)`):

| TC  | TAS | Wind     | WCA               | True heading | Groundspeed            |
| --- | --- | -------- | ----------------- | ------------ | ---------------------- |
| 090 | 100 | 090 / 20 | 0                 | 090          | 80 (pure headwind)     |
| 090 | 100 | 270 / 20 | 0                 | 090          | 120 (pure tailwind)    |
| 360 | 100 | 090 / 50 | 30 (right)        | 030          | 86.6025 (100·√3/2)     |
| 010 | 100 | 280 / 50 | −30 (left)        | 340          | 86.6025                |
| 180 | 100 | 210 / 20 | 5.7392 (asin 0.1) | 185.7392     | 82.1782 (√9900 − 10√3) |
| 123 | 110 | 000 / 0  | 0                 | 123          | 110 (calm)             |

- Heading wraps across north (row 4) and stays in [0, 360).
- Inputs are returned unchanged in the report.
- Units: TAS 185.2 km/h and wind 92.6 km/h (= 100 kt and 50 kt) with TC 360 / wind 090 give the
  row-3 result; groundspeed is 160.3879 km/h (86.60254 × 1.852).
- Once you provide an E6B or PHAK worked example (see open questions), add it with a tolerance
  matching the E6B's reading accuracy.

Schema: valid input passes; missing fields; negative values; directions > 360 rejected; TAS 0
rejected (`"True airspeed must be greater than 0 kt"`); TAS 600 accepted, 600.1 rejected; numeric
strings coerced. Unsolvable winds rejected on `windSpeed`: TC 360, TAS 100, wind 090/150
(crosswind > TAS); TC 090, TAS 100, wind 090/100 (groundspeed 0); TC 090, TAS 100, wind 090/120
(negative groundspeed). Same checks pass in km/h with the message unit shown in km/h.

## Acceptance criteria

- `/wind-triangle-calculator` appears in the Aviation section and in search.
- Results match the test table; WCA side labels correct; heading always 3 digits with `°`.
- Unsolvable wind/TAS combinations show the field error instead of a NaN report, including on
  import of a saved calculation.
- Switching speed units converts both speed inputs and the groundspeed without changing physical
  values; storage is in kt.
- Save, rename, update, import, delete and free-plan limit work.
- Disclaimer under the report and in Info. Lint, typecheck, format check and tests pass.

## Open questions

1. **Wind direction reference.** Wind direction is where the wind blows **from**. Winds aloft
   forecasts and METARs are true; ATIS/tower winds are magnetic. The wind triangle works with a
   **true** course, so the plan labels the input "Wind Direction (true, from)". Confirm the label
   and the true/magnetic statements (against the AIM) before they go into `Info.tsx`.
2. **Magnetic heading.** Add a magnetic variation input (east/west) to also show magnetic heading?
   Out of scope for now.
3. **Worked example.** Which E6B or PHAK worked example should be the reference test? Please
   provide the values (course, TAS, wind, expected heading and groundspeed) from the source; the
   plan does not quote one to avoid guessing.
4. **Formula verification.** Confirm the closed-form formula above against Ed Williams' Aviation
   Formulary (or another source you prefer) before implementation.
5. **Limits.** TAS max 600 kt and wind max 200 kt?
6. **Precision.** Heading in whole degrees (E6B practice) and WCA to 1 decimal? Groundspeed whole
   knots or 1 decimal?
