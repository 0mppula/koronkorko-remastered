# 06 True Airspeed Calculator

Branch: `feature/tas-and-tsd-calculators` (06 and 07 are built together on one branch, created from
an up-to-date `master` after `feature/landing-filter-and-aviation-plans` is merged; PR into
`master`). The aviation epic is closed (see `00-epic.md`); there is no epic branch.

Follow "Adding a calculator" and "Adding an aviation calculator" in `AGENTS.md`. This plan only
lists what is specific to this calculator; conventions (unit fields, exact base values, limits,
disclaimer, report formatting) are as in `01-foundation.md` and `04-density-altitude-calculator.md`.

## Goal

Given the calibrated airspeed (CAS), pressure altitude and outside air temperature (OAT),
calculate the true airspeed (TAS), the Mach number and the density altitude. Uses the existing
speed, altitude and temperature units; no new unit preference.

## Decisions

- **CAS input**, not IAS. `Info.tsx` explains that CAS comes from the airspeed calibration table
  in the aircraft's POH and that IAS ≈ CAS only if position and instrument error are ignored (they
  are approximately the same at cruise and may differ by several knots at low speeds, PHAK).
- **Pressure altitude** is entered directly (no field elevation + QNH). If it isn't known, `Info.tsx`
  points to the Density Altitude Calculator (`/density-altitude-calculator`), which computes it
  from elevation and QNH.
- **Exact compressible formula** for all results. The incompressible formula and the rules of
  thumb appear in `Info.tsx` only, never in results.
- **Outputs:** TAS, Mach number, density altitude.
- **OAT is the static (true) outside air temperature.** `Info.tsx` notes that an indicated OAT
  reads high at speed because of ram rise.
- **Rules of thumb (Info only):** both are mentioned: add about 2 % of CAS per 1,000 ft (PHAK) and
  TAS rises roughly 1.5 % per 1,000 ft (Aviation Formulary).
- **Limits (base units):** CAS > 0 and ≤ 400 kt, pressure altitude −1,500 to 36,000 ft
  (troposphere), OAT −70 to +60 °C. Inputs that give Mach ≥ 1 are rejected with a cross-field
  message.
