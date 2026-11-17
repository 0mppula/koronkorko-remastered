# 05 Fuel Planning Calculator

Epic: `epic/aviation-calculators` (see `00-epic.md`) · Branch: `feature/fuel-planning-calculator`
(create from up-to-date `epic/aviation-calculators` after 01 is merged; merge 04 and 05 one at a
time, PR back into the epic).

## Goal

Given a fuel burn rate, flight time (hours and minutes), reserve time (minutes), optional taxi and
extra fuel, and the fuel type (AVGAS or Jet A), calculate trip fuel, reserve fuel and total fuel
in the user's fuel unit, plus the total converted to the other kind (volume ↔ mass) with the fuel
density. Adds the **fuel** unit preference (L, US gal, kg, lb).

## Scope

- Full-stack calculator like `dividend-yield-calculator`: Prisma model, API routes, save, rename,
  update, import, delete, free-plan limit, tests.
- One "Fuel" unit preference with L, US gal, kg and lb in `lib/units.ts`, Prisma
  `UnitPreferences`, units modal (automatic via `unitQuantities`). Mass units convert through the
  selected fuel type's density.
- Fuel types with fixed standard densities (not user-adjustable in v1).
- Hours + minutes input for flight time.

## Out of scope

- Contingency percentage, alternate fuel, unusable fuel.
- Imperial gallons.
- Weight and balance, tank capacity checks, distance/groundspeed based flight time.
- Temperature-corrected or user-adjustable fuel density.
- Reserve presets or any encoded regulation (reserve is a plain minutes input).

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

| Field                    | Base unit | Preference | Notes                                                                        |
| ------------------------ | --------- | ---------- | ---------------------------------------------------------------------------- |
| `fuelBurnRate` (input)   | L/h       | fuel       | > 0, ≤ 10,000 L/h; displayed as `<fuel symbol>/h`                            |
| `flightTime` (input)     | minutes   | none       | 0–1,440 (24 h); entered as hours + minutes, stored and calculated in minutes |
| `reserveTime` (input)    | minutes   | none       | 0–180                                                                        |
| `taxiFuel` (input)       | L         | fuel       | optional amount, ≥ 0                                                         |
| `extraFuel` (input)      | L         | fuel       | optional amount, ≥ 0                                                         |
| `fuelType` (input)       | —         | none       | `'avgas' \| 'jetA'`                                                          |
| `fuelDensity` (output)   | kg/L      | none       | from the fuel type                                                           |
| `tripFuel` (output)      | L         | fuel       |                                                                              |
| `reserveFuel` (output)   | L         | fuel       |                                                                              |
| `totalFuel` (output)     | L         | fuel       | trip + reserve + taxi + extra                                                |
| `totalFuelMass` (output) | kg        | —          | `totalFuel × fuelDensity`, for the "other kind" display                      |

Time is not one of the epic's base units; minutes is the base for time in this calculator.

`fuelPlanningUnitFields`: `{ fuelBurnRate: 'fuel', taxiFuel: 'fuel', extraFuel: 'fuel' }` (a
per-hour rate converts with the same factor as the amount).

## Fuel unit (add to `lib/units.ts`)

**Decided:** one "Fuel" preference with L, US gal, kg and lb (no imperial gallons). The burn rate
and all fuel amounts use it. Stored values are always litres (the base volume), never rounded.

- `unitQuantities`: add `{ value: 'fuel', label: 'Fuel' }`.
- `unitOptions.fuel`, each with a `kind`:
    - `{ value: 'l', label: 'Litres (L)', symbol: 'L', kind: 'volume' }` (identity).
    - `{ value: 'usgal', label: 'US gallons (US gal)', symbol: 'US gal', kind: 'volume' }`:
      `L = US gal × 3.785411784` (exact: 1 US gallon = 231 in³, 1 in = 2.54 cm).
    - `{ value: 'kg', label: 'Kilograms (kg)', symbol: 'kg', kind: 'mass' }`:
      `L = kg ÷ density`.
    - `{ value: 'lb', label: 'Pounds (lb)', symbol: 'lb', kind: 'mass' }`:
      `L = lb × 0.45359237 ÷ density` (exact international avoirdupois pound).
