# 12 Descent Planning Calculator

Branch: `feature/aviation-wave-3` (from an up-to-date `master`; plans 08–12 are written and all
five calculators are implemented there, in order 08 → 12). The aviation epic is closed; there is
no epic branch.

Follow "Adding a calculator" and "Adding an aviation calculator" in `AGENTS.md`. This plan only
lists what is specific to this calculator. The "Solve for" radio group, hidden fields and solved
value checks work like `07-time-speed-distance-calculator.md`; adding the unit preference works
like the distance unit in 07.

## Goal

Given the current and target altitude and the groundspeed, calculate either the distance from
the target at which to start the descent (top of descent), from a vertical speed or a descent
angle, or the vertical speed required to descend within a given distance. Also show the time to
descend and the descent gradient in %, ft/NM and degrees. Adds the **vertical speed** unit
preference (ft/min, m/s; base ft/min).

## Decisions

- **Solve for:** a "Solve for" radio group: Top of descent (distance) or Required vertical speed.
  Stored as a Prisma enum `solveFor` (`topOfDescent`, `verticalSpeed`).
- **Descent input (top of descent only):** a second radio group: Vertical speed or Descent angle.
  Stored as a Prisma enum `descentInput` (`verticalSpeed`, `angle`); ignored when solving for the
  vertical speed.
- **Gradient outputs** (%, ft/NM, degrees) are extra outputs in every mode; there is no separate
  gradient converter mode.
- **Time to descend** (Δh / vertical speed) is shown in every mode.
- **Climbs are out of scope;** a climb gradient calculator is a possible future addition.
- **Hidden fields** keep their typed values for the session and are saved as `null` (as in 07).
- **Limits (base units):** current and target altitude −1,500 to 60,000 ft, target below current;
  groundspeed ≥ 20 kt and ≤ 1,000 kt (same minimum as 10 and 11); vertical speed > 0 and
  ≤ 6,000 ft/min; descent angle > 0° and ≤ 10°; distance > 0 and ≤ 500 NM. **Computed results
  must be within the same limits** (distance ≤ 500 NM, vertical speed ≤ 6,000 ft/min, angle
  ≤ 10°), rejected with a message under "Solve for" (path `solveFor`), as in 07.
- **Vertical speed unit:** ft/min (default, base, whole numbers) and m/s (2 decimals). This needs
  per-unit fraction digits (see below).
- **Rules of thumb** in `Info.tsx` only (IPH: divide the altitude to lose by 300 for the distance;
  3° ≈ groundspeed × 5 ft/min; 3° ≈ 318 ft/NM).

## Scope

- Full-stack calculator (Prisma model, API routes, save, rename, update, import, delete, free-plan
  limit, tests).
- Vertical speed unit preference in `lib/units.ts`, Prisma `unitPreferences`,
  `unitPreferencesSchema`, units modal (automatic); per-unit fraction digits.

## Out of scope

- Climbs, deceleration/level-off segments, wind changes during the descent, performance-chart
  descents, curved-earth geometry, VNAV/approach angles (VDA), multiple segments.

## Inputs and outputs (base units)

| Field                      | Base unit | Preference    | Notes                                               |
| -------------------------- | --------- | ------------- | --------------------------------------------------- |
| `solveFor` (input)         | —         | none          | `'topOfDescent' \| 'verticalSpeed'`                 |
| `descentInput` (input)     | —         | none          | `'verticalSpeed' \| 'angle'`                        |
| `currentAltitude` (input)  | ft        | altitude      | −1,500 to 60,000                                    |
| `targetAltitude` (input)   | ft        | altitude      | −1,500 to 60,000; < current                         |
| `groundspeed` (input)      | kt        | speed         | 20–1,000                                            |
| `verticalSpeed` (input)    | ft/min    | verticalSpeed | given only for top of descent by VS; else `null`    |
| `descentAngle` (input)     | degrees   | none          | given only for top of descent by angle; else `null` |
| `distance` (input)         | NM        | distance      | given only when solving for VS; else `null`         |
| report `distance`          | NM        | distance      | always filled                                       |
| report `verticalSpeed`     | ft/min    | verticalSpeed | always filled                                       |
| report `descentTime`       | minutes   | none          | `formatHoursMinutes`                                |
| report `gradientPercent`   | %         | none          | 2 decimals                                          |
| report `gradientFeetPerNm` | ft/NM     | none          | whole numbers                                       |
| report `descentAngle`      | degrees   | none          | 2 decimals                                          |

