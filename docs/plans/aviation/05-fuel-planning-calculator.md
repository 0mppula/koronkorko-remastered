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
  `unitPreferences`, `unitPreferencesSchema`, units modal (automatic via `unitQuantities`). Mass
  units convert through the selected fuel type's density.
- Fuel types with fixed standard densities (not user-adjustable in v1).
- Hours + minutes input for flight time.

## Out of scope

- Contingency percentage, alternate fuel, unusable fuel.
- Imperial gallons.
- Weight and balance, tank capacity checks, distance/groundspeed based flight time.
- Temperature-corrected or user-adjustable fuel density.
- Reserve presets or any encoded regulation (reserve is a plain minutes input).

## Foundation you rely on (from 01)

- `lib/units.ts`: `unitQuantities`, `unitOptions`, `unitFractionDigits`, `UnitPreferences`,
  `BASE_UNITS`, `DEFAULT_UNIT_PREFERENCES`, `UnitFields<T>`, `toBaseUnit`, `fromBaseUnit`,
  `getUnitSymbol`, `formatUnitValue`, `formatBaseValue`, `withDefaultUnitPreferences`,
  `formDataToBaseUnits`, `formDataFromBaseUnits`, `formDataToExactBaseUnits`,
  `changeFormDataUnits`. Adding an entry to `unitQuantities`/`unitOptions` automatically adds a
  select to the units modal (`components/Nav/UnitPreferencesModal.tsx`); `unitPreferencesSchema`
  is an explicit object, so the quantity must be added there too. The persisted store
  (`hooks/useUnits.ts`) and `User.preferences.units` fill missing quantities with defaults.