- Mass units need the fuel density, so extend the foundation helpers with an optional context:
    - `toBaseUnit(value, quantity, unit, context?)` / `fromBaseUnit(...)` with
      `context?: { fuelDensityKgPerL?: number }`; a mass fuel unit without a density throws.
    - `formDataToBaseUnits(formData, unitFields, units, getContext?)` /
      `formDataFromBaseUnits(...)` with `getContext?: (formData) => UnitContext`.
    - `useCalculator` gets an optional `getUnitContext` and passes it to every conversion
      (calculate, save, update, import, resets, units change). Finance and other aviation
      calculators don't pass it, so they are unaffected.
    - For this calculator: `getUnitContext = (data) => ({ fuelDensityKgPerL:
getFuelDensity(data.fuelType) })`.
- If the user changes the fuel type while using a mass unit, the entered numbers stay as typed;
  they are converted to litres with the new density when calculating or saving.
- Other-kind pairing for the report: L ↔ kg and US gal ↔ lb (a volume unit shows the total mass in
  its paired mass unit and vice versa). Add `getPairedFuelUnit(unit)` to `lib/units.ts`.
- Defaults: `fuel: 'l'` (see open questions). Display precision: 1 decimal (see open questions).
- `prisma/schema.prisma` `type UnitPreferences`: add `fuel String?`. Run `npx prisma generate`.

## Fuel types and densities

Add to `constants/data.ts` (mirrors `contributionFrequencies`):

```ts
export const fuelTypes = [
	{ value: 'avgas', label: 'AVGAS', densityKgPerL: (6.0 * 0.45359237) / 3.785411784 },
	{ value: 'jetA', label: 'Jet A', densityKgPerL: (6.7 * 0.45359237) / 3.785411784 },
] as const;
```

**Decided:** fixed standard densities in v1, not user-adjustable:

- AVGAS **6.0 lb/US gal** (≈ 0.71896 kg/L) and Jet A **6.7 lb/US gal** (≈ 0.80284 kg/L).
- Source: FAA standard fuel weights, FAA Aircraft Weight and Balance Handbook (FAA-H-8083-1).
  Cite it in a one-line comment next to `fuelTypes` and in `Info.tsx`.
- Define them with the expressions above (lb/US gal × kg per lb ÷ L per US gal) so results in
  lb and US gal come out exact.
- Add `getFuelDensity(fuelType)` (in `lib/units.ts` or `lib/utils.ts`) returning `densityKgPerL`.

## Formulas

- `tripFuel = fuelBurnRate × flightTime / 60`
- `reserveFuel = fuelBurnRate × reserveTime / 60`
- `totalFuel = tripFuel + reserveFuel + (taxiFuel ?? 0) + (extraFuel ?? 0)`
- `totalFuelMass = totalFuel × fuelDensity`

All in base units (L, L/h, minutes, kg/L). No contingency percentage in v1.

Source: basic fuel planning (fuel = burn rate × time) as in the PHAK flight planning section and
E6B fuel computations; densities from FAA-H-8083-1 (above). Reserve time is a plain input in
minutes; the calculator doesn't encode or validate against any regulation.

## Zod schema rules (`schemas/index.ts`)

