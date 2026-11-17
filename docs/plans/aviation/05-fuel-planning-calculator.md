# 05 Fuel Planning Calculator

Epic: `epic/aviation-calculators` (see `00-epic.md`) · Branch: `feature/fuel-planning-calculator`
(create from up-to-date `epic/aviation-calculators` after 01 is merged; merge 04 and 05 one at a
time, PR back into the epic).

## Goal

Given a fuel burn rate, flight time, reserve time and fuel type (AVGAS or Jet A), calculate trip
fuel, reserve fuel and total fuel, each as volume and mass. Adds the **fuel volume** and **mass**
unit preferences.

## Scope

- Full-stack calculator like `dividend-yield-calculator`: Prisma model, API routes, save, rename,
  update, import, delete, free-plan limit, tests.
- Volume (L, US gal) and mass (kg, lb) unit preferences in `lib/units.ts`, Prisma
  `UnitPreferences`, units modal (automatic via `unitQuantities`).
- Fuel types with fixed densities.

## Out of scope

- Taxi fuel, contingency percentage, alternate fuel, unusable fuel (see open questions).
- Burn rate entered as mass per hour (jets often use kg/h or lb/h).
- Weight and balance, tank capacity checks, distance/groundspeed based flight time.
- Temperature-corrected fuel density.

## Foundation you rely on (from 01)

- `lib/units.ts`: `unitQuantities`, `unitOptions`, `UnitPreferences`, `BASE_UNITS`,
  `DEFAULT_UNIT_PREFERENCES`, `UnitFields<T>`, `toBaseUnit`, `fromBaseUnit`, `getUnitSymbol`,
  `formatUnitValue`, `withDefaultUnitPreferences`, `formDataToBaseUnits`, `formDataFromBaseUnits`.
  Adding an entry to `unitQuantities`/`unitOptions` automatically adds a select to the units modal
  (`components/Nav/UnitPreferencesModal.tsx`) and a value to `unitPreferencesSchema`; the persisted
  store (`hooks/useUnits.ts`) and `User.preferences.units` fill missing quantities with defaults.
