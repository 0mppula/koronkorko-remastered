# 02 Crosswind Calculator

Epic: `epic/aviation-calculators` (see `00-epic.md`) · Branch: `feature/crosswind-calculator`
(create from up-to-date `epic/aviation-calculators` after 01 is merged, PR back into it).

## Goal

Given a runway heading and the wind direction and speed (and optionally a gust speed), calculate
the crosswind component (and which side it comes from) and the headwind or tailwind component,
plus the same components for the gust when one is given.

## Scope

- Full-stack calculator like `dividend-yield-calculator`: Prisma model, API routes, save, rename,
  update, import, delete, free-plan limit, tests.
- Angle helpers and a heading field schema (reused by 03).
- Optional gust speed with gust crosswind and headwind/tailwind components.
- Wind and gust speed shown in the user's speed unit.

## Out of scope

- Variable winds (VRB), wind shear.
- Magnetic variation input. Users convert METAR (true) winds themselves; `Info.tsx` explains how.
- Comparing against an aircraft's maximum demonstrated crosswind.
- Runway selection among several runways.

## Foundation you rely on (from 01)

- `lib/units.ts`: `UnitPreferences`, `BASE_UNITS`, `UnitFields<T>`, `toBaseUnit`, `fromBaseUnit`,
  `getUnitSymbol(quantity, unit)`, `formatUnitValue(value, quantity, unit, fractionDigits?)`,
  `formDataToBaseUnits`, `formDataFromBaseUnits`.
- `hooks/useUnits.ts`: `useUnitsStore()` → `{ units }`.
- `schemas/index.ts`: `unitNumberFieldSchema(fieldName, quantity, unit, { min, max })` with limits
  in base units and messages in the user's unit; existing private helper `numberFieldSchema`.
- `hooks/useCalculator.ts`: optional `unitFields`; with it, `defaultValues` are base units and all
  conversions (calculate, save, update, import, reset, units change) happen inside the hook.
- `components/Form/NumberInputWithIcon.tsx`: `iconType="unit"` + `unitSymbol`.
- `components/Report/AviationDisclaimer.tsx` and `AVIATION_DISCLAIMER` in `constants/data.ts`.
- `constants/calculators.ts`: `category` field.

If any name differs in the merged code, follow the code.

## Inputs and outputs (base units)

| Field                    | Base unit | Preference | Notes                                                       |
| ------------------------ | --------- | ---------- | ----------------------------------------------------------- |
| `runwayHeading` (input)  | degrees   | none       | magnetic runway heading (e.g. 087), 1–360                   |
| `windDirection` (input)  | degrees   | none       | magnetic, direction the wind blows **from**, 1–360          |
| `windSpeed` (input)      | kt        | speed      | 0–200                                                       |
| `gustSpeed` (input)      | kt        | speed      | optional; > `windSpeed`, ≤ 200                              |
| `windAngle` (output)     | degrees   | none       | signed, (−180, 180]; positive = wind from the right         |
| `crosswind` (output)     | kt        | speed      | signed; positive = from the right, negative = from the left |
| `headwind` (output)      | kt        | speed      | signed; positive = headwind, negative = tailwind            |
| `gustCrosswind` (output) | kt        | speed      | only when `gustSpeed` is given; same sign convention        |
| `gustHeadwind` (output)  | kt        | speed      | only when `gustSpeed` is given; same sign convention        |

`crosswindUnitFields`: `{ windSpeed: 'speed', gustSpeed: 'speed' }`.

**Runway input (decided).** The runway input is the runway heading in degrees (e.g. `087`), not the
runway number. `Info.tsx` explains that the runway number is roughly the magnetic heading divided
by 10, so runway 09 is roughly 090°, and that the published runway heading is more precise.

**Wind reference (decided).** Wind direction and runway heading must use the same reference:
magnetic, as given by the tower or ATIS and as runway headings are published. There is no
variation input. METAR winds are true and must be converted to magnetic with the local variation
before entering them; `Info.tsx` explains this.

## Formulas

Vector decomposition of the wind relative to the runway:

- `windAngle = signedAngleDifference(windDirection, runwayHeading)` — wind direction minus runway
  heading, normalized to (−180, 180].