- `schemas/index.ts`: `unitNumberFieldSchema(fieldName, quantity, unit, { min, max, minExclusive })`
  and the private `createUnitLimits` helper (limits checked in base units, messages rounded
  inwards in the user's unit), `positiveNumberFieldSchema`, `greaterThanZeroNumberFieldSchema`.
- `hooks/useCalculator.ts` `unitFields`; `NumberInputWithIcon iconType="unit"`;
  `CalculatorDisclaimer` (`category="aviation"`) and `calculatorDisclaimers.aviation`; `category`
  in `constants/calculators.ts`.
- Select pattern: "Distribution Frequency" in
  `app/(calculators)/dividend-yield-calculator/Calculator.tsx` (`Select` with
  `onValueChange={field.onChange}`; the fuel type is already a string, so `value={field.value}`).
- `app/(calculators)/crosswind-calculator/` as the closest aviation example.

If any name differs in the merged code, follow the code.

## Inputs and outputs (base units)

| Field                    | Base unit | Preference | Notes                                                                        |
| ------------------------ | --------- | ---------- | ---------------------------------------------------------------------------- |
| `fuelBurnRate` (input)   | L/h       | fuel       | > 0, ≤ 10,000 L/h; displayed as `<fuel symbol>/h`                            |
| `flightTime` (input)     | minutes   | none       | 0–1,440 (24 h); entered as hours + minutes, stored and calculated in minutes |
| `reserveTime` (input)    | minutes   | none       | 0–180                                                                        |
| `taxiFuel` (input)       | L         | fuel       | optional amount (`null` when empty), ≥ 0, ≤ 10,000 L                         |
| `extraFuel` (input)      | L         | fuel       | optional amount (`null` when empty), ≥ 0, ≤ 10,000 L                         |
| `fuelType` (input)       | —         | none       | `'avgas' \| 'jetA'` (`FuelType`; Prisma `enum FuelType`)                     |
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
- `unitOptions.fuel`, each with a `kind` (`UnitOption.kind`):
    - `{ value: 'l', label: 'Litres (L)', symbol: 'L', kind: 'volume' }` (identity).
    - `{ value: 'usgal', label: 'US gallons (US gal)', symbol: 'US gal', kind: 'volume' }`:
      `L = US gal × 3.785411784` (exact: 1 US gallon = 231 in³, 1 in = 2.54 cm;
      `US_GALLON_IN_LITRES`, exported).
    - `{ value: 'kg', label: 'Kilograms (kg)', symbol: 'kg', kind: 'mass' }`:
      `L = kg ÷ density`.
    - `{ value: 'lb', label: 'Pounds (lb)', symbol: 'lb', kind: 'mass' }`:
      `L = lb × 0.45359237 ÷ density` (exact international avoirdupois pound;
      `POUND_IN_KILOGRAMS`, exported).
- Mass units need the fuel density, so the foundation helpers take an optional context:
    - `UnitContext = { fuelDensityKgPerL?: number }`. `toBaseUnit(value, quantity, unit,
context?)` / `fromBaseUnit(...)` / `formatBaseValue(...)` pass it to the option's
      `toBase`/`fromBase`; a mass fuel unit without a density > 0 throws (`'Fuel mass units need a
fuel density'`).
    - `formDataToBaseUnits(formData, unitFields, units, getContext?)`, `formDataFromBaseUnits(...)`,
      `unitFormValuesFromBase`, `formDataToExactBaseUnits` and `changeFormDataUnits` take
      `getContext?: GetUnitContext<T>` (`(formData) => UnitContext`), called with the record being
      converted.
    - `useCalculator` gets an optional `getUnitContext` (a stable reference, like `unitFields`) and
      passes it to every conversion (calculate, save, update, import, resets, units change).
      Finance and other aviation calculators don't pass it, so they are unaffected.
    - For this calculator: `getUnitContext: getFuelUnitContext` from `lib/utils.ts`
      (`({ fuelType }) => ({ fuelDensityKgPerL: getFuelDensity(fuelType) })`).
- If the user changes the fuel type while using a mass unit, the entered numbers stay as typed;
  they are converted to litres with the new density when calculating or saving.
  `formDataToExactBaseUnits` treats a changed context as an edit, so the old exact base value is
  not reused for those fields.
- Other-kind pairing for the report (decided): L ↔ kg and US gal ↔ lb (a volume unit shows the
  total mass in its paired mass unit and vice versa). `getPairedFuelUnit(unit)` in `lib/units.ts`.
- Defaults (decided): `fuel: 'l'`. Display precision: `unitFractionDigits.fuel = 2` for fuel
  amounts and rates (like speed and temperature).
- `unitPreferencesSchema`: add `fuel: unitValueSchema('fuel')`.
- `prisma/schema.prisma` `type unitPreferences`: add `fuel String?`. Run `npx prisma generate`.

## Fuel types and densities

Add to `constants/data.ts` (mirrors `contributionFrequencies`):

```ts
// lb/US gal × kg/lb ÷ L/US gal. FAA-H-8083-1B: AVGAS 6 lb/US gal; Jet A 6.68 at 59 °F (Fig. 3-4).
export const fuelTypes = [
	{ value: 'avgas', label: 'AVGAS', densityKgPerL: (6.0 * 0.45359237) / 3.785411784 },
	{ value: 'jetA', label: 'Jet A', densityKgPerL: (6.68 * 0.45359237) / 3.785411784 },
] as const;
```

**Decided:** fixed standard densities in v1, not user-adjustable:

- AVGAS **6.0 lb/US gal** (≈ 0.71896 kg/L) and Jet A **6.68 lb/US gal** (≈ 0.80044 kg/L).
- Sources (both read): AVGAS 6 lb/US gal is stated in the PHAK (FAA-H-8083-25C, weight and
  balance chapter) and the Weight and Balance Handbook (FAA-H-8083-1B, chapter 3). Jet A 6.68
  lb/US gal is FAA-H-8083-1B Figure 3-4 at 59 °F (15 °C, ISA); it is often rounded to 6.7, and no
  FAA handbook states 6.7 as a standard. Cite them in a one-line comment next to `fuelTypes` and
  in `Info.tsx`, which also says that the actual density varies with temperature.
- Define them with the expressions above (lb/US gal × kg per lb ÷ L per US gal) so results in
  lb and US gal come out exact.
- `lib/utils.ts`: `type FuelType = (typeof fuelTypes)[number]['value']`,
  `getFuelDensity(fuelType)` returning `densityKgPerL` (`undefined` for an unknown fuel type, so
  mass units can't convert it), and `getFuelUnitContext` (above). Prisma has a matching
  `enum FuelType { avgas jetA }`, so the generated form data type matches the zod enum.

## Formulas

- `tripFuel = fuelBurnRate × flightTime / 60`
- `reserveFuel = fuelBurnRate × reserveTime / 60`
- `totalFuel = tripFuel + reserveFuel + (taxiFuel ?? 0) + (extraFuel ?? 0)`
- `totalFuelMass = totalFuel × fuelDensity`

All in base units (L, L/h, minutes, kg/L). No contingency percentage in v1. `fuelDensity` is
`getFuelDensity(fuelType) ?? NaN` (the schema rejects unknown fuel types first).

Source: basic fuel planning (fuel = burn rate × time) as in the PHAK (FAA-H-8083-25C, chapter 16,
basic calculations, cited in the `calculateFuelPlanning` comment) and E6B fuel computations;
densities from FAA-H-8083-1B (above). Reserve time is a plain input in minutes; the calculator
doesn't encode or validate against any regulation.

## Zod schema rules (`schemas/index.ts`)

```ts
// Nullish to match Prisma's optional field; empty input means none.
const optionalFuelAmountSchema = (fieldName: string) =>
	z.preprocess(
		(value) => (value === '' || value === null ? undefined : value),
		positiveNumberFieldSchema(fieldName).nullish()
	);

export const createFuelPlanningFormDataSchema = (units: UnitPreferences) =>
	z
		.object({
			fuelBurnRate: greaterThanZeroNumberFieldSchema('Fuel burn rate'),
			flightTime: positiveNumberFieldSchema('Flight time').max(1440, {
				message: 'Flight time cannot be greater than 24 h',
			}),
			reserveTime: positiveNumberFieldSchema('Reserve time').max(180, {
				message: 'Reserve time cannot be greater than 180 min',
			}),
			taxiFuel: optionalFuelAmountSchema('Taxi fuel'),
			extraFuel: optionalFuelAmountSchema('Extra fuel'),
			fuelType: z.enum(fuelTypes.map((t) => t.value) as [FuelType, ...FuelType[]], {
				errorMap: () => ({ message: 'Fuel type must be AVGAS or Jet A' }),
			}),
		})
		// Mass units convert through the fuel type's density, so the maxima are checked here.
		.superRefine((data, ctx) => { ... }); // fuel maxima in base units, see below

export const fuelPlanningFormDataSchema = createFuelPlanningFormDataSchema(BASE_UNITS);
```

- Limits (decided): burn rate > 0 and ≤ 10,000 L/h, flight time ≤ 24 h (1,440 min), reserve
  ≤ 180 min, taxi fuel and extra fuel each ≤ 10,000 L. Fuel limits are in base units; times are
  minutes in every unit setting, and their messages use the units shown in the form (`24 h`,
  `180 min`).
- With a mass unit the conversion to litres depends on the fuel type, so the fuel maxima can't use
  `unitNumberFieldSchema`; `superRefine` checks them with `createUnitLimits('fuel', units.fuel,
{ context: { fuelDensityKgPerL: density }, symbolSuffix })` for `fuelBurnRate` (suffix `/h`),
  `taxiFuel` and `extraFuel` (`fuelMaxFields`), so the check is in base units (same tolerance as 01) and the message shows the limit in the user's unit, rounded inwards: `"Fuel burn rate cannot
be greater than 2,641.72 US gal/h"`, `"Taxi fuel cannot be greater than 2,641.72 US gal"`, `"Fuel
burn rate cannot be greater than 7,189.58 kg/h"` (AVGAS) or `8,004.40 kg/h` (Jet A), `"Extra fuel
cannot be greater than 15,850.32 lb"` (AVGAS). The whole check is skipped when the fuel type is
  invalid (its own issue is reported), and a field is skipped when it is empty or not a finite
  number (zod runs `superRefine` even after a field failed its own checks; this avoids duplicate
  issues).
- Taxi and extra fuel: optional (empty = none), not negative, at most 10,000 L. `.nullish()` like
  the gust speed in 02: Prisma types optional composite fields as `number | null`.
- `fuelType` enum values come from `fuelTypes`.
- Known zod 3.22 quirk: `z.preprocess` skips its inner schema once any earlier field has an issue,
  so an invalid taxi fuel isn't reported together with an invalid burn rate. It is documented as
  `it.fails('BUG: reports an invalid taxi fuel together with an invalid burn rate')`; the value is
  still checked once the burn rate is fixed.

## UI

- `Calculator.tsx`: mirror the crosswind calculator. Module-level `fuelPlanningUnitFields` and
  `defaultValues` (base units): `{ fuelBurnRate: 30, flightTime: 60, reserveTime: 30, taxiFuel:
null, extraFuel: null, fuelType: 'avgas' }`. Pass `unitFields: fuelPlanningUnitFields` and
  `getUnitContext: getFuelUnitContext` to `useCalculator`. Inputs:
    - "Fuel Type" (Select from `fuelTypes`, like "Distribution Frequency").
    - "Fuel Burn Rate" (`DynamicFormLabel`, short label "Burn Rate"; `unitSymbol` =
      `` `${getUnitSymbol('fuel', units.fuel)}/h` ``; an empty field is set to 0 on blur).
    - "Flight Time": new `components/Form/HoursMinutesInput.tsx`, a controlled input bound to the
      single `flightTime` field (minutes). It renders two `NumberInputWithIcon iconType="unit"`
      boxes (no new input styling or dependency), hours (`h`) and minutes (`min`, `aria-label`
      "Minutes"), kept as strings in local state so typing isn't interrupted. They are derived
      from the value (`h = Math.floor(v / 60)`, `min = v − h × 60` rounded to 2 decimals) and
      follow outside changes (reset, import, units change) unless the value already matches what
      was typed. Typing calls `onChange(hours × 60 + minutes)` (an empty box counts as 0); on blur
      a valid total is split again, so 0 h 90 min becomes 1 h 30 min. Validation errors come from
      the schema on the `flightTime` field.
    - "Reserve Time" (`unitSymbol="min"`; an empty field is set to 0 on blur).
    - "Taxi Fuel (optional)" and "Extra Fuel (optional)" (fuel symbol; `value={field.value ?? ''}`,
      `placeholder=""`; no `ifFieldIsEmpty` reset to 0).
- `Report.tsx`: inputs (fuel type with its density, e.g. `"AVGAS (0.719 kg/L)"`, burn rate as
  `` `${formatBaseValue(...)}/h` ``, flight time with `formatHoursMinutes` (`"1 h 30 min"`),
  reserve time with `formatMinutes` (`"45 min"`)), `ReportDivider`, Trip Fuel, Reserve Fuel, Taxi
  Fuel and Extra Fuel (only when not `null`/`undefined`), Total Fuel in the user's fuel unit, then
  the total in the paired unit of the other kind (`getPairedFuelUnit`), labelled "Total Fuel
  (mass)" or "Total Fuel (volume)" from the paired option's `kind` (e.g. `90.00 L` and
  `64.71 kg`; `25.00 US gal` and `150.00 lb`), then `<CalculatorDisclaimer category="aviation" />`.
  Every fuel value uses `formatBaseValue(value, 'fuel', unit, { fuelDensityKgPerL: fuelDensity })`
  with the report's own density, so the paired total is converted from `totalFuel` (the same
  physical amount as `totalFuelMass`).