- `schemas/index.ts`: `unitNumberFieldSchema(fieldName, quantity, unit, { min, max, minExclusive })`
  (limits in base units, messages in the user's unit), `positiveNumberFieldSchemaWithMax`.
- `hooks/useCalculator.ts` `unitFields`; `NumberInputWithIcon iconType="unit"`;
  `AviationDisclaimer`; `category` in `constants/calculators.ts`.
- Select pattern: "Distribution Frequency" in
  `app/(calculators)/dividend-yield-calculator/Calculator.tsx` (`Select` with `String(field.value)`).
- `app/(calculators)/crosswind-calculator/` as the closest aviation example.

If any name differs in the merged code, follow the code.

## Inputs and outputs (base units)

| Field                      | Base unit | Preference | Notes                                                    |
| -------------------------- | --------- | ---------- | -------------------------------------------------------- |
| `fuelBurnRate` (input)     | L/h       | volume     | > 0; displayed as `<volume symbol>/h`                    |
| `flightTime` (input)       | minutes   | none       | ≥ 0 (time is not a listed base unit; see open questions) |
| `reserveTime` (input)      | minutes   | none       | ≥ 0                                                      |
| `fuelType` (input)         | —         | none       | `'avgas' \| 'jetA'`                                      |
| `fuelDensity` (output)     | kg/L      | none       | from the fuel type                                       |
| `tripFuel` (output)        | L         | volume     |                                                          |
| `reserveFuel` (output)     | L         | volume     |                                                          |
| `totalFuel` (output)       | L         | volume     |                                                          |
| `tripFuelMass` (output)    | kg        | mass       |                                                          |
| `reserveFuelMass` (output) | kg        | mass       |                                                          |
| `totalFuelMass` (output)   | kg        | mass       |                                                          |

`fuelPlanningUnitFields`: `{ fuelBurnRate: 'volume' }` (a per-hour rate converts with the same
factor as the volume).

## Volume and mass units (add to `lib/units.ts`)

- `unitQuantities`: add `{ value: 'volume', label: 'Fuel Volume' }` and
  `{ value: 'mass', label: 'Mass' }`.
- `unitOptions.volume`: `{ value: 'l', label: 'Litres (L)', symbol: 'L' }` (identity) and
  `{ value: 'usgal', label: 'US gallons (US gal)', symbol: 'US gal' }` with
  `L = US gal × 3.785411784` (exact: 1 US gallon = 231 in³, 1 in = 2.54 cm). Imperial gallon
  (`4.54609 L`, exact) only if you want it (open question).
- `unitOptions.mass`: `{ value: 'kg', label: 'Kilograms (kg)', symbol: 'kg' }` (identity) and
  `{ value: 'lb', label: 'Pounds (lb)', symbol: 'lb' }` with `kg = lb × 0.45359237` (exact,
  international avoirdupois pound).
- `BASE_UNITS`/defaults: `volume: 'l'`, `mass: 'kg'`.
- `prisma/schema.prisma` `type UnitPreferences`: add `volume String?` and `mass String?`. Run
  `npx prisma generate`.

## Fuel types and densities

Add to `constants/data.ts` (mirrors `contributionFrequencies`):

```ts
export const fuelTypes = [
	{ value: 'avgas', label: 'AVGAS', densityKgPerL: ... },
	{ value: 'jetA', label: 'Jet A', densityKgPerL: ... },
] as const;
```

Density values are an open question. Candidates:

- FAA standard weights, Aircraft Weight and Balance Handbook (FAA-H-8083-1): AVGAS 6.0 lb/US gal,
  Jet A 6.7 lb/US gal. In kg/L: `6.0 × 0.45359237 / 3.785411784` (≈ 0.71896) and
  `6.7 × 0.45359237 / 3.785411784` (≈ 0.80284). Define them with that expression so lb/US gal
  results come out exact. Verify the values in the handbook before using them.
- Specification ranges (e.g. ASTM D1655 for Jet A, ASTM D910 for AVGAS) give a range at 15 °C
  rather than one value; confirm the numbers from the standards if you prefer this source.

The plan proposes fixed FAA standard weights, not user-adjustable.

## Formulas

- `tripFuel = fuelBurnRate × flightTime / 60`
- `reserveFuel = fuelBurnRate × reserveTime / 60`
- `totalFuel = tripFuel + reserveFuel`
- `<x>Mass = <x>Fuel × fuelDensity`

Source: basic fuel planning (fuel = burn rate × time) as in the PHAK flight planning section and
E6B fuel computations; densities from the source chosen above. Reserve times are regulatory inputs
the pilot enters; possible presets (to verify before use): 14 CFR 91.151 VFR day 30 min, VFR night
45 min; 14 CFR 91.167 IFR 45 min.

## Zod schema rules (`schemas/index.ts`)

```ts
export const createFuelPlanningFormDataSchema = (units: UnitPreferences) =>
	z.object({
		fuelBurnRate: unitNumberFieldSchema('Fuel burn rate', 'volume', units.volume, {
			min: 0,
			minExclusive: true,
			max: 10000,
		}),
		flightTime: positiveNumberFieldSchemaWithMax('Flight time', 1440),
		reserveTime: positiveNumberFieldSchemaWithMax('Reserve time', 300),
		fuelType: z.enum(['avgas', 'jetA'], {
			errorMap: () => ({ message: 'Fuel type must be AVGAS or Jet A' }),
		}),
	});

export const fuelPlanningFormDataSchema = createFuelPlanningFormDataSchema(BASE_UNITS);
```

- Limits are proposals (open questions). Burn-rate messages show the user's unit, e.g.
  `"Fuel burn rate must be greater than 0 US gal"` (the helper prints the volume symbol; append
  `/h` in the field name or helper if you want `US gal/h` — keep it consistent).
- `fuelType` enum values come from `fuelTypes`.

## UI

- `Calculator.tsx`: mirror the crosswind calculator. `defaultValues` (base units, proposal):
  `{ fuelBurnRate: 30, flightTime: 60, reserveTime: 30, fuelType: 'avgas' }`. Inputs: "Fuel Burn
  Rate" (`unitSymbol` = `getUnitSymbol('volume', units.volume)` + `'/h'`), "Fuel Type" (Select from
  `fuelTypes`), "Flight Time" (`unitSymbol="min"`), "Reserve Time" (`unitSymbol="min"`).
- `Report.tsx`: inputs (burn rate, fuel type, flight time, reserve time), `ReportDivider`, Trip
  Fuel, Reserve Fuel, Total Fuel — each `ReportGroup` showing volume and mass, e.g.
  `"90 L · 64.7 kg"` (or separate groups, your choice), then `<AviationDisclaimer />`.
- `Info.tsx`: trip vs reserve fuel, why density matters (fuel is loaded by volume, weight and
  balance uses mass), that density varies with temperature and the calculator uses a fixed
  standard value, the disclaimer sentence, `ReportSource` to the FAA handbook page
  (`https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak`).

## Files to create or change

Follow "Adding a calculator" and "Adding an aviation calculator" in AGENTS.md:

1. `prisma/schema.prisma`: `volume String?`, `mass String?` on `UnitPreferences`;
   `type FuelPlanningCalculationFormData { fuelBurnRate Float flightTime Float reserveTime Float
fuelType String }`, `model FuelPlanningCalculation`, `FuelPlanningCalculations
FuelPlanningCalculation[]` on `User`. Run `npx prisma generate`.
2. `lib/units.ts` + `lib/units.test.ts`: volume and mass units.
3. `constants/data.ts`: `fuelTypes`.
4. `schemas/index.ts` + `schemas/index.test.ts`: schemas above; `unitPreferencesSchema` tests
   include `volume` and `mass`.
