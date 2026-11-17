# 02 Crosswind Calculator

Epic: `epic/aviation-calculators` (see `00-epic.md`) · Branch: `feature/crosswind-calculator`
(create from up-to-date `epic/aviation-calculators` after 01 is merged, PR back into it).

## Goal

Given a runway heading and the wind direction and speed, calculate the crosswind component (and
which side it comes from) and the headwind or tailwind component.

## Scope

- Full-stack calculator like `dividend-yield-calculator`: Prisma model, API routes, save, rename,
  update, import, delete, free-plan limit, tests.
- Angle helpers in `lib/units.ts` (reused by 03).
- Wind speed shown in the user's speed unit.

## Out of scope

- Gust component, variable winds (VRB), wind shear.
- Magnetic variation input. Users convert METAR (true) winds themselves; `Info.tsx` explains how.
- Comparing against an aircraft's maximum demonstrated crosswind.
- Runway selection among several runways.

## Foundation you rely on (from 01)

- `lib/units.ts`: `UnitPreferences`, `BASE_UNITS`, `UnitFields<T>`, `toBaseUnit`, `fromBaseUnit`,
  `getUnitSymbol(quantity, unit)`, `formatUnitValue(value, quantity, unit, fractionDigits?)`,
  `formDataToBaseUnits`, `formDataFromBaseUnits`.
- `hooks/useUnits.ts`: `useUnitsStore()` → `{ units }`.
- `schemas/index.ts`: `unitNumberFieldSchema(fieldName, quantity, unit, { min, max })` with limits
  in base units and messages in the user's unit; existing `positiveNumberFieldSchemaWithMax`.
- `hooks/useCalculator.ts`: optional `unitFields`; with it, `defaultValues` are base units and all
  conversions (calculate, save, update, import, reset, units change) happen inside the hook.
- `components/Form/NumberInputWithIcon.tsx`: `iconType="unit"` + `unitSymbol`.
- `components/Report/AviationDisclaimer.tsx` and `AVIATION_DISCLAIMER` in `constants/data.ts`.
- `constants/calculators.ts`: `category` field.

If any name differs in the merged code, follow the code.

## Inputs and outputs (base units)

| Field                   | Base unit | Preference | Notes                                                       |
| ----------------------- | --------- | ---------- | ----------------------------------------------------------- |
| `runwayHeading` (input) | degrees   | none       | magnetic, 0–360                                             |
| `windDirection` (input) | degrees   | none       | magnetic, direction the wind blows **from**, 0–360          |
| `windSpeed` (input)     | kt        | speed      | ≥ 0                                                         |
| `windAngle` (output)    | degrees   | none       | signed, (−180, 180]; positive = wind from the right         |
| `crosswind` (output)    | kt        | speed      | signed; positive = from the right, negative = from the left |
| `headwind` (output)     | kt        | speed      | signed; positive = headwind, negative = tailwind            |

`<x>UnitFields`: `{ windSpeed: 'speed' }`.

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

Sources: FAA Pilot's Handbook of Aeronautical Knowledge (FAA-H-8083-25, current edition), Aircraft
Performance chapter, "crosswind and headwind component chart" (the chart is a graphical form of
these two equations); the E6B crosswind computation gives the same components. Cite the PHAK in
the `calculateCrosswind` comment and in `Info.tsx`.

### Angle helpers (add to `lib/units.ts`)

- `normalizeDegrees(value)` → [0, 360). `normalizeDegrees(370) = 10`, `(-10) = 350`, `(360) = 0`.
- `signedAngleDifference(a, b)` → `a − b` normalized to (−180, 180].
  `(10, 350) = 20`, `(350, 10) = -20`, `(240, 60) = 180`.
- `toRadians(degrees)`.
- `formatDegrees(value)` → three digits and `°`, e.g. `"060°"`, `"005°"`. Display of 0 vs 360 is
  an open question.

## Zod schema rules (`schemas/index.ts`)

```ts
export const createCrosswindFormDataSchema = (units: UnitPreferences) =>
	z.object({
		runwayHeading: positiveNumberFieldSchemaWithMax('Runway heading', 360),
		windDirection: positiveNumberFieldSchemaWithMax('Wind direction', 360),
		windSpeed: unitNumberFieldSchema('Wind speed', 'speed', units.speed, { min: 0, max: 200 }),
	});

export const crosswindFormDataSchema = createCrosswindFormDataSchema(BASE_UNITS);
```