- `Info.tsx`: trip, reserve, taxi and extra fuel; typical reserve values (e.g. 30 min for VFR by
  day, 45 min at night or under IFR) and that pilots must check the rules that apply to them
  (country, type of operation, aircraft); why density matters (fuel is loaded by volume, weight
  and balance uses mass); that density varies with temperature and the calculator uses fixed FAA
  weights (AVGAS 6.0 lb/US gal from the PHAK and FAA-H-8083-1B; Jet A 6.68 lb/US gal from
  FAA-H-8083-1B Figure 3-4 at 59 °F / 15 °C, often rounded to 6.7);
  `<p>{calculatorDisclaimers.aviation}</p>`; `ReportSource` to the FAA aviation handbooks index
  page (`https://www.faa.gov/regulations_policies/handbooks_manuals/aviation`, text
  `"FAA Aviation Handbooks & Manuals"`), which lists both the PHAK and the Weight and Balance
  Handbook (FAA-H-8083-1B, named in the Info text).

## Files to create or change

Follow "Adding a calculator" and "Adding an aviation calculator" in AGENTS.md:

1. `prisma/schema.prisma`: `fuel String?` on `unitPreferences`;
   `type FuelPlanningCalculationFormData { fuelBurnRate Float flightTime Float reserveTime Float
taxiFuel Float? extraFuel Float? fuelType FuelType }` (Prisma `enum FuelType { avgas jetA }`, so
   the generated type matches the zod enum), `model FuelPlanningCalculation`,
   `FuelPlanningCalculations FuelPlanningCalculation[]` on `User`. Run `npx prisma generate`.