- `crosswind = windSpeed × sin(windAngle)`
- `headwind = windSpeed × cos(windAngle)`
- When `gustSpeed` is given: `gustCrosswind = gustSpeed × sin(windAngle)`,
  `gustHeadwind = gustSpeed × cos(windAngle)` (same direction, gust speed). Otherwise both are
  `undefined`.

Sources: FAA Pilot's Handbook of Aeronautical Knowledge (FAA-H-8083-25, current edition), Aircraft
Performance chapter, "crosswind and headwind component chart" (the chart is a graphical form of
these two equations); the E6B crosswind computation gives the same components. Cite the PHAK in
the `calculateCrosswind` comment and in `Info.tsx`.

### Angle helpers (add to `lib/units.ts`)

- `normalizeDegrees(value)` → [0, 360). `normalizeDegrees(370) = 10`, `(-10) = 350`, `(360) = 0`.
- `signedAngleDifference(a, b)` → `a − b` normalized to (−180, 180].
  `(10, 350) = 20`, `(350, 10) = -20`, `(240, 60) = 180`.
- `toRadians(degrees)`.
- `formatDegrees(value)` → whole degrees, three digits and `°`, e.g. `"087°"`, `"005°"`. For
  headings, north is shown as `"360°"` (a value that rounds to 0 or 360 displays as `360°`).
  For angles (e.g. the wind angle) pass the absolute value; an angle of 0 displays as `"000°"`.
  Use an option such as `formatDegrees(value, { heading: true })` to choose.

## Zod schema rules (`schemas/index.ts`)

```ts
export const headingFieldSchema = (fieldName: string) =>
	numberFieldSchema(fieldName)
		.min(1, { message: `${fieldName} must be between 1 and 360` })
		.max(360, { message: `${fieldName} must be between 1 and 360` });

export const createCrosswindFormDataSchema = (units: UnitPreferences) =>
	z
		.object({
			runwayHeading: headingFieldSchema('Runway heading'),
			windDirection: headingFieldSchema('Wind direction'),
			windSpeed: unitNumberFieldSchema('Wind speed', 'speed', units.speed, { min: 0, max: 200 }),
			gustSpeed: z.preprocess(
				(value) => (value === '' || value === null ? undefined : value),
				unitNumberFieldSchema('Gust speed', 'speed', units.speed, { min: 0, max: 200 }).optional()
			),
		})
		.superRefine((data, ctx) => { ... }); // gust must be greater than wind speed

export const crosswindFormDataSchema = createCrosswindFormDataSchema(BASE_UNITS);
```

- Headings/directions: 1–360 inclusive (north is 360, not 0), decimals allowed. `headingFieldSchema`
  is exported for reuse by 03.
- Wind speed: 0 to 200 kt (limit in base units); messages in the user's unit, e.g.
  `"Wind speed cannot be greater than 370.4 km/h"`.
- Gust speed (decided): optional (empty input = no gust); same 200 kt limit; when given it must be greater
  than the wind speed, issue on `gustSpeed`: `"Gust speed must be greater than wind speed"`.
- Every valid input has a result.

## Unit preferences

Uses speed (from 01). Adds none.

## UI

- `Calculator.tsx` (`'use client'`): mirror `dividend-yield-calculator/Calculator.tsx`.
  `defaultValues` (base units): `{ runwayHeading: 360, windDirection: 360, windSpeed: 0,
gustSpeed: undefined }` (proposal; calm wind is speed 0 with any direction).
  Schema via `useMemo(() => createCrosswindFormDataSchema(units), [units])`. Pass
  `unitFields: crosswindUnitFields` to `useCalculator`. Inputs:
    - `FormGroup`: "Runway Heading (magnetic)" (`iconType="unit" unitSymbol="°"`), "Wind
      Direction (magnetic, from)" (`°`). Use `DynamicFormLabel` with short labels ("Runway",
      "Wind Direction") if the long ones don't fit on small screens.
    - `FormGroup`: "Wind Speed" (`unitSymbol={getUnitSymbol('speed', units.speed)}`), "Gust
      Speed (optional)" (same symbol; bind `value={field.value ?? ''}`; no `ifFieldIsEmpty` reset
      to 0, empty means no gust).
    - Runway heading placeholder `"087"`.
