# 10 Glide Distance Calculator

Branch: `feature/aviation-wave-3` (from an up-to-date `master`; plans 08–12 are written and all
five calculators are implemented there, in order 08 → 12). The aviation epic is closed; there is
no epic branch.

Follow "Adding a calculator" and "Adding an aviation calculator" in `AGENTS.md`. This plan only
lists what is specific to this calculator; conventions are as in `01-foundation.md`, optional unit
fields as the gust speed in `02-crosswind-calculator.md`, time formatting as in
`05-fuel-planning-calculator.md`.

## Goal

Given the altitude, the terrain elevation and the glide ratio, calculate the glide distance over
the ground; optionally with the glide true airspeed and a headwind or tailwind, also the
groundspeed, the glide time and the descent rate. Uses the existing altitude, speed, distance and
vertical speed units; no new unit preference.

## Decisions

- **Glide performance** is entered as a glide ratio (e.g. 9 for 9:1), from the POH.
- **Height** is altitude minus terrain elevation (both entered); altitude must be above terrain.
- **Wind** is optional: a wind speed 0–200 kt plus a Headwind/Tailwind select (like the variation
  East/West), not a signed number. A wind speed of 0 (or empty) means no wind: then neither a
  wind type nor a glide TAS is required, and the groundspeed equals the glide TAS if one is
  given. A wind speed above 0 needs both the glide TAS and a wind type. A headwind equal to or
  stronger than the glide TAS (groundspeed ≤ 0) is rejected, like in the wind triangle.
- **Glide TAS** is optional (≥ 20 kt and ≤ 400 kt). Without it there is no wind, groundspeed or
  time; with it, the glide time is the still-air distance divided by the glide TAS (wind doesn't
  change the time, only the distance).
- **Descent rate** (added later on `feature/glide-descent-rate`, once the vertical speed unit
  from 12 existed): glide TAS ÷ glide ratio in ft/min, shown only with a glide TAS, in the user's
  vertical speed unit. Like the time, it doesn't depend on the wind. No limit: the glide ratio is
    > 0, so it is always finite, and it is an output only.
- **Limits (base units):** glide ratio > 0 and ≤ 70, altitude −1,500 to 60,000 ft, terrain
  −1,500 to 30,000 ft, glide TAS 20–400 kt, wind 0–200 kt.
- **No glide distance limit:** with these limits the largest possible result is 7,793.63 NM
  (61,500 ft × 70 × 220/20), so a 10,000 NM check could never trigger and isn't added. A test at
  that extreme corner catches a future change to the limits.
- `Info.tsx` notes that pilots fly slightly faster than best glide speed into a headwind (AFH
  p. 9-25; Glider Flying Handbook p. 5-10), which this simple scaling doesn't model.

## Scope

- Full-stack calculator (Prisma model, API routes, save, rename, update, import, delete, free-plan
  limit, tests).

## Out of scope

- Speed-to-fly / adjusting the glide speed for wind, glide ratio from best glide speed and sink
  rate, flaps/gear/propeller effects, turns, terrain profiles, crosswind components (enter the
  headwind component; the Crosswind Calculator gives it from a wind).

## Inputs and outputs (base units)

| Field                       | Base unit | Preference | Notes                                                  |
| --------------------------- | --------- | ---------- | ------------------------------------------------------ |
| `altitude` (input)          | ft        | altitude   | −1,500 to 60,000; > terrain                            |
| `terrainElevation` (input)  | ft        | altitude   | −1,500 to 30,000                                       |
| `glideRatio` (input)        | —         | none       | > 0, ≤ 70 (`x:1`)                                      |
| `glideTrueAirspeed` (input) | kt        | speed      | optional (`.nullish()`, `null`); 20–400                |
| `windSpeed` (input)         | kt        | speed      | optional; 0–200; > 0 needs `glideTrueAirspeed`         |
| `windType` (input)          | —         | none       | `'headwind' \| 'tailwind'`; `null` when wind is 0/none |
| `height` (output)           | ft        | altitude   | altitude − terrain                                     |
| `glideDistance` (output)    | NM        | distance   | over the ground (still air without a wind)             |
| `groundspeed` (output)      | kt        | speed      | `null` without glide TAS                               |
| `glideTime` (output)        | minutes   | none       | `null` without glide TAS; `formatHoursMinutes`         |
| `descentRate` (output)      | ft/min    | vert. spd. | `null` without glide TAS; TAS ÷ glide ratio            |

