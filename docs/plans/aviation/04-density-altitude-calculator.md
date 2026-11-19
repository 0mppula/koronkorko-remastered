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
- Pressure unit preference (hPa, inHg) in `lib/units.ts`, Prisma `UnitPreferences`, units modal
  (automatic via `unitQuantities`).
- Temperature difference conversion helper.

## Out of scope

- Humidity / dew point (dry air only in v1; `Info.tsx` mentions that humidity raises density
  altitude slightly).
- Aircraft performance (takeoff distance, climb rate).
- Altitudes above the ISA troposphere (11 km / 36,089 ft).

## Foundation you rely on (from 01)

- `lib/units.ts`: `unitQuantities`, `unitOptions`, `UnitPreferences`, `BASE_UNITS`,
  `DEFAULT_UNIT_PREFERENCES`, `UnitFields<T>`, `toBaseUnit`, `fromBaseUnit`, `getUnitSymbol`,
  `formatUnitValue`, `withDefaultUnitPreferences`, `formDataToBaseUnits`, `formDataFromBaseUnits`.
  Adding an entry to `unitQuantities`/`unitOptions` automatically adds a select to the units modal
  (`components/Nav/UnitPreferencesModal.tsx`) and a value to `unitPreferencesSchema`; the persisted
  store (`hooks/useUnits.ts`) and `User.preferences.units` fill missing quantities with defaults.
- `schemas/index.ts`: `unitNumberFieldSchema(fieldName, quantity, unit, { min, max })` (limits in
  base units, messages in the user's unit).
- `hooks/useCalculator.ts` `unitFields`; `NumberInputWithIcon iconType="unit"` (`min0={false}` for
  negative values); `AviationDisclaimer`; `category` in `constants/calculators.ts`.
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
  **`hPa = inHg × 33.8639`** (decided).
- `BASE_UNITS.pressure = 'hpa'`; default `'hpa'` (decided, ICAO).
- `prisma/schema.prisma` `type UnitPreferences`: add `pressure String?`. Run `npx prisma generate`.
- Display: hPa with 0–2 decimals (no trailing zeros, so `1013.25 hPa`, `1013 hPa`), inHg with 2
  decimals (`29.92 inHg`). Pass `fractionDigits` per unit.

Temperature difference helper (add to `lib/units.ts`):
`fromBaseTemperatureDifference(valueC, unit)` → `valueC` for °C, `valueC × 9/5` for °F (no
offset). Use it for `isaDeviation`; never use `fromBaseUnit` on a difference.

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
Verify each equation and constant against ICAO Doc 7488 before implementing.

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
Messages show the user's unit, e.g. `"QNH cannot be lower than 26.58 inHg"` (900 ÷ 33.8639),
`"Outside air temperature cannot be greater than 140.0 °F"`.
Every input inside the limits must give a finite result; if one doesn't, add an `it.fails` test
named `BUG: ...`.

## UI

- `Calculator.tsx`: mirror the crosswind calculator. `defaultValues` (base units):
  `{ fieldElevation: 0, qnh: 1013.25, outsideAirTemperature: 15 }` (ISA sea level). Inputs: "Field
  Elevation" (altitude symbol, `min0={false}`), "QNH / Altimeter Setting" (pressure symbol, `step`
  0.01), "Outside Air Temperature" (temperature symbol, `min0={false}`).
- `Report.tsx`: inputs (elevation, QNH, OAT), `ReportDivider`, Pressure Altitude, ISA Temperature,
  ISA Deviation (signed, e.g. `"+19.9 °C"`, using the difference helper), Density Altitude,
  `<AviationDisclaimer />`. Altitudes as whole feet/metres, temperatures 2 decimals (01).
- `Info.tsx`: what pressure and density altitude are, why high density altitude reduces aircraft
  performance (PHAK), that the calculator uses the exact ICAO Standard Atmosphere formulas (pressure
  altitude from QNH, then density altitude from air density), the rule of thumb of about 120 ft per
  °C of ISA deviation as a mental check only, that the calculation assumes dry air and humidity
  raises density altitude slightly, the disclaimer sentence, `ReportSource`
  to the FAA handbook page
  (`https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak`).