- `Report.tsx` (`'use client'`): `ReportSection` with
    - `ReportGroup` "Runway Heading" → `formatDegrees(runwayHeading, { heading: true })`.
    - `ReportGroup` "Wind" → `` `${formatDegrees(windDirection, { heading: true })} at ${formatUnitValue(windSpeed, 'speed', units.speed)}` ``,
      plus `` ` gusting ${formatUnitValue(gustSpeed, ...)}` `` when a gust is given.
    - `ReportDivider`.
    - `ReportGroup` "Crosswind" → absolute value + `"from the right"`/`"from the left"` (no side
      when it displays as 0).
    - `ReportGroup` "Headwind" or "Tailwind" → absolute value; pick the label from the value
      rounded to display precision so a −0.0 never shows as "Tailwind".
    - When a gust is given: `ReportGroup` "Gust Crosswind" and "Gust Headwind"/"Gust Tailwind"
      with the same rules.
    - `<AviationDisclaimer />` last.
- `Info.tsx` (server component): what crosswind/headwind components are, why they matter (aircraft
  crosswind limits, tailwind effect on takeoff/landing distance), the formula; that the runway
  input is the runway heading and runway 09 is roughly 090°; that the gust components use the gust
  speed with the same wind direction; that wind direction
  is where the wind blows from and that both inputs must be magnetic (tower/ATIS winds and runway
  headings are magnetic, METAR winds are true and must first be converted with the local magnetic
  variation); the disclaimer sentence, `ReportSource` to the FAA handbook page
  (`https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak`, text
  `"FAA Pilot's Handbook of Aeronautical Knowledge"`).

## Files to create or change

Follow "Adding a calculator" and "Adding an aviation calculator" in AGENTS.md:

1. `prisma/schema.prisma`:
    ```prisma
    type CrosswindCalculationFormData {
      runwayHeading Float
      windDirection Float
      windSpeed     Float
      gustSpeed     Float?
    }

    model CrosswindCalculation {
      id        String                       @id @default(auto()) @map("_id") @db.ObjectId
      userId    String                       @db.ObjectId
      name      String
      formData  CrosswindCalculationFormData
      createdAt DateTime                     @default(now())
      updatedAt DateTime                     @updatedAt

      user User @relation(fields: [userId], references: [id], onDelete: Cascade)
    }
    ```
    Plus `CrosswindCalculations CrosswindCalculation[]` on `User`. Run `npx prisma generate`.
2. `schemas/index.ts`: schemas above.
3. `types/calculations.ts`: `ICrosswindFormData = z.infer<typeof crosswindFormDataSchema>`,
   `CrosswindReportProps extends ICrosswindFormData { windAngle; crosswind; headwind;
gustCrosswind?; gustHeadwind? }`, add `CrosswindCalculation` to `CalculationType`.
4. `lib/units.ts` + `lib/units.test.ts`: angle helpers. `schemas/index.ts`: `headingFieldSchema`.
5. `lib/calculatorFns.ts`: `calculateCrosswind(formData): CrosswindReportProps`.
6. `lib/calculatorFns.test.ts`: `describe('calculateCrosswind')`.
7. `schemas/index.test.ts`: `describe('crosswindFormDataSchema')` and a non-base-unit case for
   `createCrosswindFormDataSchema`.
8. `constants/api.ts`: `CROSSWIND_CALCULATIONS_API_URL = '/api/crosswind-calculations'`,
   `CROSSWIND_CALCULATIONS_QUERY_KEY = 'crosswind-calculations'`, added to `API_URLS`/`QUERY_KEYS`.
9. `constants/calculators.ts`:
   `{ name: 'Crosswind Calculator', url: 'crosswind-calculator', category: 'aviation', description: 'Calculate the crosswind and headwind or tailwind components for a runway, given the runway heading and the wind direction and speed. Additionally, logged in users can save their calculations.' }`.