```ts
const optionalFuelAmount = (fieldName: string) =>
	z.preprocess(
		(value) => (value === '' || value === null ? undefined : value),
		positiveNumberFieldSchema(fieldName).optional()
	);

export const createFuelPlanningFormDataSchema = (units: UnitPreferences) =>
	z
		.object({
			fuelBurnRate: greaterThanZeroNumberFieldSchema('Fuel burn rate'),
			flightTime: positiveNumberFieldSchemaWithMax('Flight time', 1440),
			reserveTime: positiveNumberFieldSchemaWithMax('Reserve time', 180),
			taxiFuel: optionalFuelAmount('Taxi fuel'),
			extraFuel: optionalFuelAmount('Extra fuel'),
			fuelType: z.enum(['avgas', 'jetA'], {
				errorMap: () => ({ message: 'Fuel type must be AVGAS or Jet A' }),
			}),
		})
		.superRefine((data, ctx) => { ... }); // burn-rate max in base units, see below

export const fuelPlanningFormDataSchema = createFuelPlanningFormDataSchema(BASE_UNITS);
```

- Limits (decided): burn rate > 0 and ≤ 10,000 per hour, flight time ≤ 24 h (1,440 min), reserve
  ≤ 180 min. Times are minutes in every unit setting.
- The burn-rate maximum is 10,000 L/h in base units. With a mass unit the conversion depends on
  the fuel type, so it can't use `unitNumberFieldSchema`; check it in `superRefine`: convert
  `fuelBurnRate` to L/h with `toBaseUnit(value, 'fuel', units.fuel, { fuelDensityKgPerL:
getFuelDensity(data.fuelType) })` and, if above 10,000 (with the 01 tolerance), add an issue on
  `fuelBurnRate` showing the limit in the user's unit, e.g. `"Fuel burn rate cannot be greater
than 2,641.7 US gal/h"`. Skip the check if `fuelType` is invalid (its own issue is reported).
- Taxi and extra fuel: optional (empty = none), not negative. No maximum (see open questions).
- `fuelType` enum values come from `fuelTypes`.

## UI

- `Calculator.tsx`: mirror the crosswind calculator. `defaultValues` (base units, proposal):
  `{ fuelBurnRate: 30, flightTime: 60, reserveTime: 30, taxiFuel: undefined, extraFuel: undefined,
fuelType: 'avgas' }`. Pass `unitFields` and `getUnitContext` to `useCalculator`. Inputs:
    - "Fuel Type" (Select from `fuelTypes`, like "Distribution Frequency").
    - "Fuel Burn Rate" (`unitSymbol` = `getUnitSymbol('fuel', units.fuel)` + `'/h'`).
    - "Flight Time": new `components/Form/HoursMinutesInput.tsx`, a controlled input bound to the
      single `flightTime` field (minutes). It shows two number boxes, hours (`h`) and minutes
      (`min`), derived from the value (`h = Math.floor(v / 60)`, `min = v − h × 60`), and calls
      `onChange(hours × 60 + minutes)`. Minutes above 59 are normalized on blur (0 h 90 min →
      1 h 30 min). Validation errors come from the schema on the `flightTime` field. No new
      dependency; style the boxes like `NumberInputWithIcon` (`iconType="unit"`).
    - "Reserve Time" (`unitSymbol="min"`).
    - "Taxi Fuel (optional)" and "Extra Fuel (optional)" (fuel symbol; `value={field.value ?? ''}`;
      no `ifFieldIsEmpty` reset to 0).
- `Report.tsx`: inputs (fuel type with density, burn rate, flight time as `"1 h 30 min"`, reserve
  time), `ReportDivider`, Trip Fuel, Reserve Fuel, Taxi Fuel and Extra Fuel (only when given),
  Total Fuel in the user's fuel unit, then the total in the paired unit of the other kind, labelled
  "Total Fuel (mass)" or "Total Fuel (volume)" (e.g. `90.0 L` and `64.7 kg`; `25.0 US gal` and
  `150.0 lb`), then `<AviationDisclaimer />`.
- `Info.tsx`: trip, reserve, taxi and extra fuel; typical reserve values (e.g. 30 min for VFR by
  day, 45 min at night or under IFR) and that pilots must check the rules that apply to them
  (country, type of operation, aircraft); why density matters (fuel is loaded by volume, weight
  and balance uses mass); that density varies with temperature and the calculator uses fixed FAA
  standard weights (AVGAS 6.0 lb/US gal, Jet A 6.7 lb/US gal, FAA-H-8083-1); the disclaimer
  sentence; `ReportSource` to the FAA handbook page
  (`https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak`).