- **Density altitude above the troposphere:** when the density altitude is above 36,089 ft (the ISA
  tropopause, 11,000 m), the calculator returns `densityAltitude: null` and the report shows
  "Above 36,089 ft (not calculated)" (the tropopause formatted in the user's altitude unit). TAS
  and Mach are still shown.

## Scope

- Full-stack calculator (Prisma model, API routes, save, rename, update, import, delete, free-plan
  limit, tests).
- Shared private ISA helpers in `lib/calculatorFns.ts` (see "Formulas").

## Out of scope

- IAS → CAS correction (no calibration table input), ram-rise correction of an indicated OAT.
- Supersonic flight (Rayleigh pitot formula), altitudes above 36,000 ft.
- Field elevation + QNH input (use the Density Altitude Calculator).

## Inputs and outputs (base units)

| Field                           | Base unit | Preference  | Notes                                    |
| ------------------------------- | --------- | ----------- | ---------------------------------------- |
| `calibratedAirspeed` (input)    | kt        | speed       | > 0, ≤ 400                               |
| `pressureAltitude` (input)      | ft        | altitude    | −1,500 to 36,000; may be negative        |
| `outsideAirTemperature` (input) | °C        | temperature | −70 to +60; static air temperature       |
| `mach` (output)                 | —         | none        | shown with 3 decimals (e.g. `0.452`)     |
| `trueAirspeed` (output)         | kt        | speed       |                                          |
| `densityAltitude` (output)      | ft        | altitude    | `null` when above 36,089 ft (tropopause) |

`trueAirspeedUnitFields`: `{ calibratedAirspeed: 'speed', pressureAltitude: 'altitude',
outsideAirTemperature: 'temperature' }`.

## Formulas

Sources: ICAO Doc 7488/3 (Manual of the ICAO Standard Atmosphere) constants, already in
`lib/calculatorFns.ts` for `calculateDensityAltitude`; Aviation Formulary V1.47 (Ed Williams,
`https://edwilliams.org/avform147.htm`), section "Mach numbers, true vs calibrated airspeeds";
FAA PHAK (FAA-H-8083-25C), chapter 8, "Types of Airspeed" (p. 8-9).

Work in SI, convert with `fromBaseUnit`/`toBaseUnit` (`altitude` `m`, `speed` `ms`):

1. Static pressure at the pressure altitude `h` (m): `P = P0 × (1 − L × h / T0)^n` (ISA, as in 04).
2. Speed of sound: `a = √(κ × R × T)`, `T = OAT + 273.15`, `κ = 1.4` (ratio of specific heats of
   air; the Formulary's `38.967854 = sqrt(gamma R/M)`). With the ICAO constants, `a0 = √(κ × R ×
T0)` = 340.294 m/s = 661.4786 kt, matching the Formulary's `CS_0 = 661.4786 knots`.
3. Impact pressure from CAS: `qc = P0 × ((1 + 0.2 × (CAS / a0)²)^3.5 − 1)`.
4. Mach number: `M = √(5 × ((qc / P + 1)^(2/7) − 1))` (valid for M < 1).
5. `TAS = M × a`.
6. Density altitude from `ρ = P / (R × T)`: `DA = (T0 / L) × (1 − (ρ / ρ0)^(1/(n − 1)))` (as in 04);
   `null` if DA > 11,000 m.

Steps 3–5 are the Formulary's formulas (`DP`, `M`, `TAS = M*CS`), written with the ICAO
constants. Refactor `calculateDensityAltitude` to share private helpers for steps 1 and 6
(`isaPressureAtAltitude`, `densityAltitudeFromDensity`) without changing its results (its tests
must still pass unchanged). Add `AIR_ADIABATIC_INDEX = 1.4` and `ISA_TROPOPAUSE_ALTITUDE_M = 11000`
next to the existing ISA constants. Export `calculateMach(calibratedAirspeed, pressureAltitude)`
(base units) for the schema's Mach check.

`Info.tsx` only (never used for results):

- Incompressible approximation for low speeds (M < 0.3): `TAS = CAS × √(ρ0 / ρ)` (Formulary).
- Rules of thumb: add 2 % of CAS per 1,000 ft (PHAK p. 8-9: "Simply add 2 percent to the CAS for
  each 1,000 feet of altitude"); roughly 1.5 % per 1,000 ft (Formulary). Both are approximate;
  results differ from them.
- Ram rise: indicated OAT ≈ OAT + K × TAS² / 7592 (°C, kt; recovery factor K usually 0.95–1.0,
  Formulary).

## Zod schema rules (`schemas/index.ts`)

```ts
export const createTrueAirspeedFormDataSchema = (units: UnitPreferences) =>
	z
		.object({
			calibratedAirspeed: unitNumberFieldSchema('Calibrated airspeed', 'speed', units.speed, {
				min: 0,
				minExclusive: true,
				max: 400,
			}),
			pressureAltitude: unitNumberFieldSchema(
				'Pressure altitude',
				'altitude',
				units.altitude,
				{ min: -1500, max: 36000 }
			),
			outsideAirTemperature: unitNumberFieldSchema(
				'Outside air temperature',
				'temperature',
				units.temperature,
				{ min: -70, max: 60 }
			),
		})
		.superRefine((data, ctx) => { ... }); // Mach check, see below

export const trueAirspeedFormDataSchema = createTrueAirspeedFormDataSchema(BASE_UNITS);
```

- Mach check: if `calibratedAirspeed` and `pressureAltitude` are finite numbers (skip otherwise, to
  avoid duplicate issues; zod runs `superRefine` on dirty data), convert them to base units and
  reject `calculateMach(...) >= 1` on path `calibratedAirspeed` with
  `"Calibrated airspeed gives Mach 1 or more at this pressure altitude; only subsonic speeds are
supported"`. Mach depends only on CAS and pressure altitude, not on OAT.
- Messages show the user's unit, rounded inwards (as in 01): e.g. `"Calibrated airspeed cannot be
greater than 740.80 km/h"`, `"Pressure altitude cannot be greater than 10,972 m"` (36,000 ft =
  10,972.8 m), `"Pressure altitude cannot be lower than -457 m"`, `"Outside air temperature cannot
be lower than -94.00 °F"`.