2. `lib/units.ts` + `lib/units.test.ts`: fuel unit, `UnitContext`/`GetUnitContext` threaded
   through all conversion helpers, `getPairedFuelUnit`. `hooks/useCalculator.ts`: optional
   `getUnitContext`.
3. `constants/data.ts`: `fuelTypes`.
4. `schemas/index.ts` + `schemas/index.test.ts`: schemas above; `fuel` in `unitPreferencesSchema`
   and its tests. `lib/queryFns/auth.test.ts`: units include `fuel`.
5. `types/calculations.ts`: `IFuelPlanningFormData`, `FuelPlanningReportProps extends
IFuelPlanningFormData { fuelDensity; tripFuel; reserveFuel; totalFuel; totalFuelMass }`, add to
   `CalculationType`.
6. `lib/calculatorFns.ts` + test: `calculateFuelPlanning`.
7. `lib/utils.ts`: `FuelType`, `getFuelDensity`, `getFuelUnitContext`, `getFuelTypeLabel(value)`
   like `getContributionFrequencyLabel`, `formatHoursMinutes(minutes)` (rounded to whole minutes
   first: `90` → `"1 h 30 min"`, `45` → `"0 h 45 min"`, `1440` → `"24 h 0 min"`, `59.6` →
   `"1 h 0 min"`) and `formatMinutes(minutes)` (up to 2 decimals, `en-US`: `45` → `"45 min"`,
   `30.5` → `"30.5 min"`), with tests in `lib/utils.test.ts`.