## Files to create or change

Follow "Adding a calculator" and "Adding an aviation calculator" in AGENTS.md:

1. `prisma/schema.prisma`: `fuel String?` on `UnitPreferences`;
   `type FuelPlanningCalculationFormData { fuelBurnRate Float flightTime Float reserveTime Float
taxiFuel Float? extraFuel Float? fuelType String }`, `model FuelPlanningCalculation`,
   `FuelPlanningCalculations FuelPlanningCalculation[]` on `User`. Run `npx prisma generate`.
2. `lib/units.ts` + `lib/units.test.ts`: fuel unit, density context, `getPairedFuelUnit`,
   `getFuelDensity`. `hooks/useCalculator.ts`: optional `getUnitContext`.
3. `constants/data.ts`: `fuelTypes`.
4. `schemas/index.ts` + `schemas/index.test.ts`: schemas above; `unitPreferencesSchema` tests
   include `fuel`.
5. `types/calculations.ts`: `IFuelPlanningFormData`, `FuelPlanningReportProps extends
IFuelPlanningFormData { fuelDensity; tripFuel; reserveFuel; totalFuel; totalFuelMass }`, add to
   `CalculationType`.
6. `lib/calculatorFns.ts` + test: `calculateFuelPlanning`.
7. `lib/utils.ts`: `getFuelTypeLabel(value)` like `getContributionFrequencyLabel`, and
   `formatHoursMinutes(minutes)` (`90` → `"1 h 30 min"`, `45` → `"0 h 45 min"`, `1440` →
   `"24 h 0 min"`), with tests in `lib/utils.test.ts`.
8. `components/Form/HoursMinutesInput.tsx`.
9. `constants/api.ts`: `FUEL_PLANNING_CALCULATIONS_API_URL = '/api/fuel-planning-calculations'`,
   `FUEL_PLANNING_CALCULATIONS_QUERY_KEY = 'fuel-planning-calculations'`.
10. `constants/calculators.ts`:
    `{ name: 'Fuel Planning Calculator', url: 'fuel-planning-calculator', category: 'aviation', description: 'Calculate the trip fuel, reserve fuel and total fuel by volume or mass, given the fuel burn rate, flight time, reserve time, optional taxi and extra fuel, and fuel type. Additionally, logged in users can save their calculations.' }`.
11. `app/api/fuel-planning-calculations/route.ts` and `[id]/route.ts` (the `POST` saves `taxiFuel`
    and `extraFuel` only when given).
12. `app/(calculators)/fuel-planning-calculator/`: `page.tsx`, `Calculator.tsx`, `Report.tsx`,
    `Info.tsx`.
13. `README.md` aviation entry and units sentence (fuel), `AGENTS.md` Project list, check off 05
    in `00-epic.md`.

## Test cases

Units (`lib/units.test.ts`), exact definitions (`d_avgas`, `d_jetA` = the `fuelTypes` densities):

- `fromBaseUnit(3.785411784, 'fuel', 'usgal')` → `1`; `toBaseUnit(1, 'fuel', 'usgal')` →
  `3.785411784`.
- `toBaseUnit(6, 'fuel', 'lb', { fuelDensityKgPerL: d_avgas })` → `3.785411784` (6 lb of AVGAS is
  1 US gal by definition); `toBaseUnit(6.7, 'fuel', 'lb', { fuelDensityKgPerL: d_jetA })` →
  `3.785411784`.
