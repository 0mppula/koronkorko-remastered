# 09 Cloud Base Calculator

Branch: `feature/aviation-wave-3` (from an up-to-date `master`; plans 08–12 are written and all
five calculators are implemented there, in order 08 → 12). The aviation epic is closed; there is
no epic branch.

Follow "Adding a calculator" and "Adding an aviation calculator" in `AGENTS.md`. This plan only
lists what is specific to this calculator; conventions are as in `01-foundation.md` and
`04-density-altitude-calculator.md` (temperature differences use `fromBaseTemperatureDifference`
and `formatTemperatureDifference`).

## Goal

Given the surface temperature and dew point, estimate the cloud base above ground level (AGL) with
the PHAK convergence rule, and above mean sea level (MSL) when the field elevation is given. Uses
the existing temperature and altitude units; no new unit preference.

## Decisions

- **Rule:** PHAK's convergence rate of 4.4 °F per 1,000 ft (see "Formulas"). Other rules (e.g.
  400 ft or 125 m per °C) are not used or shown.
- **Elevation:** optional. Cloud base AGL is always shown; MSL only when the elevation is given.
- **Extra output:** the temperature/dew point spread, shown without a sign (it is never
  negative) with `formatUnsignedTemperatureDifference`.
- **Dew point above temperature:** rejected. Equal values give a cloud base of 0 ft AGL;
  `Info.tsx` explains that a zero or small spread means fog or very low cloud. The schema allows
  the dew point a float tolerance above the temperature, so `calculateCloudBase` clamps the
  spread to `Math.max(0, temperature − dewPoint)`.
- **Limits (base units):** temperature and dew point −60 to +60 °C, elevation −1,500 to 30,000 ft,
  computed cloud base MSL ≤ 60,000 ft (reachable: 120 °C spread gives 49,090.91 ft AGL).