8. `components/Form/HoursMinutesInput.tsx`. `components/Nav/UnitPreferencesModal.tsx`:
   `DialogContent` gets `max-h-[90vh] overflow-y-auto`, as five selects no longer fit on short
   screens.
9. `constants/api.ts`: `FUEL_PLANNING_CALCULATIONS_API_URL = '/api/fuel-planning-calculations'`,
   `FUEL_PLANNING_CALCULATIONS_QUERY_KEY = 'fuel-planning-calculations'`.
10. `constants/calculators.ts`:
    `{ name: 'Fuel Planning Calculator', url: 'fuel-planning-calculator', category: 'aviation', description: 'Calculate the trip fuel, reserve fuel and total fuel by volume or mass, given the fuel burn rate, flight time, reserve time, optional taxi and extra fuel, and fuel type. Additionally, logged in users can save their calculations.' }`.
11. `app/api/fuel-planning-calculations/route.ts` and `[id]/route.ts` (the `POST` saves `taxiFuel`
    and `extraFuel` as `?? undefined`, so they are omitted when empty; the `PUT` replaces the whole
    `formData`, so removed taxi or extra fuel is removed from the document).
12. `app/(calculators)/fuel-planning-calculator/`: `page.tsx`, `Calculator.tsx`, `Report.tsx`,
    `Info.tsx`.