`glideDistanceUnitFields`: `{ altitude: 'altitude', terrainElevation: 'altitude',
glideTrueAirspeed: 'speed', windSpeed: 'speed' }`.

## Formulas

Sources:

- FAA Airplane Flying Handbook (FAA-H-8083-3C), p. 3-21: "The glide ratio of an airplane is the
  distance the airplane travels in relation to the altitude it loses. For example, if an airplane
  travels 10,000 feet forward while descending 1,000 feet, its glide ratio is 10 to 1." p. 3-23:
  "Wind affects the gliding distance. With a tailwind, the airplane glides farther because of the
  higher groundspeed. Conversely, with a headwind, the airplane does not glide as far because of
  the slower groundspeed." p. 9-25: "… or increase airspeed slightly above best glide in a headwind
  …".
- FAA Glider Flying Handbook (FAA-H-8083-13B), chapter 5, p. 5-4: "A glider flying at 60 knots
  true airspeed into a headwind of 25 knots has a groundspeed of only 35 knots. … with a tailwind
  of 25 knots has a groundspeed of 85 knots." p. 5-10: best L/D 50 kt with a sink speed of 2.1 kt,
  "50/2.1, which is approximately 24 … a best glide ratio in calm air … of 24:1", and the rule
  "the pilot can add half the headwind component to the zero wind L/D to obtain maximum distance"
  (Info only).

In base units (`NAUTICAL_MILE_IN_FEET = NAUTICAL_MILE_IN_METRES / FOOT_IN_METRES`; both
constants are now exported from `lib/units.ts`):

1. `height = altitude − terrainElevation` (ft).
2. `stillAirDistance = height × glideRatio / NAUTICAL_MILE_IN_FEET` (NM).
3. With a glide TAS: `groundspeed = TAS − wind` (headwind) or `TAS + wind` (tailwind; `TAS` with
   no wind or a wind of 0); `glideDistance = stillAirDistance × groundspeed / TAS`;
   `glideTime = stillAirDistance / TAS × 60` (min);
   `descentRate = TAS × NAUTICAL_MILE_IN_FEET / 60 / glideRatio` (ft/min). Without a glide TAS:
   `glideDistance = stillAirDistance`, `groundspeed`, `glideTime` and `descentRate` are `null`.

The time aloft doesn't depend on the wind: Glider Flying Handbook p. 5-5, "A headwind during an
approach results in greater altitude loss per distance traveled. The glider descends at a constant
rate, but a lower groundspeed increases the observed approach angle." The descent rate is the sink
speed, airspeed ÷ glide ratio (GFH p. 5-10: 50 kt with a 2.1 kt sink speed is about 24:1).

## Zod schema rules (`schemas/index.ts`)