## UI

- `Calculator.tsx`: defaults (base units) `{ calibratedAirspeed: 120, pressureAltitude: 5000,
outsideAirTemperature: 5 }`. Inputs: "Calibrated Airspeed (CAS)" (`DynamicFormLabel`, short
  "CAS"; speed symbol), "Pressure Altitude" (altitude symbol, `min0={false}`), "Outside Air
  Temperature" (temperature symbol, `min0={false}`).
- `Report.tsx`: inputs, `ReportDivider`, True Airspeed (`formatBaseValue` speed), Mach Number
  (3 decimals), Density Altitude (`formatBaseValue` altitude, or "Above <tropopause in user's
  unit> (not calculated)" when `null`), `<CalculatorDisclaimer category="aviation" />`.
- `Info.tsx`: IAS, CAS and TAS (PHAK); CAS from the POH airspeed calibration table, IAS ≈ CAS at
  cruise, several knots apart at low speed; if the pressure altitude isn't known, a link to the
  Density Altitude Calculator, which computes it from elevation and QNH; static vs indicated OAT
  (ram rise); the exact compressible method; the incompressible formula and both rules of thumb
  as approximations; `<p>{calculatorDisclaimers.aviation}</p>`; `ReportSource` to the PHAK page
  (`https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak`, text
  `"FAA Pilot's Handbook of Aeronautical Knowledge"`). The Formulary is named in the text.

## Files to create or change

1. `prisma/schema.prisma`: `type TrueAirspeedCalculationFormData { calibratedAirspeed Float
pressureAltitude Float outsideAirTemperature Float }`, `model TrueAirspeedCalculation`,
   `TrueAirspeedCalculations TrueAirspeedCalculation[]` on `User`. Run `npx prisma generate`.
2. `schemas/index.ts` + test: schemas above.
3. `types/calculations.ts`: `ITrueAirspeedFormData`, `TrueAirspeedReportProps extends
ITrueAirspeedFormData { mach: number; trueAirspeed: number; densityAltitude: number | null }`,
   add to `CalculationType`.
4. `lib/calculatorFns.ts` + test: `calculateTrueAirspeed`, `calculateMach`, shared ISA helpers.
5. `constants/api.ts`: `TRUE_AIRSPEED_CALCULATIONS_API_URL = '/api/true-airspeed-calculations'`,
   `TRUE_AIRSPEED_CALCULATIONS_QUERY_KEY = 'true-airspeed-calculations'`.
6. `constants/calculators.ts`: `{ name: 'True Airspeed Calculator', url:
'true-airspeed-calculator', category: 'aviation', description: 'Calculate the true airspeed,
Mach number and density altitude, given the calibrated airspeed, pressure altitude and outside
air temperature. Additionally, logged in users can save their calculations.' }`.
7. `app/api/true-airspeed-calculations/route.ts` and `[id]/route.ts`.
8. `app/(calculators)/true-airspeed-calculator/`: `page.tsx`, `Calculator.tsx`, `Report.tsx`,
   `Info.tsx`.
9. `README.md` aviation entry; the second-wave follow-up in `00-epic.md` (mark 06 done).

## Test cases

`calculateTrueAirspeed` (Mach `toBeCloseTo(x, 4)`, TAS `toBeCloseTo(x, 1)`, DA
`toBeCloseTo(x, 0)` unless stated):

| CAS (kt) | PA (ft) | OAT (°C) | Mach     | TAS (kt) | DA (ft)  | Source                                         |
| -------- | ------- | -------- | -------- | -------- | -------- | ---------------------------------------------- |
| 100      | 0       | 15       | 0.151176 | 100      | 0        | PHAK 11-18: CAS = TAS at sea level in ISA      |
| 250      | 10,000  | −6.72    | 0.4523   | 287.7    | 9772.71  | Formulary Mach example (M 0.4523, TAS 287.7)   |
| 100      | 8,000   | 18       | 0.175238 | 116.5179 | 10145    | Formulary density altitude example (10,145 ft) |
| 120      | 5,000   | 5.094    | 0.198717 | 129.1678 | 5000     | ISA day: DA = PA (exact, as in 04)             |
| 150      | −1,500  | 40       | 0.220805 | 152.2622 | 996.95   | Independent calculation                        |
| 200      | 20,000  | −24.6    | 0.440378 | 270.5449 | 20002.85 | Independent calculation                        |
| 300      | 36,000  | −56.5    | 0.891339 | 511.2443 | 35979.02 | Independent calculation                        |
| 400      | 25,000  | −70      | 0.933725 | 518.6017 | 20358.52 | Independent calculation (corner)               |
| 300      | 36,000  | 60       | 0.891339 | 633.9705 | `null`   | Independent; DA 46,505.64 ft > tropopause      |

- Row 1: at sea level ISA, TAS equals CAS and `Mach = CAS / a0` = 100 / 661.4786 (exact).
- Row 2: the Formulary computes OAT −6.72 °C from an indicated 2 °C (K = 0.8); this calculator takes
  the static OAT directly. Its TAS 287.7 is rounded (independent value 287.6741).
- "Independent calculation" values (and the more precise values in rows 2–4) come from the formulas
  above evaluated with 40-digit decimals in a standalone Python script (`decimal`, ICAO constants),
  never by running `calculateTrueAirspeed`. Put the sources and this method in a comment at the
  top of the `describe` block.
- Higher OAT at the same CAS and PA gives higher TAS and DA; Mach doesn't change with OAT.
- `calculateMach` at Mach 1: CAS for Mach 1 from the Formulary's reverse formula (`ias =
661.4786 × (5 × ((1 + x × ((1 + M²/5)^3.5 − 1))^(2/7) − 1))^0.5`, `x = (1 − 6.8755856e−6 ×
PA)^5.2558797`) is 342.274 kt at 36,000 ft and 389.964 kt at 30,000 ft; `calculateMach` gives
  1 for those (`toBeCloseTo(1, 4)`).
- Units: CAS 463 km/h (= 250 kt), PA 3048 m (= 10,000 ft) and OAT 19.9 °F (= −6.7222 °C) give
  Mach 0.4523 and TAS 287.6729 kt = 532.7702 km/h.
- Density altitude refactor: all existing `calculateDensityAltitude` tests pass unchanged.

Schema: valid input passes; missing fields; CAS 0 rejected, 400 kt accepted, 400.01 rejected;
PA −1,500 and 36,000 accepted, one step beyond rejected; OAT −70 and 60 accepted, beyond rejected;
messages in km/h, m and °F (the shown limit accepted, one step beyond rejected); Mach check: 342 kt
at 36,000 ft accepted, 343 rejected; 389 kt at 30,000 ft accepted, 390 rejected; 400 kt at 25,000 ft
accepted (M 0.934); the Mach message isn't added when CAS or PA already failed; numeric strings
coerced.

## Acceptance criteria

- `/true-airspeed-calculator` appears in the Aviation section, in the category filter and in search.
- Results match the test cases in every speed, altitude and temperature unit; storage is kt, ft, °C.
- Supersonic inputs are rejected with the Mach message; a density altitude above the tropopause shows
  "Above 36,089 ft (not calculated)" (or the metre equivalent) while TAS and Mach are shown.
- Info covers the POH calibration table, the link to the Density Altitude Calculator, ram rise, the
  incompressible formula and both rules of thumb with their sources.
- Save, rename, update, import, delete and free-plan limit work. Disclaimer present.
- Lint, typecheck, format check and tests pass.

## Open questions

None at the moment.