13. `README.md` aviation entry and units sentence (fuel), check off 05 in `00-epic.md` (the
    calculator is not listed in `AGENTS.md`).

## Test cases

Units (`lib/units.test.ts`), exact definitions (`d_avgas`, `d_jetA` = the `fuelTypes` densities):

- `fromBaseUnit(3.785411784, 'fuel', 'usgal')` → `1`; `toBaseUnit(1, 'fuel', 'usgal')` →
  `3.785411784`.
- `toBaseUnit(6, 'fuel', 'lb', { fuelDensityKgPerL: d_avgas })` → `3.785411784` (6 lb of AVGAS is
  1 US gal by definition); `toBaseUnit(6.68, 'fuel', 'lb', { fuelDensityKgPerL: d_jetA })` →
  `3.785411784`.
- `toBaseUnit(d_avgas, 'fuel', 'kg', { fuelDensityKgPerL: d_avgas })` → `1`.
- Mass unit without a density throws; volume units ignore the context.
- `getPairedFuelUnit`: `l` ↔ `kg`, `usgal` ↔ `lb`.
- Formatting: `formatUnitValue(2641.72, 'fuel', 'usgal')` → `2,641.72 US gal`; 90 L → `90.00 L` and
  `64.71 kg` of AVGAS; 25 US gal → `150.00 lb` of AVGAS and `167.00 lb` of Jet A.
- `withDefaultUnitPreferences({})` includes `fuel: 'l'`; preferences saved before fuel existed keep
  their other choices.
- `formDataToBaseUnits` with `getContext` converts mass fields with the density of the record's
  own `fuelType`; unit changes and `formDataToExactBaseUnits` keep exact values for untouched
  fields, and a fuel type change in kg/lb converts the typed numbers with the new density.
- `lib/utils.test.ts`: `getFuelDensity` gives 0.71896 and 0.80044 kg/L and exactly 6 and 6.68
  lb/US gal back.

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
  (25 × 6.0). Jet A → 25 US gal and 167 lb (25 × 6.68).
- lb: burn 60 lb/h AVGAS (= 10 US gal/h), 2 h, reserve 30 min → trip 120 lb, reserve 30 lb,
  total 150 lb; other kind 25 US gal. Burn 66.8 lb/h Jet A → total 167 lb, 25 US gal.
- Fuel type change: the same 150 lb total is 25 US gal of AVGAS but `150 / 6.68` US gal of Jet A.
- Taxi and extra fuel entered in kg convert with the density.
- Inputs are returned unchanged in the report; missing or `null` taxi/extra fuel count as 0.

Schema: valid input passes; missing required fields; taxi/extra missing, `''` or `null` pass,
negative rejected (`"Taxi fuel cannot be negative"`), 10,000 L accepted, 10,001 L rejected; burn
rate 0 rejected (`"Fuel burn rate must be greater than 0"`); flight time 1,440 accepted, 1,441
rejected; reserve 180 accepted, 181 rejected; burn rate 10,000 L/h accepted, 10,001 rejected
(`"... 10,000.00 L/h"`); with `fuel: 'usgal'` the messages show `2,641.72 US gal/h` and
`2,641.72 US gal` (the shown limits accepted, one step more rejected); with `fuel: 'kg'` the limit
depends on the fuel type (`7,189.58 kg/h` AVGAS, `8,004.40 kg/h` Jet A); with `fuel: 'lb'`
`15,850.32 lb`; values imported at the limit pass in every fuel unit and type; unknown fuel type
rejected with the message; numeric strings coerced (`''` taxi/extra → `undefined`); the zod
`preprocess` quirk is the `BUG:` test above.

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

None at the moment.