10. `app/api/crosswind-calculations/route.ts` (`POST` with session + free-plan check, `GET`) and
    `[id]/route.ts` (`PUT`, `DELETE` scoped by `userId`), copied from the dividend yield routes
    with `db.crosswindCalculation` and `crosswindFormDataSchema`. The `POST` destructures and saves
    `gustSpeed` too (omitted when not given).
11. `app/(calculators)/crosswind-calculator/`: `page.tsx`, `Calculator.tsx`, `Report.tsx`,
    `Info.tsx`.
12. `README.md`: aviation section entry. `AGENTS.md`: list the calculator in Project.
    `docs/plans/aviation/00-epic.md`: check off 02.

## Test cases

`calculateCrosswind` — expected values are exact trigonometry (sin 30° = 0.5, cos 30° = √3/2,
sin 45° = cos 45° = √2/2, sin/cos 10° and 20° to 6 decimals), use `toBeCloseTo(x, 4)`:

| Runway | Wind dir | Wind kt | windAngle | Crosswind             | Headwind              |
| ------ | -------- | ------- | --------- | --------------------- | --------------------- |
| 060    | 090      | 20      | 30        | 10 (right)            | 17.3205 (20·√3/2)     |
| 060    | 030      | 20      | −30       | −10 (left)            | 17.3205               |
| 060    | 060      | 15      | 0         | 0                     | 15                    |
| 060    | 240      | 10      | 180       | 0                     | −10 (tailwind)        |
| 060    | 150      | 12      | 90        | 12 (right)            | 0                     |
| 270    | 315      | 30      | 45        | 21.2132 (30·√2/2)     | 21.2132               |
| 360    | 010      | 20      | 10        | 3.4730 (20·0.173648)  | 19.6962 (20·0.984808) |
| 010    | 350      | 20      | −20       | −6.8404 (20·0.342020) | 18.7939 (20·0.939693) |
| 060    | 090      | 0       | 30        | 0                     | 0                     |

- Gust: runway 060, wind 090 at 20 gusting 30 → crosswind 10, headwind 17.3205, gust crosswind 15
  (30 · 0.5), gust headwind 25.9808 (30·√3/2). Without `gustSpeed` both gust outputs are
  `undefined`.

- Inputs are returned unchanged in the report.
- Units: a form value of 37.04 km/h converted with `formDataToBaseUnits` is 20 kt; with runway 060
  and wind 090 the crosswind is 10 kt, displayed as 18.52 km/h via `fromBaseUnit` (1 kt = 1.852
  km/h exactly).

Angle helpers: the examples in "Angle helpers" above, plus `formatDegrees`: `87` → `"087°"`,
`5.4` → `"005°"`, heading `360` and `0` → `"360°"`, heading `359.6` → `"360°"`, angle `0` →
`"000°"`.

Schema (`crosswindFormDataSchema`): valid input passes; each required field missing → issue on that
field; gust missing or `''` passes; negative speed rejected; direction 0 and 360.1 rejected, 1 and
360 accepted (message "… must be between 1 and 360"); wind speed 200 accepted, 200.1 rejected;
gust equal to or below wind speed rejected on `gustSpeed`; gust above 200 rejected; numeric strings
coerced. `createCrosswindFormDataSchema({ ...BASE_UNITS, speed: 'kmh' })`: 370.4 accepted, 371
rejected with a message containing `km/h`.

## Acceptance criteria

- `/crosswind-calculator` appears in the Aviation section of the landing page and in search.
- Calculations match the test table; left/right and headwind/tailwind labels are correct.
- Both direction inputs are labelled magnetic; Info explains converting METAR (true) winds and that
  runway 09 is roughly 090°.
- Headings show as three whole digits with north as `360°`; speeds show 1 decimal.
- With a gust, the report also shows gust crosswind and gust headwind/tailwind; without one it
  doesn't, and saving/importing a calculation without a gust works.
- Switching speed units converts the wind speed in the form and the report without changing the
  physical value; saved calculations store kt (check in the API response) and import correctly in
  any unit.
- Save, rename, update, import, delete and the free-plan limit work like finance calculators.
- Validation messages show limits in the selected speed unit.
- Disclaimer under the report and in Info.
- Lint, typecheck, format check and tests pass.

## Open questions

None at the moment.