5. `types/calculations.ts`: `IFuelPlanningFormData`, `FuelPlanningReportProps extends
IFuelPlanningFormData { fuelDensity; tripFuel; reserveFuel; totalFuel; tripFuelMass;
reserveFuelMass; totalFuelMass }`, add to `CalculationType`.
6. `lib/calculatorFns.ts` + test: `calculateFuelPlanning`.
7. `lib/utils.ts`: `getFuelTypeLabel(value)` like `getContributionFrequencyLabel`, with a test in
   `lib/utils.test.ts`.
8. `constants/api.ts`: `FUEL_PLANNING_CALCULATIONS_API_URL = '/api/fuel-planning-calculations'`,
   `FUEL_PLANNING_CALCULATIONS_QUERY_KEY = 'fuel-planning-calculations'`.
9. `constants/calculators.ts`:
   `{ name: 'Fuel Planning Calculator', url: 'fuel-planning-calculator', category: 'aviation', description: 'Calculate the trip fuel, reserve fuel and total fuel by volume and mass, given the fuel burn rate, flight time, reserve time and fuel type. Additionally, logged in users can save their calculations.' }`.
10. `app/api/fuel-planning-calculations/route.ts` and `[id]/route.ts`.
11. `app/(calculators)/fuel-planning-calculator/`: `page.tsx`, `Calculator.tsx`, `Report.tsx`,
    `Info.tsx`.
12. `README.md` aviation entry and units sentence (fuel volume, mass), `AGENTS.md` Project list,
    check off 05 in `00-epic.md`.

## Test cases

Units (`lib/units.test.ts`), exact definitions:

- `fromBaseUnit(3.785411784, 'volume', 'usgal')` → `1`; `toBaseUnit(1, 'volume', 'usgal')` →
  `3.785411784`.
- `fromBaseUnit(0.45359237, 'mass', 'lb')` → `1`; `toBaseUnit(1, 'mass', 'lb')` → `0.45359237`.
- `withDefaultUnitPreferences({})` includes `volume: 'l'` and `mass: 'kg'`.

`calculateFuelPlanning` (expected values from the formulas; masses from the density definitions):

| Burn   | Flight | Reserve | Fuel  | Trip | Reserve | Total | Total mass                  |
| ------ | ------ | ------- | ----- | ---- | ------- | ----- | --------------------------- |
| 40 L/h | 90 min | 45 min  | AVGAS | 60 L | 30 L    | 90 L  | `90 × densityKgPerL(avgas)` |
| 40 L/h | 90 min | 45 min  | Jet A | 60 L | 30 L    | 90 L  | `90 × densityKgPerL(jetA)`  |
| 30 L/h | 0 min  | 30 min  | AVGAS | 0 L  | 15 L    | 15 L  | `15 × densityKgPerL(avgas)` |
| 30 L/h | 60 min | 0 min   | AVGAS | 30 L | 0 L     | 30 L  | `30 × densityKgPerL(avgas)` |

- If FAA standard weights are chosen: burn 10 US gal/h, 120 min, 30 min reserve (form values
  converted with `formDataToBaseUnits`) → total 25 US gal; AVGAS total mass converted back to lb
  is 150 lb (25 × 6.0) and Jet A 167.5 lb (25 × 6.7), `toBeCloseTo(x, 6)`.
- Inputs are returned unchanged in the report.

Schema: valid input passes; missing fields; burn rate 0 rejected, negative times rejected; limits
accepted at the boundary and rejected beyond; unknown fuel type rejected with the message;
messages in US gal when that unit is used; numeric strings coerced.

## Acceptance criteria

- The units modal shows Fuel Volume (L, US gal) and Mass (kg, lb) selects; existing preferences
  without them get defaults without losing other choices.
- `/fuel-planning-calculator` appears in the Aviation section and in search.
- Results match the test cases in every unit combination; storage is L/h and minutes.
- Save, rename, update, import, delete and free-plan limit work. Disclaimer present.
- Lint, typecheck, format check and tests pass.

## Open questions

1. **Fuel densities.** Use FAA standard weights (AVGAS 6.0 lb/US gal, Jet A 6.7 lb/US gal, from
   FAA-H-8083-1) or values from ASTM specifications? Please confirm the source and numbers.
2. **Fixed or adjustable density.** Fixed per fuel type (plan) or an optional density override
   input (would need a field in the Prisma form data)?
3. **Time input.** Minutes (plan) or hours + minutes fields? Store as minutes either way?
4. **Extra fuel items.** Add taxi fuel, contingency % or alternate fuel? Out of scope for now.
5. **Reserve presets.** Offer presets (VFR day 30 min, VFR night 45 min, IFR 45 min under 14 CFR
   91.151/91.167, to be verified) or EASA equivalents, or keep a free input?
6. **Units.** Include imperial gallons? Allow burn rate in mass per hour (kg/h, lb/h)?
7. **Limits.** Burn rate up to 10,000 L/h, flight time up to 24 h, reserve up to 5 h?
