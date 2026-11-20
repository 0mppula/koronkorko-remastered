# 04 Density Altitude Calculator

Epic: `epic/aviation-calculators` (see `00-epic.md`) · Branch:
`feature/density-altitude-calculator` (create from up-to-date `epic/aviation-calculators` after 01
is merged; merge 04 and 05 one at a time, PR back into the epic).

## Goal

Given the field elevation, QNH (altimeter setting) and outside air temperature (OAT), calculate the
pressure altitude, the ISA temperature at that pressure altitude, the ISA temperature deviation and
the density altitude. Adds the **pressure** unit preference.

## Scope

- Full-stack calculator like `dividend-yield-calculator`: Prisma model, API routes, save, rename,
  update, import, delete, free-plan limit, tests.
- Pressure unit preference (hPa, inHg) in `lib/units.ts`, Prisma `unitPreferences`,
  `unitPreferencesSchema`, units modal (automatic via `unitQuantities`).
- Temperature difference conversion and formatting helpers.
- Replace the aviation-only disclaimer with `CalculatorDisclaimer`/`calculatorDisclaimers` for
  every calculator, finance included (see 01, section 7).

## Out of scope

- Humidity / dew point (dry air only in v1; `Info.tsx` mentions that humidity raises density
  altitude slightly).
- Aircraft performance (takeoff distance, climb rate).
- Altitudes above the ISA troposphere (11 km / 36,089 ft).

## Foundation you rely on (from 01)

- `lib/units.ts`: `unitQuantities`, `unitOptions`, `unitFractionDigits`, `UnitPreferences`,
  `BASE_UNITS`, `DEFAULT_UNIT_PREFERENCES`, `UnitFields<T>`, `toBaseUnit`, `fromBaseUnit`,
  `getUnitSymbol`, `formatUnitValue`, `formatBaseValue`, `withDefaultUnitPreferences`,
  `formDataToBaseUnits`, `formDataFromBaseUnits`. Adding an entry to
  `unitQuantities`/`unitOptions` automatically adds a select to the units modal
  (`components/Nav/UnitPreferencesModal.tsx`); `unitPreferencesSchema` is an explicit object, so
  the quantity must be added there too (a missing one is a type error). The persisted store
  (`hooks/useUnits.ts`) and `User.preferences.units` fill missing quantities with defaults.