- **Applicability:** the rule is for convective (cumulus) cloud in rising, unstable air
  (PHAK's wording); `Info.tsx` says so and that it doesn't apply to stratus, fog or frontal cloud.

## Scope

- Full-stack calculator (Prisma model, API routes, save, rename, update, import, delete, free-plan
  limit, tests).

## Out of scope

- Other cloud types, freezing level, temperature at the cloud base, humidity/relative humidity,
  METAR parsing.

## Inputs and outputs (base units)

| Field                   | Base unit | Preference  | Notes                                                 |
| ----------------------- | --------- | ----------- | ----------------------------------------------------- |
| `temperature` (input)   | °C        | temperature | −60 to +60                                            |
| `dewPoint` (input)      | °C        | temperature | −60 to +60, ≤ temperature                             |
| `elevation` (input)     | ft        | altitude    | optional (`.nullish()`); −1,500 to 30,000             |
| `spread` (output)       | °C (diff) | temperature | ≥ 0; shown with `formatUnsignedTemperatureDifference` |
| `cloudBaseAgl` (output) | ft        | altitude    |                                                       |
| `cloudBaseMsl` (output) | ft        | altitude    | `null` without elevation                              |

`cloudBaseUnitFields`: `{ temperature: 'temperature', dewPoint: 'temperature', elevation:
'altitude' }`.

## Formulas

Source: FAA PHAK (FAA-H-8083-25C), chapter 12 "Weather Theory", p. 12-14: "When lifted, unsaturated
air cools at a rate of 5.4 °F per 1,000 feet and the dew point temperature decreases at a rate of
1 °F per 1,000 feet. This results in a convergence of temperature and dew point at a rate of
4.4 °F." Worked example: 85 °F / 71 °F, "14 °F ÷ 4.4 °F = 3.18", "3.18 × 1,000 = 3,180 feet AGL".

- `spread = max(0, temperature − dewPoint)` (°C, a difference).
- `cloudBaseAgl = spread × 9/5 / 4.4 × 1,000` (ft). The spread is converted to °F as a
  **difference** (× 9/5, no offset), so the same formula holds in every temperature unit.
- `cloudBaseMsl = cloudBaseAgl + elevation`, or `null`.

PHAK rounds the quotient to 3.18 before multiplying; the code doesn't round (3,181.82 ft).

## Zod schema rules (`schemas/index.ts`)

- `createCloudBaseFormDataSchema(units)` with `unitNumberFieldSchema` for `temperature`
  ("Temperature"), `dewPoint` ("Dew point") (`min: -60, max: 60`) and `elevation` ("Elevation",
  `min: -1500, max: 30000`, in a `z.preprocess` that turns `''`/`null` into `undefined`, then
  `.nullish()`; an empty elevation parses to `undefined`); `cloudBaseFormDataSchema =
createCloudBaseFormDataSchema(BASE_UNITS)`.
- Cross-field (`superRefine`), only when the involved fields passed their own checks (same
  `createUnitLimits` guards as 06):
    - dew point > temperature (tolerance as the unit limits) → path `dewPoint`, `"Dew point
cannot be higher than the temperature"`.
    - with an elevation: computed MSL > 60,000 ft → path `elevation` (the spread alone can't
      exceed the limit), `"The resulting cloud base would exceed 60,000 ft MSL"` in the user's
      altitude unit, rounded inwards (`18,288 m`).
- Messages show the user's unit, rounded inwards (01): e.g. `"Temperature cannot be greater than
140.00 °F"`, `"Elevation cannot be greater than 9,144 m"`.

## UI

- `Calculator.tsx`: defaults (base units) `{ temperature: 15, dewPoint: 5, elevation: null }`.
  Inputs: "Temperature", "Dew Point" (temperature symbol, `min0={false}`), "Field Elevation"
  (altitude symbol, `min0={false}`, optional, placeholder "Optional").
- `Report.tsx`: inputs (Field Elevation only when given), `ReportDivider`, Temperature/Dew Point
  Spread (`formatUnsignedTemperatureDifference`, e.g. `14.00 °F`), Cloud Base (AGL) and, when
  calculated, Cloud Base (MSL) (`formatBaseValue` altitude, whole),
  `<CalculatorDisclaimer category="aviation" />`.
- `Info.tsx`: the PHAK rule and example, convective cloud only, spread 0 → fog/very low cloud,
  AGL vs MSL, `<p>{calculatorDisclaimers.aviation}</p>`, `ReportSource` to the PHAK page.

## Files to create or change

1. `prisma/schema.prisma`: `type CloudBaseCalculationFormData { temperature Float dewPoint Float
elevation Float? }`, `model CloudBaseCalculation`, `CloudBaseCalculations
CloudBaseCalculation[]` on `User`. Run `npx prisma generate`.
2. `schemas/index.ts` + test.
3. `types/calculations.ts`: `ICloudBaseFormData`, `CloudBaseReportProps extends
ICloudBaseFormData { spread: number; cloudBaseAgl: number; cloudBaseMsl: number | null }`, add
   to `CalculationType`.
4. `lib/calculatorFns.ts` + test: `calculateCloudBase`. `lib/units.ts` + test:
   `formatUnsignedTemperatureDifference(baseValue, unit)` (`formatUnitValue` of
   `fromBaseTemperatureDifference`: no sign, no 32° offset).
5. `constants/api.ts`: `CLOUD_BASE_CALCULATIONS_API_URL = '/api/cloud-base-calculations'`,
   `CLOUD_BASE_CALCULATIONS_QUERY_KEY = 'cloud-base-calculations'`.
6. `constants/calculators.ts`: `{ name: 'Cloud Base Calculator', url: 'cloud-base-calculator',
category: 'aviation', description: 'Estimate the cloud base above ground level and mean sea
level, given the temperature, dew point and field elevation. Additionally, logged in users can
save their calculations.' }`.
7. `app/api/cloud-base-calculations/route.ts` and `[id]/route.ts` (`POST` saves `null` as
   `?? undefined`).
8. `app/(calculators)/cloud-base-calculator/`: `page.tsx`, `Calculator.tsx`, `Report.tsx`,
   `Info.tsx`.
9. `README.md` aviation entry; `00-epic.md` follow-up (mark 09 done).

## Test cases

`calculateCloudBase` (`toBeCloseTo(x, 2)` for altitudes):

| Temperature          | Dew point            | Elevation | Spread (°C) | AGL (ft)  | MSL (ft)  | Source                    |
| -------------------- | -------------------- | --------- | ----------- | --------- | --------- | ------------------------- |
| 29.4444 °C (= 85 °F) | 21.6667 °C (= 71 °F) | —         | 7.777778    | 3,181.82  | `null`    | PHAK 12-14 (3,180 ft AGL) |
| 15 °C                | 5 °C                 | 1,000     | 10          | 4,090.91  | 5,090.91  | Exact                     |
| 20 °C                | 20 °C                | —         | 0           | 0         | `null`    | Exact (fog)               |
| 60 °C                | −60 °C               | 10,909    | 120         | 49,090.91 | 59,999.91 | Exact (MSL limit corner)  |

- Row 1: PHAK rounds 14 / 4.4 to 3.18 and gets 3,180 ft; assert 3,181.82 and that it is within
  0.1 % of PHAK's 3,180 (comment why).
- Values are exact rational arithmetic (`spread × 1.8 / 4.4 × 1,000`), computed independently in a
  standalone Python `decimal` script, never by running `calculateCloudBase`. Put the source and
  method in a comment at the top of the `describe` block.
- Independent check: at the returned AGL height `h`, the temperature lowered by 5.4 °F per 1,000 ft
  equals the dew point lowered by 1 °F per 1,000 ft (PHAK's two rates), in °F.
- Units: 59 °F / 41 °F (= 15 / 5 °C) give 4,090.91 ft = 1,246.91 m; the spread shows `18.00 °F`
  (difference, no offset, no sign).
- A dew point 1e-10 °C above the temperature gives a spread and AGL of exactly 0.

`formatUnsignedTemperatureDifference`: 10 °C → `10.00 °C` / `18.00 °F`; 0 → `0.00 °C`;
70/9 °C (PHAK's 14 °F spread) → `14.00 °F`.

Schema: valid input passes; missing temperature or dew point; elevation `null`/missing/`''`
accepted as none (`undefined`); temperature and dew point −60 and 60 accepted, one step beyond
rejected (messages in °F); elevation −1,500 and 30,000 accepted, beyond rejected (messages in m);
dew point above temperature rejected on `dewPoint`, equal accepted; MSL limit: 60 / −60 °C with
elevation 10,909 ft accepted, 10,910 ft rejected on `elevation` (`"... 60,000 ft MSL"`, in m
`"... 18,288 m MSL"`); the cross-field messages aren't added when a field already failed; numeric
strings coerced; `BUG:` (zod 3.22 preprocess) an invalid elevation isn't reported together with an
invalid temperature.

## Acceptance criteria

- `/cloud-base-calculator` appears in the Aviation section, the category filter and search.
- Results match the PHAK example in every temperature and altitude unit; storage is °C and ft.
- Spread is shown as an unsigned temperature difference; MSL only with an elevation.
- Save, rename, update, import, delete and free-plan limit work. Disclaimer present.
- Lint, typecheck, format check and tests pass.

## Open questions

None at the moment.