`descentPlanningUnitFields`: `{ currentAltitude: 'altitude', targetAltitude: 'altitude',
groundspeed: 'speed', verticalSpeed: 'verticalSpeed', distance: 'distance' }`.

## Vertical speed unit (add to `lib/units.ts`)

- `unitQuantities`: `{ value: 'verticalSpeed', label: 'Vertical speed' }`.
- `unitOptions.verticalSpeed`: `fpm` (identity, label "Feet per minute (ft/min)", symbol `ft/min`)
  and `ms` (label "Metres per second (m/s)", symbol `m/s`, `ft/min = m/s × 60 / 0.3048`, reusing
  `FOOT_IN_METRES`). Source (comment): NIST SP 811, Appendix B.9, foot = 0.3048 m (exact).
- `BASE_UNITS.verticalSpeed = 'fpm'`, default `'fpm'`.
- **Per-unit fraction digits:** an optional `fractionDigits` on `UnitOption` and
  `getUnitFractionDigits(quantity, unit)` (the option's value, else `unitFractionDigits[quantity]`).
  `unitFractionDigits.verticalSpeed = 0`; the `ms` option has `fractionDigits: 2`. Use
  `getUnitFractionDigits` as the default in `formatUnitValue` and in `createUnitLimits`
  (`schemas/index.ts`) instead of `unitFractionDigits[quantity]`; other quantities are unchanged.
- `unitPreferencesSchema`: `verticalSpeed: unitValueSchema('verticalSpeed')`; Prisma
  `type unitPreferences`: `verticalSpeed String?`; every test fixture listing all units
  (`lib/queryFns/auth.test.ts`, units tests) includes `verticalSpeed`.

## Formulas

Sources: FAA Instrument Procedures Handbook (FAA-H-8083-16B), chapter 3 "Arrivals":

- p. 3-4: "divide the altitude needed to be lost by 300 … The altitude you want to lose is 6,000
  feet, which when divided by 300 results in 20. Therefore, you need to start your descent 20 NM
  out"; "To determine ROD for a three-degree path, simply multiply your groundspeed by 5. If you are
  going 120 knots, your ROD to fly the desired path would be 600 fpm (120 × 5 = 600). … If the
  groundspeed is 120 knots, that means the aircraft is moving along at 2 NM per minute. So to go 20
  NM, it takes 10 minutes. Ten minutes at 600 fpm means you will lose 6,000 feet."
- p. 3-8 (Figure 3-8): descend from 11,000 ft to 3,000 ft at 1,000 fpm, groundspeed 180 kt (no
  result given).
- p. 3-12: "a descent gradient of about 318 ft/NM, or about three degrees."
- p. 3-20 (Figure 3-17): RACKI at 12,000 ft to 6,000 ft at PENNS, 23 NM at 180 kt: "you will
  reach PENNS Intersection in approximately 8 minutes (23 ÷ 3 = 7.6). You must descend at least
  750 feet per minute … (6,000 ÷ 8 = 750)"; HAYED at 12,000 ft, 500 fpm, 180 kt: "begin your
  descent no less than 36 NM from PENNS Intersection ([6,000 ÷ 500] x 3 = 36)". Also p. 3-20:
  "500 ft/NM (approximately 5°)", "1,000 ft/NM (approximately 10°)".
- The rate of descent table in the U.S. Terminal Procedures Publication (IPH p. 4-23) was **not
  opened**; it isn't used.

In base units, `Δh = currentAltitude − targetAltitude` (ft), `NM_IN_FEET = 1852 / 0.3048`, flat
earth:

- Top of descent by vertical speed: `distance = Δh × GS / (60 × VS)`.
- Top of descent by angle: `gradientFeetPerNm = tan(angle) × NM_IN_FEET`, `distance = Δh /
gradientFeetPerNm`, `VS = gradientFeetPerNm × GS / 60`.
- Required vertical speed: `VS = Δh × GS / (60 × distance)`.
- Every mode: `descentTime = Δh / VS` (min), `gradientFeetPerNm = Δh / distance`,
  `gradientPercent = gradientFeetPerNm / NM_IN_FEET × 100`, `descentAngle =
atan(gradientFeetPerNm / NM_IN_FEET)`.

`calculateDescentPlanning` ignores the hidden fields' values and returns all outputs.

## Zod schema rules (`schemas/index.ts`)

- `createDescentPlanningFormDataSchema(units)`: `solveFor` and `descentInput` as `z.enum` from
  `descentSolveForOptions` / `descentInputOptions` (`constants/data.ts`); `currentAltitude`,
  `targetAltitude` (`unitNumberFieldSchema`, `min: -1500, max: 60000`), `groundspeed`
  (`min: 20, max: 1000`) always given; `verticalSpeed`, `descentAngle`, `distance` as `z.unknown()`
  and checked in `superRefine` only when given in the current mode, as in 07 (empty →
  `"Vertical speed is required"` etc.; `unitNumberFieldSchema('Vertical speed', 'verticalSpeed',
…, { min: 0, minExclusive: true, max: 6000 })`, `numberFieldSchema('Descent angle')` > 0 and
  ≤ 10, `unitNumberFieldSchema('Distance', 'distance', …, { min: 0, minExclusive: true, max: 500
})`).
- Cross-field, each only when the involved fields passed their own checks:
    - target ≥ current → path `targetAltitude`, `"Target altitude must be below the current
altitude"`.
    - computed values (same relative tolerance as the unit limits), path `solveFor`:
      `"The resulting distance would exceed 500.00 NM"`, `"The resulting vertical speed would
exceed 6,000 ft/min"` (`30.48 m/s`), `"The resulting descent angle would exceed 10°"`.
- `.transform` returns `null` for the hidden fields, so the API stores `null` (`POST` saves `null`
  as `?? undefined`, as in 07). The 07 known quirk (hidden value in the form after saving) applies.

## UI

- `Calculator.tsx`: defaults (base units) `{ solveFor: 'topOfDescent', descentInput:
'verticalSpeed', currentAltitude: 7000, targetAltitude: 1000, groundspeed: 120, verticalSpeed:
600, descentAngle: 3, distance: null }` (IPH p. 3-4). Two `RadioGroup`s ("Solve for", and
  "Descent by" shown only for top of descent); hidden inputs aren't rendered; changing either radio
  group clears the form errors (07). Inputs: "Current Altitude", "Target Altitude" (altitude symbol,
  `min0={false}`), "Groundspeed" (speed), "Vertical Speed" (vertical speed symbol), "Descent Angle"
  (`°`), "Distance" (distance symbol).
- `Report.tsx`: inputs, `ReportDivider`, the solved value first (Top of Descent: "Start descent
  20.00 NM before the target", or Required Vertical Speed), then Vertical Speed / Distance, Time to
  Descend (`formatHoursMinutes`), Descent Gradient (`4.94 %`, `300 ft/NM`, `2.83°`),
  `<CalculatorDisclaimer category="aviation" />`.
- `Info.tsx`: the formulas, the IPH examples and rules of thumb (÷ 300, GS × 5, 318 ft/NM ≈ 3°),
  groundspeed (not TAS) and why wind matters, a link to the Time-Speed-Distance Calculator,
  `<p>{calculatorDisclaimers.aviation}</p>`, `ReportSource` to the IPH page
  (`https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/instrument_procedures_handbook`,
  text `"FAA Instrument Procedures Handbook"`).

## Files to create or change

1. `prisma/schema.prisma`: `verticalSpeed String?` on `unitPreferences`; `enum
DescentPlanningSolveFor { topOfDescent verticalSpeed }`, `enum DescentInput { verticalSpeed angle
}`; `type DescentPlanningCalculationFormData { solveFor DescentPlanningSolveFor descentInput
DescentInput currentAltitude Float targetAltitude Float groundspeed Float verticalSpeed Float?
descentAngle Float? distance Float? }`, `model DescentPlanningCalculation`,
   `DescentPlanningCalculations DescentPlanningCalculation[]` on `User`. Run `npx prisma generate`.
2. `lib/units.ts` + test: vertical speed unit, per-unit fraction digits.
3. `constants/data.ts`: `descentSolveForOptions`, `descentInputOptions`.
4. `schemas/index.ts` + test (`createUnitLimits` uses `getUnitFractionDigits`);
   `lib/queryFns/auth.test.ts`.
5. `types/calculations.ts`: `IDescentPlanningFormData`, `DescentPlanningReportProps`, add to
   `CalculationType`.
6. `lib/calculatorFns.ts` + test: `calculateDescentPlanning`.
7. `constants/api.ts`: `DESCENT_PLANNING_CALCULATIONS_API_URL =
'/api/descent-planning-calculations'`, `DESCENT_PLANNING_CALCULATIONS_QUERY_KEY =
'descent-planning-calculations'`.
8. `constants/calculators.ts`: `{ name: 'Descent Planning Calculator', url:
'descent-planning-calculator', category: 'aviation', description: 'Calculate where to start the
descent or the vertical speed needed, and the descent gradient, given the altitudes and
groundspeed. Additionally, logged in users can save their calculations.' }`.
9. `app/api/descent-planning-calculations/route.ts` and `[id]/route.ts`.
10. `app/(calculators)/descent-planning-calculator/`: `page.tsx`, `Calculator.tsx`, `Report.tsx`,
    `Info.tsx`.
11. `README.md` aviation entry and units sentence (vertical speed); `00-epic.md` follow-up (mark 12
    done).

## Test cases

`calculateDescentPlanning` (distance `toBeCloseTo(x, 6)`, VS and ft/NM `toBeCloseTo(x, 4)`, % and
angle `toBeCloseTo(x, 6)`):

| Mode        | From → to (ft) | GS  | Given      | Distance (NM) | VS (ft/min) | Time (min) | ft/NM    | %        | Angle     | Source                     |
| ----------- | -------------- | --- | ---------- | ------------- | ----------- | ---------- | -------- | -------- | --------- | -------------------------- |
| TOD, VS     | 7,000 → 1,000  | 120 | 600 ft/min | 20            | 600         | 10         | 300      | 4.937365 | 2.826606° | IPH 3-4 (20 NM, 10 min)    |
| TOD, VS     | 12,000 → 6,000 | 180 | 500 ft/min | 36            | 500         | 12         | 166.6667 | 2.742981 | 1.571218° | IPH 3-20 HAYED (36 NM)     |
| TOD, VS     | 11,000 → 3,000 | 180 | 1,000      | 24            | 1,000       | 8          | 333.3333 | 5.485961 | 3.140077° | IPH 3-8 inputs, exact      |
| Required VS | 12,000 → 6,000 | 180 | 23 NM      | 23            | 782.6087    | 7.6667     | 260.8696 | 4.293361 | 2.458405° | IPH 3-20 RACKI (see below) |
| TOD, angle  | 7,000 → 1,000  | 120 | 3°         | 18.842107     | 636.8714    | 9.4211     | 318.4357 | 5.240778 | 3°        | IPH 3-12 (≈ 318 ft/NM)     |

- RACKI: IPH rounds 7.6 min up to 8 and gets "at least 750 feet per minute"; the exact value is
  782.6087 ft/min (comment why; assert it is above 750).
- 3° row: IPH's rules of thumb (300 ft/NM → 20 NM, GS × 5 = 600 ft/min) are approximations; the
  exact values are 318.4357 ft/NM and 636.8714 ft/min. Assert IPH's "about 318 ft/NM" within 0.2 %.
- Values come from the formulas above evaluated with 50-digit decimals in a standalone Python
  script, never by running `calculateDescentPlanning`; put the sources and method in a comment.
- Independent checks: each result fed back in the other mode reproduces the inputs (TOD distance →
  required VS gives the original VS; the angle row's VS → TOD by VS gives the same distance);
  `distance / GS × 60` equals the descent time.
- Hidden values are ignored (e.g. `distance: 999` when solving for top of descent).
- Units (through `formDataToBaseUnits`): 2,133.6 m → 304.8 m (= 7,000 → 1,000 ft), 222.24 km/h
  (= 120 kt), 3.048 m/s (= 600 ft/min) → 20 NM = 37.04 km.

Units (`lib/units.test.ts`): `toBaseUnit(3.048, 'verticalSpeed', 'ms')` → `600`;
`formatUnitValue(6000, 'verticalSpeed', 'fpm')` → `6,000 ft/min`;
`formatBaseValue(6000, 'verticalSpeed', 'ms')` → `30.48 m/s`; `getUnitFractionDigits` gives 0 for
`fpm`, 2 for `ms` and the quantity default for other units; `withDefaultUnitPreferences({})`
includes `verticalSpeed: 'fpm'`, and older preferences keep their other choices.

Schema, for every mode:

- Valid input passes; the parsed output has the hidden fields `null`.
- Missing given fields are required; hidden fields may be missing, `''`, negative or too large.
- Limits at and beyond each limit (altitudes −1,500 and 60,000; GS 19.99 rejected, 20 and 1,000
  accepted; VS 0 rejected, 6,000 accepted, 6,000.01 rejected; angle 0 rejected, 10 accepted, 10.01
  rejected; distance 0 rejected, 500 accepted, 500.01 rejected), messages in m, km/h, m/s
  (`"Vertical speed cannot be greater than 30.48 m/s"`) and km.
- Target equal to current rejected on `targetAltitude`.
- Computed values at and beyond their limits (message on `solveFor`):
    - distance: 60,000 → −1,500 ft at 1,000 kt and 2,050 ft/min = 500 NM accepted; 2,049.99
      rejected (`"... 500.00 NM"`, in km `"... 926.00 km"`).
    - vertical speed, by angle: 1,000 kt at 3.39° accepted (< 6,000 ft/min; the limit is
      3.390718°), 3.391° rejected; required VS: 7,000 → 1,000 ft at 1,000 kt over 16.67 NM
      accepted (5,998.80 ft/min), 16.66 NM rejected (`"... 6,000 ft/min"`, `"... 30.48 m/s"`).
    - angle: 7,000 → 1,000 ft at 120 kt and 2,142.76 ft/min accepted (the 10° limit is 2,142.7662
      ft/min), 2,142.77 rejected (`"... 10°"`).
- Computed-value messages aren't added when a given field already failed; unknown `solveFor` or
  `descentInput` rejected; numeric strings coerced.

## Acceptance criteria

- The units modal shows a Vertical speed select (ft/min, m/s); existing preferences get the
  default without losing other choices; m/s shows 2 decimals, ft/min whole numbers.
- `/descent-planning-calculator` appears in the Aviation section, the category filter and search.
- Each mode matches the IPH examples in every altitude, speed, vertical speed and distance unit;
  storage is ft, kt, ft/min, NM, with hidden fields `null`.
- Results beyond a limit are rejected with the message under "Solve for".
- Save, rename, update, import, delete and free-plan limit work. Disclaimer present.
- Lint, typecheck, format check and tests pass.

## Open questions

None at the moment.
