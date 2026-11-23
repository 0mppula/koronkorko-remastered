# 07 Time-Speed-Distance Calculator

Branch: `feature/tas-and-tsd-calculators` (06 and 07 are built together on one branch, created from
an up-to-date `master` after `feature/landing-filter-and-aviation-plans` is merged; PR into
`master`). The aviation epic is closed (see `00-epic.md`); there is no epic branch.

Follow "Adding a calculator" and "Adding an aviation calculator" in `AGENTS.md`. This plan only
lists what is specific to this calculator. Adding the unit preference works like the fuel unit in
`05-fuel-planning-calculator.md` (without a unit context); hours + minutes input and formatting
reuse 05's `HoursMinutesInput`, `formatHoursMinutes` and `formatMinutes`.

## Goal

Given any two of distance, groundspeed and time, calculate the third. Adds the **distance** unit
preference (NM, km, SM; base NM).

## Decisions

- **Solve for:** a "Solve for" radio group (Distance, Groundspeed, Time) using the existing
  `components/ui/radio-group.tsx` (its first use). Stored as a Prisma enum `solveFor`.
- **Saving:** the solved field is saved as `null`. When the user switches `solveFor`, the hidden
  field keeps its typed value in the form for the session, so switching back restores it; only
  saving stores the solved field as `null`.
- **Import** restores `solveFor` and the two given values (the solved field is empty).
- **Time** is entered with `HoursMinutesInput`, stored in minutes (as in 05) and shown with
  `formatHoursMinutes`.
- **Limits (base units):** distance > 0 and ≤ 10,000 NM, groundspeed > 0 and ≤ 1,000 kt, time > 0
  and ≤ 24 h (1,440 min). The solved value must be within its limit too: a cross-field check
  rejects inputs whose result would exceed it (e.g. `"The resulting distance would exceed
10,000.00 NM"`), in the user's units, shown under the "Solve for" radio group (path `solveFor`).
- **Distance unit:** NM (default), km, SM; exact factors 1 NM = 1,852 m, 1 SM = 1,609.344 m;
  2 decimals; labels "Nautical miles (NM)", "Kilometres (km)", "Statute miles (SM)".

## Scope

- Full-stack calculator (Prisma model, API routes, save, rename, update, import, delete, free-plan
  limit, tests).
- Distance unit preference in `lib/units.ts`, Prisma `unitPreferences`, `unitPreferencesSchema`,
  units modal (automatic).

## Out of scope

- Wind (groundspeed from TAS and wind is the Wind Triangle Calculator), fuel, multiple legs.
- Seconds in the time input.

## Inputs and outputs (base units)

| Field                 | Base unit | Preference | Notes                                                        |
| --------------------- | --------- | ---------- | ------------------------------------------------------------ |
| `solveFor` (input)    | —         | none       | `'distance' \| 'groundspeed' \| 'time'`                      |
| `distance` (input)    | NM        | distance   | `null` when solved; > 0, ≤ 10,000                            |
| `groundspeed` (input) | kt        | speed      | `null` when solved; > 0, ≤ 1,000                             |
| `time` (input)        | minutes   | none       | `null` when solved; > 0, ≤ 1,440; entered as hours + minutes |
| report `distance`     | NM        | distance   | always filled (given or solved)                              |
| report `groundspeed`  | kt        | speed      | always filled                                                |
| report `time`         | minutes   | none       | always filled                                                |

`timeSpeedDistanceUnitFields`: `{ distance: 'distance', groundspeed: 'speed' }` (nullable unit
fields are supported, see the gust speed in 02).

## Distance unit (add to `lib/units.ts`)

- `unitQuantities`: `{ value: 'distance', label: 'Distance' }`.
- `unitOptions.distance`: `nm` (identity, symbol `NM`), `km` (`NM = km / 1.852`), `sm` (`NM = SM ×
1609.344 / 1852`), reusing the existing `NAUTICAL_MILE_IN_METRES` and `MILE_IN_METRES`. Sources
  (cite in a comment): NIST SP 811, Appendix B.9, "Length" (mile, nautical = 1,852 m; mile (mi)
  = 1,609.344 m); the Aviation Formulary's unit conversions mark 1 kt = 1.852 km/h and 1 mph =
  1.609344 km/h as exact.