- `createGlideDistanceFormDataSchema(units)` with `unitNumberFieldSchema` for `altitude`
  ("Altitude", `min: -1500, max: 60000`), `terrainElevation` ("Terrain elevation",
  `min: -1500, max: 30000`), `glideTrueAirspeed` ("Glide true airspeed", `min: 20, max: 400`,
  `.nullish()`, empty/`null` preprocessed to `undefined` like the crosswind gust), `windSpeed`
  ("Wind speed", `min: 0, max: 200`, same); `glideRatio: greaterThanZeroNumberFieldSchema('Glide
ratio').max(70)` (`"Glide ratio must be greater than 0"`, `"Glide ratio cannot be greater than
70"`); `windType: z.enum(windTypes).nullish()` (`constants/data.ts`, message `"Choose headwind or
tailwind"`). `glideDistanceFormDataSchema = createGlideDistanceFormDataSchema(BASE_UNITS)`.
- Cross-field (`superRefine`), each only when the involved fields passed their own checks:
    - altitude ≤ terrain → path `altitude`, `"Altitude must be above the terrain elevation"`.
    - wind speed > 0 without glide TAS → path `glideTrueAirspeed`, `"Glide true airspeed is
required when a wind is entered"`.
    - wind speed > 0 without `windType` → path `windType`, `"Choose headwind or tailwind"`.
    - headwind ≥ glide TAS (compared in the user's unit with a relative 1e-9 tolerance) → path
      `windSpeed`, `"The headwind must be lower than the glide true airspeed"`.
- `.transform` sets `windType` to `null` when the wind speed is empty or 0, so the API never
  stores a type without a wind. The output type therefore always has `windType`.
- Messages show the user's unit, rounded inwards (01): e.g. `"Glide true airspeed cannot be lower
than 37.04 km/h"`, `"Altitude cannot be greater than 18,288 m"`.
- Zod 3.22 `preprocess` quirk: an invalid TAS isn't reported once an earlier field failed
  (`BUG:` test).

## UI

- `Calculator.tsx`: defaults (base units) `{ altitude: 4000, terrainElevation: 1000, glideRatio:
9, glideTrueAirspeed: null, windSpeed: null, windType: 'headwind' }`. Inputs: "Altitude",
  "Terrain Elevation" (altitude symbol, `min0={false}`), "Glide Ratio" (`iconType="unit"`,
  `unitSymbol=":1"`), "Glide True Airspeed (optional)" and "Wind Speed (optional)" (speed
  symbol) with a "Wind Type" Headwind/Tailwind `Select` next to the wind speed (`FormGroup
inline`; an imported calculation without wind shows the placeholder "Headwind or tailwind").
- `Report.tsx`: Altitude, Terrain Elevation, Glide Ratio (`x:1`), Glide True Airspeed (if given),
  Headwind/Tailwind (if above 0), `ReportDivider`, Height Above Terrain, Glide Distance
  (`formatBaseValue` distance), and with a glide TAS: Groundspeed, Glide Time
  (`formatHoursMinutes`) and Descent Rate (`formatBaseValue` vertical speed: whole ft/min, m/s
  with 2 decimals), `<CalculatorDisclaimer category="aviation" />`.
- `Info.tsx`: glide ratio (AFH 10:1 example), best glide speed from the POH, wind effect (AFH,
  Glider Flying Handbook 60/25 kt example), descent rate = TAS ÷ glide ratio (GFH 50 kt / 2.1 kt),
  flying faster into a headwind isn't modelled,
  `<p>{calculatorDisclaimers.aviation}</p>`, `ReportSource` to the AFH page
  (`https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/airplane_handbook`, text
  `"FAA Airplane Flying Handbook"`).

## Files to create or change

1. `prisma/schema.prisma`: `enum GlideWindType { headwind tailwind }`; `type
GlideDistanceCalculationFormData { altitude Float terrainElevation Float glideRatio Float
glideTrueAirspeed Float? windSpeed Float? windType GlideWindType? }`, `model
GlideDistanceCalculation`, `GlideDistanceCalculations GlideDistanceCalculation[]` on `User`. Run
   `npx prisma generate`.
2. `constants/data.ts`: `windTypes`.
3. `schemas/index.ts` + test.
4. `types/calculations.ts`: `IGlideDistanceFormData`, `GlideDistanceReportProps extends
IGlideDistanceFormData { height: number; glideDistance: number; groundspeed: number | null;
glideTime: number | null; descentRate: number | null }`, add to `CalculationType`.
5. `lib/calculatorFns.ts` + test: `calculateGlideDistance`.
6. `constants/api.ts`: `GLIDE_DISTANCE_CALCULATIONS_API_URL = '/api/glide-distance-calculations'`,
   `GLIDE_DISTANCE_CALCULATIONS_QUERY_KEY = 'glide-distance-calculations'`.
7. `constants/calculators.ts`: `{ name: 'Glide Distance Calculator', url:
'glide-distance-calculator', category: 'aviation', description: 'Calculate the glide distance,
time and descent rate, given the altitude, terrain elevation, glide ratio and wind. Additionally,
logged in users can save their calculations.' }`.
8. `app/api/glide-distance-calculations/route.ts` and `[id]/route.ts` (`POST` saves `null` as
   `?? undefined` for `glideTrueAirspeed`, `windSpeed` and `windType`).
9. `app/(calculators)/glide-distance-calculator/`: `page.tsx`, `Calculator.tsx`, `Report.tsx`,
   `Info.tsx`.
10. `README.md` aviation entry; `00-epic.md` follow-up (mark 10 done).

Status: implemented on `feature/aviation-wave-3`; the descent rate was added on
`feature/glide-descent-rate`.

## Test cases

`calculateGlideDistance` (distances, time and descent rate `toBeCloseTo(x, 6)`):

| Altitude | Terrain | Ratio | TAS | Wind     | Height | Distance (NM) | GS (kt) | Time (min) | Descent (ft/min) | Source                                  |
| -------- | ------- | ----- | --- | -------- | ------ | ------------- | ------- | ---------- | ---------------- | --------------------------------------- |
| 1,500    | 500     | 10    | —   | —        | 1,000  | 1.645788      | `null`  | `null`     | `null`           | AFH 3-21 (10,000 ft per 1,000 ft)       |
| 4,000    | 1,000   | 24    | 60  | —        | 3,000  | 11.849676     | 60      | 11.849676  | 253.171479       | GFH 5-10 ratio 24, exact                |
| 4,000    | 1,000   | 24    | 60  | 25 head  | 3,000  | 6.912311      | 35      | 11.849676  | 253.171479       | GFH 5-4 (60 kt, 25 kt headwind → 35 kt) |
| 4,000    | 1,000   | 24    | 60  | 25 tail  | 3,000  | 16.787041     | 85      | 11.849676  | 253.171479       | GFH 5-4 (25 kt tailwind → 85 kt)        |
| 6,000    | 1,000   | 9     | —   | —        | 5,000  | 7.406048      | `null`  | `null`     | `null`           | Exact                                   |
| 60,000   | −1,500  | 70    | 20  | 200 tail | 61,500 | 7,793.630670  | 220     | 2,125.5356 | 28.933883        | Exact (largest possible result)         |

- Row 1: 10,000 ft = 10,000 × 0.3048 / 1,852 NM (exact).
- GFH p. 5-10 descent rate: TAS 50 kt with ratio 50 / 2.1 gives the 2.1 kt sink speed,
  212.664042 ft/min.
- The last row is the extreme corner (all limits at their extremes): assert the result is finite
  and ≈ 7,793.63 NM, so a change to the limits is noticed (no 10,000 NM check exists).
- Values come from the formulas above evaluated with 50-digit decimals in a standalone Python
  script, never by running `calculateGlideDistance`; put the sources and method in a comment.
- Independent checks: `glideTime / 60 × groundspeed` equals the glide distance; `descentRate`
  equals `height / glideTime` and `TAS × NM_IN_FEET / 60 / glideRatio` (253.1715 ft/min for rows
  2–4) and is the same with a headwind, no wind and a tailwind; with zero wind the distance equals
  the still-air distance.
- Wind 0 with a TAS of 60 kt (rows 2–4 inputs): groundspeed 60, distance 11.849676 NM.
- Same TAS, three winds: a 25 kt headwind, no wind and a 25 kt tailwind (rows 3, 2, 4) give an
  identical glide time (11.849676 min) while the distances differ (6.912311 < 11.849676 <
  16.787041 NM).
- Units: altitude 1,219.2 m and terrain 304.8 m (= 4,000 / 1,000 ft), TAS 111.12 km/h (= 60 kt),
  25 kt headwind as 46.3 km/h give 12.801600 km (= 6.912311 NM × 1.852); the descent rate in m/s
  is 1.286111 (2.5 kt × 1,852 / 3,600).

Schema: valid input passes, with and without TAS and wind; missing altitude, terrain or ratio;
limits at and beyond each limit (ratio 0 rejected, 70 accepted, 70.01 rejected; TAS 20 and 400
accepted, 19.99 and 400.01 rejected; wind 0 and 200 accepted), messages in m, km/h and mph;
altitude equal to terrain rejected; wind > 0 without TAS rejected on `glideTrueAirspeed`; wind > 0
without type rejected; wind 0 without TAS and type accepted (output `windType: null`); headwind 59.99 kt at TAS 60 accepted, 60 rejected; tailwind 200 at TAS 20 accepted;
the parsed output has `windType: null` without a wind speed; cross-field messages aren't added when
a field already failed; numeric strings coerced.

## Acceptance criteria

- `/glide-distance-calculator` appears in the Aviation section, the category filter and search.
- Results match the test cases in every altitude, speed, distance and vertical speed unit; storage
  is ft, kt.
- With a glide TAS the report shows the descent rate (whole ft/min, m/s with 2 decimals); without
  one it is hidden.
- A wind above 0 requires a glide TAS and a type; a wind of 0 is no wind; a headwind at or above
  the TAS is rejected.
- Info explains flying faster into a headwind isn't modelled.
- Save, rename, update, import, delete and free-plan limit work. Disclaimer present.
- Lint, typecheck, format check and tests pass.

## Open questions

None at the moment.