- Directions: 0–360 inclusive, decimals allowed (see open questions).
- Wind speed: 0 to 200 kt (proposed max, see open questions); messages in the user's unit, e.g.
  `"Wind speed cannot be greater than 370.4 km/h"`.
- No cross-field rules: every valid input has a result.

## Unit preferences

Uses speed (from 01). Adds none.

## UI

- `Calculator.tsx` (`'use client'`): mirror `dividend-yield-calculator/Calculator.tsx`.
  `defaultValues` (base units): `{ runwayHeading: 360, windDirection: 360, windSpeed: 0 }` (proposal).
  Schema via `useMemo(() => createCrosswindFormDataSchema(units), [units])`. Pass
  `unitFields: crosswindUnitFields` to `useCalculator`. Inputs:
    - `FormGroup`: "Runway Heading (magnetic)" (`iconType="unit" unitSymbol="°"`), "Wind
      Direction (magnetic, from)" (`°`). Use `DynamicFormLabel` with short labels ("Runway",
      "Wind Direction") if the long ones don't fit on small screens.
    - `FormGroup`: "Wind Speed" (`unitSymbol={getUnitSymbol('speed', units.speed)}`).
- `Report.tsx` (`'use client'`): `ReportSection` with
    - `ReportGroup` "Runway Heading" → `formatDegrees(runwayHeading)`.
    - `ReportGroup` "Wind" → `` `${formatDegrees(windDirection)} at ${formatUnitValue(windSpeed, 'speed', units.speed)}` ``.
    - `ReportDivider`.
    - `ReportGroup` "Crosswind" → absolute value + `"from the right"`/`"from the left"` (no side
      when it displays as 0).
    - `ReportGroup` "Headwind" or "Tailwind" → absolute value; pick the label from the value
      rounded to display precision so a −0.0 never shows as "Tailwind".
    - `<AviationDisclaimer />` last.
- `Info.tsx` (server component): what crosswind/headwind components are, why they matter (aircraft
  crosswind limits, tailwind effect on takeoff/landing distance), the formula; that wind direction
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
   `CrosswindReportProps extends ICrosswindFormData { windAngle; crosswind; headwind }`, add
   `CrosswindCalculation` to `CalculationType`.
4. `lib/units.ts` + `lib/units.test.ts`: angle helpers.
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
    with `db.crosswindCalculation` and `crosswindFormDataSchema`.
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
| 000    | 010      | 20      | 10        | same as runway 360    | same as runway 360    |
| 060    | 090      | 0       | 30        | 0                     | 0                     |

- Inputs are returned unchanged in the report.
- Units: a form value of 37.04 km/h converted with `formDataToBaseUnits` is 20 kt; with runway 060
  and wind 090 the crosswind is 10 kt, displayed as 18.52 km/h via `fromBaseUnit` (1 kt = 1.852
  km/h exactly).

Angle helpers: the examples in "Angle helpers" above.

Schema (`crosswindFormDataSchema`): valid input passes; each field missing → issue on that field;
negative direction/speed rejected; direction 360.1 rejected, 360 and 0 accepted; wind speed 200
accepted, 200.1 rejected; numeric strings coerced. `createCrosswindFormDataSchema({ ...BASE_UNITS,
speed: 'kmh' })`: 370.4 accepted, 371 rejected with a message containing `km/h`.

## Acceptance criteria

- `/crosswind-calculator` appears in the Aviation section of the landing page and in search.
- Calculations match the test table; left/right and headwind/tailwind labels are correct.
- Both direction inputs are labelled magnetic; Info explains converting METAR (true) winds.
- Switching speed units converts the wind speed in the form and the report without changing the
  physical value; saved calculations store kt (check in the API response) and import correctly in
  any unit.
- Save, rename, update, import, delete and the free-plan limit work like finance calculators.
- Validation messages show limits in the selected speed unit.
- Disclaimer under the report and in Info.
- Lint, typecheck, format check and tests pass.

## Open questions

1. **Runway input.** Exact runway heading in degrees (e.g. 063°), or runway number (e.g. 06 →
   060°)? The plan proposes degrees.
2. **Gusts.** Add an optional gust speed and show the gust crosswind component? Out of scope for
   now.
3. **Maximum wind speed** for validation: 200 kt proposed.
4. **Display precision**: whole knots (as in ATIS/METAR) or 1 decimal?
5. **North display**: show runway/wind north as `360°` (aviation convention) rather than `000°`?
   Should `0` be accepted as input for a calm wind direction?