- `BASE_UNITS.distance = 'nm'`, default `'nm'`, `unitFractionDigits.distance = 2`.
- `unitPreferencesSchema`: `distance: unitValueSchema('distance')`; Prisma `type unitPreferences`:
  `distance String?`. `lib/queryFns/auth.test.ts`: units include `distance`.

## Formulas

PHAK (FAA-H-8083-25C), chapter 16, "Basic Calculations" (p. 16-11): `T = D / GS`, `D = GS × T`,
`GS = D / T` (T in hours). In base units (NM, kt, minutes):

- distance: `D = GS × T / 60`
- groundspeed: `GS = 60 × D / T`
- time: `T = 60 × D / GS`

`calculateTimeSpeedDistance` ignores the value of the solved field (it may hold a hidden value)
and returns all three.

## Zod schema rules (`schemas/index.ts`)

- `solveFor`: `z.enum` from `timeSpeedDistanceSolveForOptions` (in `constants/data.ts`, like
  `fuelTypes`), message `"Solve for must be distance, groundspeed or time"`.
- `distance`, `groundspeed`, `time`: optional numbers (`.nullish()`, `''` → none, as 05's optional
  fuel amounts). Their limits are checked in `superRefine` **only for the two given fields**, so a
  hidden value never blocks the form: missing → `"Distance is required"` (etc.); limits via
  `createUnitLimits` (distance, speed; same tolerance and inward-rounded messages as 01), time
  `"Time must be greater than 0"` / `"Time cannot be greater than 24 h"`.
- Solved value check (path `solveFor`), only when both given fields are valid: compute the result in
  base units and reject if above its limit: `"The resulting distance would exceed 10,000.00 NM"`
  (`18,520.00 km`, `11,507.79 SM`), `"The resulting groundspeed would exceed 1,000.00 kt"`
  (`1,852.00 km/h`, `1,150.77 mph`, `514.44 m/s`), `"The resulting time would exceed 24 h"`.
- `.transform` sets the solved field to `null`, so the API stores `null` (the client form keeps the
  hidden value because `useCalculator` saves `form.getValues()`; the API parses the body with the
  schema). The `POST` saves `null` fields as `?? undefined`, as in 05.
- Watch the known zod 3.22 quirks (`preprocess` skipping after an earlier issue, `superRefine` on
  dirty data); document any that surface as `BUG:` tests.

## UI

- `Calculator.tsx`: defaults (base units) `{ solveFor: 'time', distance: 210, groundspeed: 140,
time: null }` (PHAK example, 1 h 30 min). "Solve for" `RadioGroup` at the top; the solved input is
  not rendered (react-hook-form keeps its value). Inputs: "Distance" (distance symbol),
  "Groundspeed" (speed symbol), "Time" (`HoursMinutesInput`).
- `Report.tsx`: the two given values, `ReportDivider`, the solved value labelled e.g. "Time"
  (`formatHoursMinutes`), distance and groundspeed with `formatBaseValue`,
  `<CalculatorDisclaimer category="aviation" />`.
- `Info.tsx`: the three relations with the PHAK examples, converting minutes to hours, that
  groundspeed is TAS corrected for wind (link to the Wind Triangle Calculator),
  `<p>{calculatorDisclaimers.aviation}</p>`, `ReportSource` to the PHAK page.

## Files to create or change

1. `prisma/schema.prisma`: `distance String?` on `unitPreferences`; `enum
TimeSpeedDistanceSolveFor { distance groundspeed time }`; `type
TimeSpeedDistanceCalculationFormData { solveFor TimeSpeedDistanceSolveFor distance Float?
groundspeed Float? time Float? }`, `model TimeSpeedDistanceCalculation`,
   `TimeSpeedDistanceCalculations TimeSpeedDistanceCalculation[]` on `User`. Run
   `npx prisma generate`.
2. `lib/units.ts` + test: distance unit.
3. `constants/data.ts`: `timeSpeedDistanceSolveForOptions`.
4. `schemas/index.ts` + test; `lib/queryFns/auth.test.ts`.
5. `types/calculations.ts`: `ITimeSpeedDistanceFormData`, `TimeSpeedDistanceReportProps` (`solveFor`
   plus `distance`, `groundspeed`, `time` as numbers), add to `CalculationType`.