## Files to create or change

Follow "Adding a calculator" and "Adding an aviation calculator" in AGENTS.md:

1. `prisma/schema.prisma`: `pressure String?` on `UnitPreferences`;
   `type DensityAltitudeCalculationFormData { fieldElevation Float qnh Float outsideAirTemperature
Float }`, `model DensityAltitudeCalculation`, `DensityAltitudeCalculations
DensityAltitudeCalculation[]` on `User`. Run `npx prisma generate`.
2. `lib/units.ts` + `lib/units.test.ts`: pressure unit, temperature difference helper.
3. `schemas/index.ts` + `schemas/index.test.ts`: schemas above; `unitPreferencesSchema` tests
   include `pressure`.
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
10. `README.md` aviation entry and units sentence (pressure), `AGENTS.md` Project list, check off
    04 in `00-epic.md`.

## Test cases

Units (`lib/units.test.ts`):

- `fromBaseUnit(33.8639, 'pressure', 'inhg')` → `1`; `toBaseUnit(29.92, 'pressure', 'inhg')` →
  `29.92 × 33.8639` (`toBeCloseTo`).
- `fromBaseTemperatureDifference(10, 'f')` → `18`; `(10, 'c')` → `10`; `(0, 'f')` → `0`.
- `withDefaultUnitPreferences({ speed: 'kmh' })` now also has `pressure: 'hpa'`.

`calculateDensityAltitude` — cases that follow from the ISA definition:

| Elevation | QNH     | OAT                    | PA      | ISA temp | Deviation | DA      |
| --------- | ------- | ---------------------- | ------- | -------- | --------- | ------- |
| 0 ft      | 1013.25 | 15 °C                  | 0 ft    | 15 °C    | 0         | 0 ft    |
| 5000 ft   | 1013.25 | 5.094 °C (ISA at 5000) | 5000 ft | 5.094 °C | 0         | 5000 ft |

- 5000 ft ISA temperature: `15 − 0.0065 × 5000 × 0.3048 = 5.094 °C` (exact from the lapse rate).
- With standard pressure (QNH 1013.25) PA equals the elevation for any elevation in range.
- Higher OAT at the same PA gives higher DA; higher QNH at the same elevation gives lower PA.
- Hot-day and non-standard cases (e.g. a high-elevation field on a hot day, a low QNH): compute the
  expected values **independently with the exact ISA formulas above** (by hand or in a
  spreadsheet, never by running `calculateDensityAltitude`) and **cross-check each case against an
  established density altitude calculator**, e.g. the US National Weather Service one. That
  calculator may ask for a dew point; use the driest input it allows and note it, since humidity
  raises its result slightly. List the sources (title/URL, inputs entered, result shown) in a
  comment at the top of the `describe('calculateDensityAltitude')` block, and choose a tolerance
  that covers the cross-check's rounding (state it in the comment).
- Units: elevation 1524 m (= 5000 ft), QNH 29.92 inHg (= 1013.21 hPa, close to standard) and OAT
  41.17 °F (= 5.094 °C) give PA ≈ DA ≈ 5000 ft; the tolerance must allow for 29.92 × 33.8639 not
  being exactly 1013.25 (about 1 ft).

Schema: valid input passes; missing fields; elevation and OAT may be negative; each limit accepted
at the boundary and rejected beyond it; messages in inHg/°F/m when those units are used; numeric
strings coerced.

## Acceptance criteria

- The units modal shows a Pressure select (hPa, inHg); existing users and localStorage without
  `pressure` get the default without losing other unit choices.
- `/density-altitude-calculator` appears in the Aviation section and in search.
- Results match the test cases; ISA deviation in °F is a difference (10 °C → 18 °F, not 50 °F).
- The test file lists the cross-check sources for the hot-day cases.
- Info mentions the rule of thumb (about 120 ft per °C) and that humidity raises density altitude
  slightly.
- Switching altitude, pressure or temperature units converts the form and report without changing
  physical values; storage is ft/hPa/°C.
- Save, rename, update, import, delete and free-plan limit work. Disclaimer present.
- Lint, typecheck, format check and tests pass.

## Open questions

None at the moment.