- `toBaseUnit(d_avgas, 'fuel', 'kg', { fuelDensityKgPerL: d_avgas })` → `1`.
- Mass unit without a density throws; volume units ignore the context.
- `getPairedFuelUnit`: `l` ↔ `kg`, `usgal` ↔ `lb`.
- `withDefaultUnitPreferences({})` includes `fuel: 'l'`.
- `formDataToBaseUnits` with `getContext` converts mass fields with the density of the record's
  own `fuelType`.

`calculateFuelPlanning` (expected values from the formulas; masses from the density definitions):

| Burn   | Flight | Reserve | Taxi | Extra | Fuel  | Trip | Reserve | Total | Total mass      |
| ------ | ------ | ------- | ---- | ----- | ----- | ---- | ------- | ----- | --------------- |
| 40 L/h | 90 min | 45 min  | —    | —     | AVGAS | 60 L | 30 L    | 90 L  | `90 × d_avgas`  |
| 40 L/h | 90 min | 45 min  | —    | —     | Jet A | 60 L | 30 L    | 90 L  | `90 × d_jetA`   |
| 40 L/h | 90 min | 45 min  | 5 L  | 10 L  | AVGAS | 60 L | 30 L    | 105 L | `105 × d_avgas` |
| 30 L/h | 0 min  | 30 min  | —    | —     | AVGAS | 0 L  | 15 L    | 15 L  | `15 × d_avgas`  |
| 30 L/h | 60 min | 0 min   | —    | —     | AVGAS | 30 L | 0 L     | 30 L  | `30 × d_avgas`  |

Unit round trips (form values converted with `formDataToBaseUnits`, results with `fromBaseUnit`),
`toBeCloseTo(x, 6)`:

- US gal: burn 10 US gal/h, 2 h, reserve 30 min, AVGAS → total 25 US gal; other kind 150 lb
  (25 × 6.0). Jet A → 25 US gal and 167.5 lb (25 × 6.7).
- lb: burn 60 lb/h AVGAS (= 10 US gal/h), 2 h, reserve 30 min → trip 120 lb, reserve 30 lb,
  total 150 lb; other kind 25 US gal. Burn 67 lb/h Jet A → total 167.5 lb, 25 US gal.
- Fuel type change: the same 150 lb total is 25 US gal of AVGAS but `150 / 6.7` US gal of Jet A.
- Inputs are returned unchanged in the report; missing taxi/extra fuel count as 0.

Schema: valid input passes; missing required fields; taxi/extra missing or `''` pass, negative
rejected; burn rate 0 rejected; flight time 1,440 accepted, 1,441 rejected; reserve 180 accepted,
181 rejected; burn rate 10,000 L/h accepted, 10,001 rejected, and with `fuel: 'usgal'` the message
shows the limit in US gal/h; with `fuel: 'kg'` the limit depends on the fuel type; unknown fuel
type rejected with the message; numeric strings coerced.

## Acceptance criteria

- The units modal shows a Fuel select (L, US gal, kg, lb); existing preferences without it get the
  default without losing other choices.
- `/fuel-planning-calculator` appears in the Aviation section and in search.
- Flight time is entered as hours and minutes; stored values are minutes.
- Results match the test cases in every fuel unit and fuel type; the report shows the total in the
  other kind (volume ↔ mass); storage is L/h, L and minutes.
- Info shows typical reserve values with the note to check applicable rules, and the density
  values with their source.
- Save, rename, update, import, delete and free-plan limit work. Disclaimer present.
- Lint, typecheck, format check and tests pass.

## Open questions

1. **Burn-rate limit unit.** The plan reads "at most 10,000 per hour" as 10,000 L/h in base units
   (like the 200 kt wind limit), shown in the user's unit (e.g. ≈ 2,641.7 US gal/h). Or should it
   be 10,000 in whatever fuel unit is selected?
2. **Taxi and extra fuel maximum.** No maximum is planned (only ≥ 0). Add one?
3. **Fuel unit default and precision.** Default `L` and 1 decimal for fuel amounts?
4. **Paired unit.** The "other kind" total uses L ↔ kg and US gal ↔ lb. OK?
