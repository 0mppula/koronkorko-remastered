# 11 Turn Performance Calculator

Branch: `feature/aviation-wave-3` (from an up-to-date `master`; plans 08–12 are written and all
five calculators are implemented there, in order 08 → 12). The aviation epic is closed; there is
no epic branch.

Follow "Adding a calculator" and "Adding an aviation calculator" in `AGENTS.md`. This plan only
lists what is specific to this calculator; conventions are as in `01-foundation.md` and
`06-true-airspeed-calculator.md` (exact physics, rules of thumb in Info only).

## Goal

Given the true airspeed and bank angle of a coordinated level turn, calculate the rate of turn,
turn radius, load factor, time for a 360° turn and the bank angle for a standard-rate turn at that
TAS; with an optional stall speed, also the stall speed in the turn. Uses the existing speed,
altitude and distance units; no new unit preference.

## Decisions

- **Inputs:** TAS and bank angle; optional level-flight stall speed (from the POH).
- **Outputs:** rate of turn (°/s), radius in **both** the altitude unit (ft/m) and the distance
  unit (NM/km/SM), load factor, time for 360° (minutes and seconds, e.g. `2 min 0 s`), bank angle
  for a standard-rate turn (3°/s) at the TAS, and stall speed in the turn.
- **Stall speed:** shown as `Vs × √n`, **not** compared with the TAS. The stall speed is an
  indicated/calibrated airspeed from the POH and the input is TAS, so a comparison would miss real
  stalls at altitude. `Info.tsx` says to compare it with the indicated airspeed.
- **Exact physics** with standard gravity `g = 9.80665 m/s²`; the PHAK and Formulary constants
  (1,091, 11.26, 11.23, 96.7, 362.1) and rules of thumb appear in `Info.tsx` only.