6. `lib/calculatorFns.ts` + test: `calculateTimeSpeedDistance`.
7. `constants/api.ts`: `TIME_SPEED_DISTANCE_CALCULATIONS_API_URL =
'/api/time-speed-distance-calculations'`, `TIME_SPEED_DISTANCE_CALCULATIONS_QUERY_KEY =
'time-speed-distance-calculations'`.
8. `constants/calculators.ts`: `{ name: 'Time Speed Distance Calculator', url:
'time-speed-distance-calculator', category: 'aviation', description: 'Calculate the distance,
groundspeed or flight time, given the other two. Additionally, logged in users can save their
calculations.' }`.
9. `app/api/time-speed-distance-calculations/route.ts` and `[id]/route.ts`.
10. `app/(calculators)/time-speed-distance-calculator/`: `page.tsx`, `Calculator.tsx`,
    `Report.tsx`, `Info.tsx`.
11. `README.md` aviation entry and units sentence (distance); the second-wave follow-up in
    `00-epic.md` (mark 07 done).

## Test cases

`calculateTimeSpeedDistance`, PHAK p. 16-11 worked examples (exact):

| Solve for   | Distance | Groundspeed | Time    | Result          |
| ----------- | -------- | ----------- | ------- | --------------- |
| time        | 210 NM   | 140 kt      | —       | 90 min ("1:30") |
| distance    | —        | 120 kt      | 105 min | 210 NM          |
| groundspeed | 270 NM   | —           | 180 min | 90 kt           |

- The solved field's value is ignored (e.g. `distance: 999` with `solveFor: 'distance'` still gives
  210 NM); inputs are returned unchanged.
- Independent check: each result fed back in the other two modes reproduces the original inputs.
- Units (through `formDataToBaseUnits`, `toBeCloseTo(x, 6)`): 388.92 km (= 210 × 1.852) at
  259.28 km/h (= 140 × 1.852) → 90 min; 138 mph for 105 min → 241.5 SM (same-unit arithmetic:
  138 × 1.75).

Units (`lib/units.test.ts`): `fromBaseUnit(1, 'distance', 'km')` → `1.852`;
`toBaseUnit(1.852, 'distance', 'km')` → `1`; `fromBaseUnit(1, 'distance', 'sm')` →
`1852 / 1609.344` (≈ 1.150779); `formatUnitValue(10000, 'distance', 'nm')` → `10,000.00 NM`;
`formatBaseValue(10000, 'distance', 'sm')` → `11,507.79 SM`; `withDefaultUnitPreferences({})`
includes `distance: 'nm'`, and older preferences keep their other choices.

Schema, for all three modes:

- Valid input passes; the parsed output has the solved field `null`.
- A missing given field is required; the hidden field may be missing, `''`, negative or too large.
- Given-field limits at and beyond the limit (0 rejected; 10,000 NM, 1,000 kt, 1,440 min accepted;
  one step more rejected), messages in km, SM, km/h and mph.
- Solved value at and beyond its limit, message on `solveFor`:
    - distance: 500 kt × 1,200 min = 10,000 NM accepted; 1,200.01 min rejected
      (`"... 10,000.00 NM"`; with km `"... 18,520.00 km"`, with SM `"... 11,507.79 SM"`).
    - groundspeed: 1,000 NM in 60 min = 1,000 kt accepted; 1,000.01 NM rejected
      (`"... 1,000.00 kt"`; km/h `"... 1,852.00 km/h"`, mph `"... 1,150.77 mph"`).
    - time: 2,400 NM at 100 kt = 1,440 min accepted; 2,400.01 NM rejected (`"... 24 h"`).
- The solved-value message isn't added when a given field already failed; unknown `solveFor`
  rejected; numeric strings coerced.

## Acceptance criteria

- The units modal shows a Distance select (NM, km, SM); existing preferences get the default
  without losing other choices.
- `/time-speed-distance-calculator` appears in the Aviation section, the category filter and search.
- Each solve-for mode matches the PHAK examples in every distance and speed unit; storage is NM, kt,
  minutes, with the solved field `null`.
- Switching "Solve for" keeps typed values for the session; import restores `solveFor`.
- Results beyond a limit are rejected with the message under "Solve for".
- Save, rename, update, import, delete and free-plan limit work. Disclaimer present.
- Lint, typecheck, format check and tests pass.

## Open questions

None at the moment.