- `schemas/index.ts`: `unitNumberFieldSchema(fieldName, quantity, unit, { min, max })` (limits
  checked in base units, messages rounded inwards in the user's unit).
- `hooks/useCalculator.ts` `unitFields`; `NumberInputWithIcon iconType="unit"` (`min0={false}` for
  negative values); `category` in `constants/calculators.ts`.
- `app/(calculators)/crosswind-calculator/` as the closest example.

If any name differs in the merged code, follow the code.

## Inputs and outputs (base units)

| Field                           | Base unit     | Preference  | Notes                                        |
| ------------------------------- | ------------- | ----------- | -------------------------------------------- |
| `fieldElevation` (input)        | ft            | altitude    | may be negative                              |
| `qnh` (input)                   | hPa           | pressure    | altimeter setting                            |
| `outsideAirTemperature` (input) | °C            | temperature | may be negative                              |
| `pressureAltitude` (output)     | ft            | altitude    |                                              |
| `isaTemperature` (output)       | °C            | temperature | ISA temperature at the pressure altitude     |
| `isaDeviation` (output)         | °C difference | temperature | OAT − ISA temperature; convert as difference |
| `densityAltitude` (output)      | ft            | altitude    |                                              |

`densityAltitudeUnitFields`: `{ fieldElevation: 'altitude', qnh: 'pressure',
outsideAirTemperature: 'temperature' }`.

## Pressure unit (add to `lib/units.ts`)

- `unitQuantities`: add `{ value: 'pressure', label: 'Pressure' }`.
- `unitOptions.pressure`: `{ value: 'hpa', label: 'Hectopascals (hPa)', symbol: 'hPa' }`
  (identity) and `{ value: 'inhg', label: 'Inches of mercury (inHg)', symbol: 'inHg' }` with
  **`hPa = inHg × 33.8639`** (decided; NIST SP 811 App. B.9: 1 inHg (conventional) =
  3386.389 Pa, rounded to 33.8639 hPa, cited in a comment on `INCH_OF_MERCURY_IN_HECTOPASCALS`).
- `BASE_UNITS.pressure = 'hpa'`; default `'hpa'` (decided, ICAO).
- `unitPreferencesSchema`: add `pressure: unitValueSchema('pressure')`.
- `prisma/schema.prisma` `type unitPreferences`: add `pressure String?`. Run `npx prisma generate`.
- Display (decided): `unitFractionDigits.pressure = 2` for both units (`1013.25 hPa`,
  `1013.00 hPa`, `29.92 inHg`), and `formatUnitValue` writes pressures without thousands
  separators (`useGrouping: false`), as altimeter settings are usually written. In the QNH input
  the default 1013.25 hPa shows as `29.92` in inHg (display rounding), while the exact
  1013.25 hPa is kept for calculating and saving unless the field is edited.

Temperature difference helpers (add to `lib/units.ts`):

- `fromBaseTemperatureDifference(valueC, unit)` → `valueC` for °C, `valueC × 9/5` for °F (no
  offset). Use it for `isaDeviation`; never use `fromBaseUnit` on a difference.
- `formatTemperatureDifference(baseValue, unit)` → signed with 2 decimals and the symbol
  (`Intl.NumberFormat('en-US', { signDisplay: 'exceptZero' })`), e.g. `"+19.90 °C"`,
  `"+18.00 °F"`, `"-5.00 °C"`; values that round to zero show `"0.00 °C"` without a sign. `NaN` is
  formatted as `0`.

## Formulas

**Decided:** calculate everything with the exact ISA formulas below, including pressure altitude
from QNH. The rule of thumb is only explained in `Info.tsx`, never used for results.

### Exact ISA (ICAO Standard Atmosphere, troposphere)

ICAO Doc 7488/3 (Manual of the ICAO Standard Atmosphere) constants: `T0 = 288.15 K`,
`P0 = 1013.25 hPa`, lapse rate `L = 0.0065 K/m`, `g0 = 9.80665 m/s²`, `R = 287.05287 J/(kg·K)`,
`n = g0 / (R × L)` (≈ 5.2559), `ρ0 = P0 / (R × T0)` (= 1.225 kg/m³).

Work in metres, convert to feet with `ft = m / 0.3048`:

1. Station pressure from QNH (QNH is defined so that an ISA altimeter set to it reads the field
   elevation `h`): `P = qnh × (1 − L × h / T0)^n`.
2. Pressure altitude: `PA = (T0 / L) × (1 − (P / P0)^(1/n))`.
3. ISA temperature at PA: `T_isa = 15 − L × PA` (°C, PA in m).
4. `isaDeviation = OAT − T_isa`.
5. Air density: `ρ = P / (R × (OAT + 273.15))` (P in Pa).
6. Density altitude: `DA = (T0 / L) × (1 − (ρ / ρ0)^(1/(n − 1)))`.

Steps 2 and 6 are the ISA pressure–altitude and density–altitude relations solved for altitude.
In `calculateDensityAltitude` the constants are named constants next to the function
(`ISA_SEA_LEVEL_TEMPERATURE_K`, `ISA_LAPSE_RATE_K_PER_M`, `DRY_AIR_GAS_CONSTANT`, ...,
`ISA_SCALE_HEIGHT_M = T0 / L`) under a one-line ICAO Doc 7488/3 comment; feet convert to metres
and back with `fromBaseUnit`/`toBaseUnit` (`altitude`, `m`). The tests check the forward
relations against a published ISA table (see "Test cases").

### Rule of thumb (`Info.tsx` only)

`Info.tsx` explains that density altitude rises by about 120 ft for every 1 °C the temperature is
above ISA (and falls when below), as a quick mental check. It must say that the calculator uses the
exact ISA formulas, not this rule, so results differ slightly from the rule of thumb.

## Zod schema rules (`schemas/index.ts`)

```ts
export const createDensityAltitudeFormDataSchema = (units: UnitPreferences) =>
	z.object({
		fieldElevation: unitNumberFieldSchema('Field elevation', 'altitude', units.altitude, {
			min: -1500,
			max: 20000,
		}),
		qnh: unitNumberFieldSchema('QNH', 'pressure', units.pressure, { min: 900, max: 1100 }),
		outsideAirTemperature: unitNumberFieldSchema(
			'Outside air temperature',
			'temperature',
			units.temperature,
			{ min: -60, max: 60 }
		),
	});

export const densityAltitudeFormDataSchema = createDensityAltitudeFormDataSchema(BASE_UNITS);
```

Limits (decided, base units): elevation −1,500 to 20,000 ft, QNH 900–1,100 hPa, OAT −60 to +60 °C.
Messages show the user's unit, rounded inwards, e.g. `"QNH cannot be lower than 26.58 inHg"`
(900 ÷ 33.8639 = 26.5770, and 26.58 inHg is still ≥ 900 hPa), `"QNH cannot be greater than 32.48
inHg"`, `"Field elevation cannot be lower than -457 m"`, `"Field elevation cannot be greater than
6,096 m"`, `"Outside air temperature cannot be greater than 140.00 °F"`.
Every input inside the limits must give a finite result; if one doesn't, add an `it.fails` test
named `BUG: ...`. (All do: the corners and a grid of the limits are tested.)

## UI

- `Calculator.tsx`: mirror the crosswind calculator. Module-level `densityAltitudeUnitFields` and
  `defaultValues` (base units): `{ fieldElevation: 0, qnh: 1013.25, outsideAirTemperature: 15 }`
  (ISA sea level). Inputs: "Field Elevation" (altitude symbol, `min0={false}`), "QNH / Altimeter
  Setting" (`DynamicFormLabel`, short label "QNH"; pressure symbol), "Outside Air Temperature"
  (temperature symbol, `min0={false}`).
- `Report.tsx`: inputs (elevation, QNH, OAT), `ReportDivider`, Pressure Altitude, ISA Temperature,
  ISA Deviation (`formatTemperatureDifference`, e.g. `"+19.90 °C"`), Density Altitude,
  `<CalculatorDisclaimer category="aviation" />`. All other values use `formatBaseValue`:
  altitudes as whole feet/metres, temperatures and pressures with 2 decimals.
- `Info.tsx`: what pressure and density altitude are, why high density altitude reduces aircraft
  performance (PHAK), that the calculator uses the exact ICAO Standard Atmosphere formulas (pressure
  altitude from QNH, then density altitude from air density), the rule of thumb of about 120 ft per
  °C of ISA deviation as a mental check only, that the calculation assumes dry air and humidity
  raises density altitude slightly, `<p>{calculatorDisclaimers.aviation}</p>`, `ReportSource` to
  the FAA handbook page (`https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak`,
  text `"FAA Pilot's Handbook of Aeronautical Knowledge"`).

## Files to create or change

Follow "Adding a calculator" and "Adding an aviation calculator" in AGENTS.md:

1. `prisma/schema.prisma`: `pressure String?` on `unitPreferences`;
   `type DensityAltitudeCalculationFormData { fieldElevation Float qnh Float outsideAirTemperature
Float }`, `model DensityAltitudeCalculation`, `DensityAltitudeCalculations
DensityAltitudeCalculation[]` on `User`. Run `npx prisma generate`.
2. `lib/units.ts` + `lib/units.test.ts`: pressure unit, temperature difference helpers.
3. `schemas/index.ts` + `schemas/index.test.ts`: schemas above; `pressure` in
   `unitPreferencesSchema` and its tests.
4. `types/calculations.ts`: `IDensityAltitudeFormData`, `DensityAltitudeReportProps extends
IDensityAltitudeFormData { pressureAltitude; isaTemperature; isaDeviation; densityAltitude }`,
   add to `CalculationType`.
5. `lib/calculatorFns.ts` + test: `calculateDensityAltitude`. Put the ISA constants in named
   constants next to the function with a one-line source comment.
6. `constants/api.ts`: `DENSITY_ALTITUDE_CALCULATIONS_API_URL = '/api/density-altitude-calculations'`,
   `DENSITY_ALTITUDE_CALCULATIONS_QUERY_KEY = 'density-altitude-calculations'`.
7. `constants/calculators.ts`:
   `{ name: 'Density Altitude Calculator', url: 'density-altitude-calculator', category: 'aviation', description: 'Calculate the pressure altitude, ISA temperature deviation and density altitude, given the field elevation, QNH and outside air temperature. Additionally, logged in users can save their calculations.' }`.
8. `app/api/density-altitude-calculations/route.ts` and `[id]/route.ts`.
9. `app/(calculators)/density-altitude-calculator/`: `page.tsx`, `Calculator.tsx`, `Report.tsx`,
   `Info.tsx`.
10. `README.md` aviation entry and units sentence (pressure), check off 04 in `00-epic.md` (not
    `AGENTS.md`: it points to `constants/calculators.ts` for the aviation calculators).
11. Disclaimers for all calculators: `calculatorDisclaimers` in `constants/data.ts`,
    `components/Report/CalculatorDisclaimer.tsx` (replaces `AviationDisclaimer.tsx` and
    `AVIATION_DISCLAIMER`), used at the end of every `Report.tsx` and as
    `<p>{calculatorDisclaimers.<category>}</p>` in every `Info.tsx`, finance included.

## Test cases

Units (`lib/units.test.ts`):

- `fromBaseUnit(33.8639, 'pressure', 'inhg')` → `1`; `toBaseUnit(29.92, 'pressure', 'inhg')` →
  `29.92 × 33.8639` (`toBeCloseTo`).
- `formatUnitValue(1013.25, 'pressure', 'hpa')` → `1013.25 hPa`, `1013` → `1013.00 hPa`;
  `formatBaseValue(1013.25, 'pressure', 'inhg')` → `29.92 inHg`; the default QNH shown in inHg
  displays `29.92` in the input and keeps 1013.25 hPa as its exact base value.
- `fromBaseTemperatureDifference(10, 'f')` → `18`; `(10, 'c')` → `10`; `(0, 'f')` → `0`.
- `formatTemperatureDifference`: `19.9` °C → `+19.90 °C`, `10` in °F → `+18.00 °F`, `-5` →
  `-5.00 °C`, `0` and `-0.004` → `0.00 °C`.
- `withDefaultUnitPreferences({ speed: 'kmh' })` now also has `pressure: 'hpa'`.

`calculateDensityAltitude` — cases that follow from the ISA definition:

| Elevation | QNH     | OAT                    | PA      | ISA temp | Deviation | DA      |
| --------- | ------- | ---------------------- | ------- | -------- | --------- | ------- |
| 0 ft      | 1013.25 | 15 °C                  | 0 ft    | 15 °C    | 0         | 0 ft    |
| 5000 ft   | 1013.25 | 5.094 °C (ISA at 5000) | 5000 ft | 5.094 °C | 0         | 5000 ft |

- 5000 ft ISA temperature: `15 − 0.0065 × 5000 × 0.3048 = 5.094 °C` (exact from the lapse rate).
- With standard pressure (QNH 1013.25) PA equals the elevation for any elevation in range.
- Higher OAT at the same PA gives higher DA; higher QNH at the same elevation gives lower PA.
- **Forward relations (as done):** the test writes the forward ISA relations (pressure and density
  at an altitude) independently of `calculateDensityAltitude`, which solves them for altitude, and
  checks them against the Engineering ToolBox "International Standard Atmosphere" table
  (`https://www.engineeringtoolbox.com/international-standard-atmosphere-d_985.html`) at −500,
  1000, 2000, 5000 and 10000 m. That table is at geometric altitude, so the test converts with
  `h = r0·z / (r0 + z)`, `r0 = 6356766 m`.
- Hot-day and non-standard cases (5000 ft / 1013.25 / 30 °C → DA 7800.73 ft, 0 / 1013.25 / 35 →
  2275.31, 2000 / 995 / 25 → PA 2495.19, DA 4211.9, 0 / 1035 / −20 → PA −588.91, DA −5243.68,
  7000 / 1020 / 30 → PA 6825, DA 10006.21): expected values computed independently from the exact
  ISA formulas with 40-digit decimals (never by running `calculateDensityAltitude`); 5000 ft /
  30 °C was also checked by hand (≈ 7801 ft). Tolerance `toBeCloseTo(x, 1)` for altitudes, `3` for
  temperatures.
- No online density altitude calculator could be used as a cross-check: the NWS one
  (`https://www.weather.gov/epz/wxcalc_densityaltitude`) only runs in the browser and takes
  station pressure and dew point, not QNH. The sources and this limitation are listed in a comment
  at the top of the `describe('calculateDensityAltitude')` block.
- Consistency over the limits: for the corners and a grid of elevations, QNHs and OATs, every
  result is finite, the forward relations give back the station pressure and air density, and PA
  and DA stay below the tropopause; the hot, high, low-pressure corner (20,000 ft, 900 hPa, 60 °C)
  gives PA 22797.14 ft and DA 31562.89 ft.
- Units: elevation 1524 m (= 5000 ft), QNH 29.92 inHg (= 1013.2079 hPa, not 1013.25) and OAT
  41.17 °F (= 5.0944 °C) give PA ≈ 5001.11 ft and DA ≈ 5001.42 ft, within 2 ft of 5000 ft because
  29.92 × 33.8639 is not exactly 1013.25.

Schema: valid input passes; missing fields; elevation and OAT may be negative; each limit accepted
at the boundary and rejected beyond it; messages in m/inHg/°F when those units are used (the shown
limit accepted, one step beyond rejected); numeric strings coerced.

## Acceptance criteria

- The units modal shows a Pressure select (hPa, inHg); existing users and localStorage without
  `pressure` get the default without losing other unit choices.
- `/density-altitude-calculator` appears in the Aviation section and in search.
- Results match the test cases; ISA deviation in °F is a difference (10 °C → +18.00 °F, not
  50 °F).
- The test file lists the sources used to check the ISA relations and how the hot-day cases were
  computed.
- Info mentions the rule of thumb (about 120 ft per °C) and that humidity raises density altitude
  slightly.
- Switching altitude, pressure or temperature units converts the form and report without changing
  physical values; storage is ft/hPa/°C.
- Save, rename, update, import, delete and free-plan limit work. Disclaimer present under every
  report and in every `Info.tsx`, finance included.
- Lint, typecheck, format check and tests pass.

## Open questions

None at the moment.