- **Rules of thumb for the standard-rate bank** (only rules found in a source that was opened and
  checked): Aviation Formulary `TAS ÷ 7` ("accurate to ~1 degree for speeds less than 250
  knots"; 120 kt → about 17°); FAA Instrument Flying Handbook FAA-H-8083-15B p. 4-11 "divide the
  airspeed by ten and add 7" (120 kt → 19°) and p. 7-19 "15 percent of the true airspeed"
  (120 kt → 18°). The exact value at 120 kt is 18.2°. The PHAK, AFH, IPH and GFH extracts were
  searched and have no such rule.
- **Limits (base units):** TAS ≥ 20 kt and ≤ 400 kt (same minimum as the glide TAS in 10),
  bank > 0° and ≤ 75° (load factor 3.86), stall speed > 0 and ≤ 200 kt.
- No cross-field checks: the standard-rate bank at 400 kt is 47.69°, within any limit.

## Scope

- Full-stack calculator (Prisma model, API routes, save, rename, update, import, delete, free-plan
  limit, tests).
- `formatMinutesSeconds(seconds)` in `lib/utils.ts` + test (rounded to whole seconds first, like
  `formatHoursMinutes`, so 59.6 s is `1 min 0 s`).

## Out of scope

- Wind (turns over the ground, pivotal altitude), climbing/descending or uncoordinated turns,
  structural limits (Vg diagram), solving for TAS or bank from a desired rate or radius.

## Inputs and outputs (base units)

| Field                            | Base unit | Preference | Notes                                       |
| -------------------------------- | --------- | ---------- | ------------------------------------------- |
| `trueAirspeed` (input)           | kt        | speed      | 20–400                                      |
| `bankAngle` (input)              | degrees   | none       | > 0, ≤ 75                                   |
| `stallSpeed` (input)             | kt        | speed      | optional (`.nullish()`, `null`); > 0, ≤ 200 |
| `rateOfTurn` (output)            | °/s       | none       | 2 decimals                                  |
| `turnRadius` (output)            | ft        | altitude   | also shown in the distance unit (from NM)   |
| `loadFactor` (output)            | —         | none       | 2 decimals, e.g. `2.00 G`                   |
| `fullTurnTime` (output)          | seconds   | none       | `formatMinutesSeconds`                      |
| `standardRateBankAngle` (output) | degrees   | none       | 1 decimal                                   |
| `stallSpeedInTurn` (output)      | kt        | speed      | `null` without stall speed                  |

`turnPerformanceUnitFields`: `{ trueAirspeed: 'speed', stallSpeed: 'speed' }`. The report converts
the radius to NM (`turnRadius × 0.3048 / 1852`) before `formatBaseValue(…, 'distance', …)`.
Degree values use fixed `en-US` formatting (`toFixed`), not the browser locale.

## Formulas

Sources:

- FAA PHAK (FAA-H-8083-25C), chapter 5: p. 5-38 "The ROT can be determined by taking the constant
  of 1,091, multiplying it by the tangent of any bank angle and dividing that product by a given
  airspeed in knots" ("All airspeed discussed in this section is true airspeed (TAS)"); p. 5-39
  examples: 30° at 120 kt → 5.25°/s and "68.6 seconds" for 360°, 2.62°/s ("about 137 seconds")
  at 240 kt, 49° needed for 5.25°/s at 240 kt; p. 5-39 "The radius of turn is equal to the
  velocity squared (V2) divided by 11.26 times the tangent of the bank angle", 120 kt 30° →
  2,215 ft (p. 5-39), 240 kt → 8,861 ft (p. 5-40); p. 5-35 "The load factor for any aircraft in a
  coordinated level turn at 60° bank is 2 Gs. The load factor in an 80° bank is 5.76 Gs." and "an
  aircraft's stalling speed increases in proportion to the square root of the load factor. This
  means that an aircraft with a normal unaccelerated stalling speed of 50 knots can be stalled at
  100 knots by inducing a load factor of 4 Gs."
- Aviation Formulary V1.47, "Turns and pivotal altitude" (`https://edwilliams.org/avform147.htm`):
  "tan(b)= v^2/(R g)", "v= w R"; `R = v^2/(11.23*tan(0.01745*b))`, 100 kt 45° → 891 ft;
  `w = 96.7*v/R` → 10.9°/s; standard-rate bank `b_s = 57.3*atan(v/362.1)`, 100 kt → 15.4°; rule of
  thumb `b_s = v/7` ("accurate to ~1 degree for speeds less than 250 knots").

In SI (`V = TAS × 1852 / 3600` m/s, `φ` = bank in radians):

- `R = V² / (g × tan φ)` (m → ft via `FOOT_IN_METRES`).
- `ω = g × tan φ / V` (rad/s → °/s).
- `n = 1 / cos φ`.
- `fullTurnTime = 360 / ω(°/s)`.
- `standardRateBankAngle = atan(V × (3° in rad/s) / g)`.
- `stallSpeedInTurn = stallSpeed × √n`.

The exact constants are `R(ft) = V(kt)² / (11.294283 × tan φ)` and `ROT = 1,092.2067 × tan φ /
V(kt)`; PHAK's 11.26 and 1,091 and the Formulary's 11.23 are rounded, so their worked examples
differ from the exact values by up to 0.6 % (see "Test cases").

## Zod schema rules (`schemas/index.ts`)

- `createTurnPerformanceFormDataSchema(units)`: `trueAirspeed` (`unitNumberFieldSchema` "True
  airspeed", `min: 20, max: 400`), `bankAngle` (`numberFieldSchema('Bank angle')`, > 0 and ≤ 75,
  `"Bank angle must be greater than 0°"`, `"Bank angle cannot be greater than 75°"`), `stallSpeed`
  ("Stall speed", `min: 0, minExclusive: true, max: 200`, `.nullish()`);
  `turnPerformanceFormDataSchema = createTurnPerformanceFormDataSchema(BASE_UNITS)`.
- Messages in the user's unit, rounded inwards (01): e.g. `"True airspeed cannot be lower than
37.04 km/h"`, `"True airspeed cannot be greater than 740.80 km/h"`, `"Stall speed must be greater
than 0.00 kt"`.
- The stall speed uses the shared `emptyToUndefined` preprocess: `''`, `null` and a missing value
  parse to `undefined` (not `null`). Form defaults and Prisma data still use `null`.

## UI

- `Calculator.tsx`: defaults (base units) `{ trueAirspeed: 120, bankAngle: 30, stallSpeed: null }`
  (PHAK example). Inputs: "True Airspeed (TAS)" (`DynamicFormLabel`, short "TAS"; speed symbol)
  and "Bank Angle" (`°`) in one row, "Stall Speed (optional)" (speed symbol, empty placeholder
  like the other optional aviation inputs) below.
- `Report.tsx`: inputs (TAS, bank angle, stall speed when given), `ReportDivider`, Rate of Turn
  (`5.25°/s`), Turn Radius in one group (`2,208 ft (0.36 NM)`, both in the user's units), Load
  Factor (`1.15 G`), Time for 360° (`1 min 9 s`), Standard-Rate Bank Angle (`18.2°`), Stall Speed
  in the Turn (when given), `<CalculatorDisclaimer category="aviation" />`.
- `Info.tsx`: coordinated level turn, the PHAK formulas and examples (and why the calculator
  shows 2,208 ft, not 2,215 ft), standard-rate turn (3°/s, 2 min for 360°) with the exact value
  and the three rules of thumb above, load factor and stall speed (PHAK 60° → 2 G, 50 kt → 100 kt
  at 4 G), compare the stall speed in the turn with the indicated airspeed, not the TAS;
  `<p>{calculatorDisclaimers.aviation}</p>`, `ReportSource` to the PHAK page.

## Files to create or change

1. `prisma/schema.prisma`: `type TurnPerformanceCalculationFormData { trueAirspeed Float bankAngle
Float stallSpeed Float? }`, `model TurnPerformanceCalculation`, `TurnPerformanceCalculations
TurnPerformanceCalculation[]` on `User`. Run `npx prisma generate`.
2. `schemas/index.ts` + test.
3. `types/calculations.ts`: `ITurnPerformanceFormData`, `TurnPerformanceReportProps` (outputs
   above), add to `CalculationType`.
4. `lib/calculatorFns.ts` + test: `calculateTurnPerformance`, reusing the existing
   `STANDARD_GRAVITY = 9.80665` ISA constant.
5. `lib/utils.ts` + test: `formatMinutesSeconds`.
6. `constants/api.ts`: `TURN_PERFORMANCE_CALCULATIONS_API_URL =
'/api/turn-performance-calculations'`, `TURN_PERFORMANCE_CALCULATIONS_QUERY_KEY =
'turn-performance-calculations'`.
7. `constants/calculators.ts`: `{ name: 'Turn Performance Calculator', url:
'turn-performance-calculator', category: 'aviation', description: 'Calculate the rate of turn,
turn radius, load factor and standard-rate bank angle, given the true airspeed and bank angle.
Additionally, logged in users can save their calculations.' }`.
8. `app/api/turn-performance-calculations/route.ts` and `[id]/route.ts`.
9. `app/(calculators)/turn-performance-calculator/`: `page.tsx`, `Calculator.tsx`, `Report.tsx`,
   `Info.tsx`.
10. `README.md` aviation entry; `00-epic.md` follow-up (mark 11 done).

## Test cases

Exact values (50-digit decimals in a standalone Python script from the SI formulas above, never by
running `calculateTurnPerformance`; `toBeCloseTo(x, 4)` unless stated):

| TAS (kt) | Bank | ROT (°/s) | Radius (ft) | Radius (NM) | n        | 360° (s) | Std-rate bank |
| -------- | ---- | --------- | ----------- | ----------- | -------- | -------- | ------------- |
| 120      | 30°  | 5.254882  | 2,208.3324  | 0.363445    | 1.154701 | 68.5077  | 18.242631°    |
| 240      | 30°  | 2.627441  | 8,833.3296  | 1.453779    | 1.154701 | 137.0155 | 33.393506°    |
| 100      | 45°  | 10.922067 | 885.4037    | 0.145719    | 1.414214 | 32.9608  | 15.358847°    |
| 240      | 49°  | 5.235167  | 4,433.2974  | 0.729627    | 1.524253 | 68.7657  | 33.393506°    |
| 100      | 60°  | 18.917575 | 511.1881    | 0.084131    | 2        | 19.0299  | 15.358847°    |
| 400      | 75°  | 10.190427 | 3,795.8912  | 0.624723    | 3.863703 | 35.3273  | 47.692408°    |
| 20       | 75°  | 203.80854 | 9.4897      | 0.001562    | 3.863703 | 1.7664   | 3.144364°     |
| 20       | 0.1° | 0.095313  | 20,291.9371 | 3.339623    | 1.000002 | 3777.025 | 3.144364°     |

Against the published (rounded) values, with a relative tolerance and a comment explaining why:

- PHAK 5-39/5-40 (constants 1,091 and 11.26 are rounded; ~0.5 %): 120 kt 30° → 5.25°/s, 68.6 s
  and 2,215 ft; 240 kt 30° → 2.62°/s, ~137 s and 8,861 ft; 240 kt 49° → 5.25°/s.
- Aviation Formulary 100 kt 45° → 891 ft: **~1 % tolerance**. The exact radius is 885.40 ft; the
  Formulary's rounded constant 11.23 (exact 11.294) makes its value 0.6 % larger. Its 10.9°/s and
  standard-rate bank 15.4° at 100 kt match the exact values to 1 decimal.
- PHAK 5-35: 60° → 2 G (exact); stall speed 50 kt at 60° → 70.7107 kt (`50 × √2`); with
  `bankAngle = acos(1/4)` (75.522488°, outside the form limit, called directly) n = 4 and 50 kt →
  100 kt.
- Stall speed 200 kt at 400 kt / 75° → 393.1261 kt (exact).

Independent checks: `V = ω × R` (Formulary "v= w R") for every row; feeding the standard-rate bank
back in gives ROT 3.000000°/s and 120 s (`2 min 0 s`); `n` equals the PHAK Figure 5-52 vector
sum (√(1 + 1.73²) ≈ 2 at 60°).

Units: 222.24 km/h (= 120 kt) at 30° gives the same results; radius in m 673.0997, in km 0.673100.

`formatMinutesSeconds`: 120 → `2 min 0 s`, 68.5077 → `1 min 9 s`, 59.6 → `1 min 0 s`,
3777.025 → `62 min 57 s`.

Schema: valid input passes; missing TAS or bank; TAS 20 and 400 accepted, 19.99 and 400.01
rejected (messages in km/h and mph); bank 0 rejected, 0.01 and 75 accepted, 75.01 rejected; stall
`null`/missing/`''` accepted as `undefined`, 0 rejected, 200 accepted, 200.01 rejected; negative
values rejected; a stall speed above the TAS is accepted (no comparison); numeric strings
coerced; form values of the limits set from base units accepted; `BUG:` (`it.fails`) an invalid
stall speed isn't reported together with an invalid bank angle (zod 3.22 `z.preprocess`).

## Acceptance criteria

- `/turn-performance-calculator` appears in the Aviation section, the category filter and search.
- Results match the test cases in every speed, altitude and distance unit; storage is kt.
- The radius is shown in both the altitude and the distance unit.
- The stall speed in the turn is shown without a TAS comparison; Info explains why.
- Save, rename, update, import, delete and free-plan limit work. Disclaimer present.
- Lint, typecheck, format check and tests pass.

## Open questions

None at the moment.
