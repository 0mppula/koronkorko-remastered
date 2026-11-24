# 13 Weight and Balance Calculator

Branch: `feature/weight-and-balance-calculator` (from an up-to-date `master`). The plan and both
parts are on this one branch.

Follow "Adding a calculator" and "Adding an aviation calculator" in `AGENTS.md`. This plan only
lists what is specific to this calculator. Hidden fields work like
`07-time-speed-distance-calculator.md`; the fuel type and fuel density context work like
`05-fuel-planning-calculator.md`; adding unit preferences works like the vertical speed unit in
`12-descent-planning-calculator.md`.

**Two parts, each implemented in its own chat and commit on this branch, in order:**

- **Part A – Foundation** (commit "Add weight and arm units and per-row unit fields"): weight
  and arm unit preferences, per-row array unit support with stable row ids in `lib/units.ts` and
  `useCalculator`, `formatMoment`, tests. No calculator; existing calculators behave as before.
- **Part B – Calculator** (commit "Add weight and balance calculator"): Prisma model, schema,
  calculation, API, UI, docs. Builds only on what Part A provides.

## Goal

The user enters a list of stations (e.g. empty aircraft, pilot, passengers, baggage, fuel), each
with a weight (or, for fuel, a quantity) and an arm, and gets each station's moment, the total
weight, the total moment (also as moment/1000) and the center of gravity. An optional maximum
takeoff weight is checked. Adds the **weight** (kg, lb; base kg) and **arm** (mm, cm, m, in; base
mm) unit preferences and two new patterns: a variable number of form rows (`useFieldArray`) with
per-row unit conversion tracked by stable row ids, and a list of composite types in Prisma.

## Decisions

- **Stations:** the form starts with six rows: Empty aircraft, Pilot, Front passenger, Rear
  passengers, Baggage, Fuel. The user can add, remove and rename rows. At least 1 and at most 20
  rows ("Add station" disabled at 20, remove disabled at 1).
- **Station name:** required text, trimmed, at most 30 characters, stored.
- **No special empty weight row:** the first default row is named "Empty aircraft", but all rows
  are equal (removable, renamable, same fields).
- **Station type:** each row has a type, Weight or Fuel (Prisma enum `WeightAndBalanceStationType`
  `weight`, `fuel`). Weight rows take a weight (weight unit). Fuel rows take a fuel quantity in the
  fuel unit preference (L, US gal, kg, lb), converted to weight with one calculation-wide fuel type
  (AVGAS default, Jet A), using the existing `fuelTypes` densities and `getFuelUnitContext` (05).
- **Row data model:** `{ rowId, name, type, weight, fuel, arm }`: `weight` (kg) is `null` for fuel
  rows, `fuel` (L) is `null` for weight rows (hidden fields as in 07). `rowId` is client-only
  (never stored). `fuelType` is stored at the calculation level, always (default `avgas`); its
  select is shown only when at least one row is a fuel row.
- **Stable row ids:** exact base values and conversions of station rows are matched by a stable
  row id, never by array index, so removing, adding, reordering or retyping rows never mixes up
  values between rows. react-hook-form's `useFieldArray` `field.id` can't be used for this: it
  lives only in `fields` (not in the form values that `useCalculator` reads with `getValues()` and
  receives on submit) and is regenerated on every `form.reset`. Instead each row value carries its
  own `rowId` (string, `crypto.randomUUID()`), assigned when rows are loaded from base units
  (defaults, import, clear) or appended, and kept through unit changes and resets. `field.id`
  stays the React key.
- **Weight unit:** new quantity `weight`: kg (base, default), lb. 2 decimals.
- **Arm unit:** new quantity `arm`: mm (base, default), cm, m, in. Digits: mm 0, cm 1, m 3, in 2
  (per-unit `fractionDigits`, as in 12). The CG uses the arm unit and its digits.
- **Negative arms** are allowed (stations forward of the datum, PHAK p. 10-6): `min0={false}`.
- **Moment display:** station and total moments in the user's weight unit × arm unit (`kg-mm`,
  `lb-in`, ...), whole numbers; also the total moment/1000 (moment index, PHAK p. 10-5; PHAK
  Fig. 10-6 p. 10-7 "in-lb/1,000", Fig. 10-7 p. 10-8 "kilogram-millimeters") with 2 decimals. The
  moment is not a unit preference; it is derived from the weight and arm units.
- **Limit check:** only an optional maximum takeoff weight. The report shows "Within the maximum
  takeoff weight (X remaining)" or "Exceeds the maximum takeoff weight by X"; it is not a schema
  error. The comparison uses the same relative tolerance as the unit limits, so a total equal to
  the maximum (after unit conversion) is within.
- **No CG limit check:** real CG envelopes are often not rectangular (the forward limit moves aft
  at higher weights), so a single forward/aft pair could show "within limits" for a loading outside
  the envelope. The report shows the total weight, CG and moment/1000 so users can check them
  against their POH envelope chart; `Info.tsx` explains this. A full CG envelope polygon check is a
  possible future addition.
- **Limits (base units):** station weight 0 to 10,000 kg (0 allowed for empty seats); fuel ≥ 0 and
  its computed fuel weight ≤ 10,000 kg (message in the user's weight unit); arm −20,000 to
  20,000 mm; maximum takeoff weight > 0 and ≤ 10,000 kg (rejects typos like an extra zero);
  1 to 20 stations. **Computed results:** total weight must be > 0 (path `stations`). No other
  computed limit is needed: the CG is a weighted average of arms (weights ≥ 0), so it stays within
  ±20,000 mm, and the total weight is at most 20 × 10,000 kg.
- **Fuel densities:** reuse `fuelTypes` (AVGAS 6.0 lb/US gal, Jet A 6.68 lb/US gal,
  FAA-H-8083-1B Fig. 3-4, see 05). PHAK p. 10-5 lists Jet A at 6.8 lb/US gal as a standard weight;
  the calculator keeps 6.68 for consistency with fuel planning; `Info.tsx` says actual weights and
  POH values take precedence.

## Out of scope

- CG envelope polygon or forward/aft limit checks (possible future addition), CG in % MAC.
- Landing weight/CG after fuel burn, zero fuel and ramp weight checks, weight shift, addition and
  removal problems (PHAK p. 10-11), lateral CG, helicopters.
- Negative station weights (removed items), a fuel type per fuel row, oil in quarts.
- Saved aircraft profiles (reusing an empty weight and arms across calculations).
- Reordering rows in the UI (the id-based matching supports it, but no drag handle is added).

---

## Part A – Foundation

Implement in its own chat. Commit "Add weight and arm units and per-row unit fields". Depends on
nothing in Part B; after Part A, lint, typecheck, format check and tests pass and every existing
calculator behaves as before. The units modal shows Weight and Arm from Part A on (automatic).

### A1. Weight and arm units (`lib/units.ts`)

- `unitQuantities`: `{ value: 'weight', label: 'Weight' }`, `{ value: 'arm', label: 'Arm' }`.
- `unitOptions.weight`: `kg` (identity, "Kilograms (kg)", symbol `kg`), `lb` ("Pounds (lb)",
  symbol `lb`, reuse `POUND_IN_KILOGRAMS` = 0.45359237). `unitFractionDigits.weight = 2`.
- `unitOptions.arm`: `mm` (identity, "Millimetres (mm)"), `cm` ("Centimetres (cm)", × 10,
  `fractionDigits: 1`), `m` ("Metres (m)", × 1,000, `fractionDigits: 3`), `in` ("Inches (in)",
  × 25.4, `fractionDigits: 2`; export `INCH_IN_MILLIMETRES = 25.4`). `unitFractionDigits.arm = 0`.
  Source (comment): NIST SP 811, Appendix B.9 (inch = 2.54 cm exact; avoirdupois pound =
  0.45359237 kg exact). Open SP 811 and check both values before citing; if not opened, say so.
- `BASE_UNITS.weight = 'kg'`, `BASE_UNITS.arm = 'mm'` (defaults equal).
- `formatMoment(momentKgMm, units, { index }?)` (fixed `en-US`): converts with
  `fromBaseUnit(fromBaseUnit(m, 'weight', units.weight), 'arm', units.arm)` (both linear, no
  offset), symbol `${weightSymbol}-${armSymbol}` (`lb-in`, `kg-mm`), whole numbers; `index: true`
  divides by 1,000, 2 decimals, symbol `lb-in/1000`.
- `schemas/index.ts` `unitPreferencesSchema`: `weight: unitValueSchema('weight')`,
  `arm: unitValueSchema('arm')`. `prisma/schema.prisma` `type unitPreferences`: `weight String?`,
  `arm String?`; run `npx prisma generate`. Every test fixture listing all units
  (`lib/queryFns/auth.test.ts`, units and schema tests) includes them.

### A2. Per-row array unit fields with stable row ids (`lib/units.ts`)

- `ROW_ID_FIELD = 'rowId'`; rows of an array unit field are objects with an optional
  `rowId?: string`.
- `UnitFields<T>`: for a key whose value is an array of row objects, the entry is a nested
  `UnitFields<Row>` (only `UnitQuantity` entries, no nested arrays); otherwise a `UnitQuantity`
  (as now). Existing flat maps keep type-checking unchanged.
- `createRowId()` (`crypto.randomUUID()`, available in browsers and Node ≥ 19 / Vitest).
- `withRowIds(formData, unitFields)`: returns a copy where every row of every array unit field
  without a `rowId` gets a new one; rows with an id keep it. No-op for flat maps.
- `withoutRowIds(formData, unitFields)`: returns a copy without `rowId` on those rows (for
  payloads and comparisons).
- `convertFormData`: for an array entry, maps each row through the scalar conversion with the
  nested map (rows keep their `rowId` and non-unit fields); non-array values are left as they are.
- `formDataToExactBaseUnits`: for each array entry, each current row is matched to the previous
  row with the **same `rowId`** in `values.formData` (and its exact base in `values.baseFormData`,
  same id); per unit field, the exact base value is kept only if the form value is unchanged and
  the converted base value is the same (as for scalars, so a changed context, e.g. fuel type,
  counts as an edit). Rows without an id or without a match are converted from their input. Never
  index-based.
- `unitFormValuesFromBase` and `changeFormDataUnits` call `withRowIds` first, so `formData` and
  `baseFormData` share the same ids.

### A3. `useCalculator` changes (`hooks/useCalculator.ts`)

Required because the ids live in the form values and must never reach the API or break the
"unchanged" check:

- `formDefaultValues`: `withRowIds(fromBaseUnits(defaultValues), unitFields)` (when
  `unitFields` is set).
- `resetFormFromBase` (import, clear, close) already goes through `unitFormValuesFromBase`, which
  now assigns ids; no other change.
- `handleSave` and the update in `handleSaveUpdateStart`: send
  `withoutRowIds(toBaseUnits(form.getValues()), unitFields)`.
- The "only update if the form data has changed" check compares
  `withoutRowIds(fromBaseUnits(activeCalculation.formData))` with
  `withoutRowIds(form.getValues())` (stored data has no ids, so without this every update would
  look changed).
- `onCalculate` keeps passing `toBaseUnits(formData)` (ids included; `calcFn` ignores them). The
  form schema must keep `rowId` (zod strips unknown keys, and `onCalculate` receives the parsed
  data); this is Part B's row schema.
- Calculators without array unit fields are unaffected (all helpers are no-ops for flat maps).
- `useCalculationMutations` gets `formDefaultValues` (with ids) as before; rows reset there get
  ids that don't match `unitFormValuesRef`, so they are converted from their input (safe).

### A4. Part A tests

`lib/units.test.ts` (with a test-only form data type `{ rows: { rowId?, a, b, label }[], c }` and
unit map `{ rows: { a: 'weight', b: 'arm' }, c: 'weight' }`):

- Weight and arm: `toBaseUnit(1, 'weight', 'lb')` → `0.45359237`; `toBaseUnit(1, 'arm', 'in')` →
  `25.4`, `cm` → `10`, `m` → `1000`; `formatBaseValue(25.4, 'arm', 'in')` → `1.00 in`;
  `formatBaseValue(1000, 'arm', 'm')` → `1.000 m`; `formatMoment` for 450 lb at 75 in (base
  `450 × 0.45359237 × 75 × 25.4` kg·mm) → `33,750 lb-in`, index `33.75 lb-in/1000`;
  `getUnitFractionDigits` for each arm unit; `withDefaultUnitPreferences({})` includes
  `weight: 'kg'`, `arm: 'mm'`, and older preferences keep their other choices.
- Array conversion: rows convert per field; `null`/`''` fields are skipped; non-unit fields and
  `rowId` are kept; scalar fields still convert.
- Ids: `withRowIds` adds ids only where missing, all distinct; `withoutRowIds` removes them;
  `unitFormValuesFromBase` gives `formData` and `baseFormData` the same ids.
- Exact values by id (values chosen to drift through lb, e.g. 0.1 kg and 1 mm in in):
    - **Delete a middle row:** three rows, convert to lb/in, remove the middle row, convert back:
      the remaining two rows have exactly their original base values (`toBe`, not
      `toBeCloseTo`).
    - **Add a row:** append a row with a new id: existing rows keep their exact base values; the
      new row converts from its input.
    - **Change a row's type / edit a field:** change one field of one row: that field converts
      from the input, the row's other fields and all other rows keep exact base values.
    - **Reorder:** swap two rows: each keeps its own exact base values.
    - **Index trap:** after deleting the first row, row 2 (now at index 0) must not receive row
      1's exact values (fails with index matching).
    - A row without an id is converted from its input.
- Repeated unit round trips (kg → lb → kg, mm → in → mm) leave unchanged rows exact.
- `schemas/index.test.ts`: `unitPreferencesSchema` accepts the new units and rejects unknown
  ones (`"Invalid weight unit"`, `"Invalid arm unit"`).

`useCalculator` has no tests (no React tests in this repo); its changes are thin calls into the
tested `lib/units` helpers.

### A5. Part A docs

- `AGENTS.md`: weight and arm in the units list; in "Adding an aviation calculator", array unit
  fields (nested `UnitFields`, `rowId` in each row, `withRowIds`/`withoutRowIds`, React key
  `field.id`); pitfall "match rows by `rowId`, never by index".
- This plan: mark Part A done, note any difference from the code.

---

## Part B – Calculator

Implement in its own chat after Part A is committed. Commit "Add weight and balance calculator".
Uses only Part A's units, `formatMoment`, array `UnitFields`, `createRowId` and the
`useCalculator` changes.

### Inputs and outputs (base units)

| Field                                | Base unit | Preference   | Notes                                               |
| ------------------------------------ | --------- | ------------ | --------------------------------------------------- |
| `stations` (input)                   | —         | —            | array, 1–20 rows                                    |
| `stations[i].rowId` (input)          | —         | none         | client-only, optional string, never stored          |
| `stations[i].name` (input)           | —         | none         | trimmed, 1–30 characters                            |
| `stations[i].type` (input)           | —         | none         | `'weight' \| 'fuel'`                                |
| `stations[i].weight` (input)         | kg        | weight       | weight rows: 0–10,000; fuel rows: `null`            |
| `stations[i].fuel` (input)           | L         | fuel         | fuel rows: ≥ 0, weight ≤ 10,000 kg; else `null`     |
| `stations[i].arm` (input)            | mm        | arm          | −20,000 to 20,000                                   |
| `fuelType` (input)                   | —         | none         | `'avgas' \| 'jetA'`, always stored                  |
| `maxTakeoffWeight` (input, optional) | kg        | weight       | > 0 and ≤ 10,000                                    |
| report `stationResults[i].weight`    | kg        | weight       | fuel rows: fuel × density                           |
| report `stationResults[i].moment`    | kg·mm     | weight × arm | whole numbers                                       |
| report `fuelDensity`                 | kg/L      | none         | from `fuelType`                                     |
| report `totalWeight`                 | kg        | weight       | 2 decimals                                          |
| report `totalMoment`                 | kg·mm     | weight × arm | whole numbers, and /1000 with 2 decimals            |
| report `centerOfGravity`             | mm        | arm          | `null` if the total weight is 0 (schema rejects)    |
| report `maxTakeoffWeightMargin`      | kg        | weight       | `maxTakeoffWeight − totalWeight`; `null` if no MTOW |

`weightAndBalanceUnitFields`: `{ stations: { weight: 'weight', fuel: 'fuel', arm: 'arm' },
maxTakeoffWeight: 'weight' }`; `getUnitContext`: `getFuelUnitContext` (reads `fuelType`).

### Formulas

Source: FAA Pilot's Handbook of Aeronautical Knowledge (FAA-H-8083-25C), chapter 10, opened
(text extract; pages are the printed footers):

- p. 10-5: "Moment—the product of the weight of an item multiplied by its arm."; "Moment index (or
  index)—a moment divided by a constant such as 100, 1,000, or 10,000."; standard weights
  "Gasoline 6 lb/US gal, Jet A, Jet A-1 6.8 lb/US gal".
- p. 10-6: arms aft of the datum are positive, "if located forward of the datum, it is measured as
  negative inches".
- p. 10-7, Computational Method: "3. Find the total weight and total moment. 4. To determine the
  CG, divide the total moment by the total weight." Figure 10-5 (see test cases), AVGAS "weighs 6
  pounds per gallon".
- p. 10-10, Figure 10-10 (negative arm); p. 10-11, Figure 10-11 (published zero fuel weight) and
  the weight addition example.

In base units (kg, mm, L):

- Weight row: `w_i = weight_i`. Fuel row: `w_i = fuel_i × fuelDensity(fuelType)` (kg/L, from
  `fuelTypes`).
- `moment_i = w_i × arm_i`, `totalWeight = Σ w_i`, `totalMoment = Σ moment_i`,
  `centerOfGravity = totalMoment / totalWeight` (`null` if `totalWeight` is 0).
- `maxTakeoffWeightMargin = maxTakeoffWeight − totalWeight` (`null` without a maximum).

`calculateWeightAndBalance` ignores hidden fields (`fuel` on weight rows, `weight` on fuel rows)
and `rowId`.

### Zod schema rules (`schemas/index.ts`)

- `createWeightAndBalanceFormDataSchema(units)`:
    - `stations`: `z.array(row).min(1, "Add at least one station").max(20, "You can add at most 20
stations")`.
    - row: `rowId` (`z.string().optional()`, kept so `onCalculate` receives it), `name`
      (`z.string().trim().min(1, "Station name is required").max(30, "Station name cannot be
longer than 30 characters")`), `type` (`z.enum` from `stationTypes` in `constants/data.ts`,
      labels "Weight", "Fuel", message `"Station type must be weight or fuel"`), `arm`
      (`unitNumberFieldSchema('Arm', 'arm', units.arm, { min: -20000, max: 20000 })`), `weight`
      and `fuel` as `z.unknown()`, checked in the row's `superRefine` only for the shown one (07
      pattern): `unitNumberFieldSchema('Weight', 'weight', ..., { min: 0, max: 10000 })`, fuel
      `unitNumberFieldSchema('Fuel', 'fuel', ..., { min: 0 })` with the 05 context.
    - `fuelType`: `z.enum` from `fuelTypes` (05 message).
    - `maxTakeoffWeight`: `z.preprocess(emptyToUndefined, unitNumberFieldSchema('Maximum takeoff
weight', 'weight', units.weight, { min: 0, minExclusive: true, max: 10000 }).nullish())`.
- Cross-field (`superRefine` on the object), each only when the involved fields passed their own
  checks:
    - fuel row weight (`fuel × density`, density from a valid `fuelType`) > 10,000 kg (same
      tolerance) → path `stations.<i>.fuel`, `"Fuel weight cannot be greater than 10,000.00 kg"`
      (lb: `22,046.22 lb`, rounded inwards via `createUnitLimits('weight', units.weight)`).
    - total weight (run `calculateWeightAndBalance` on the base values) not > 0 → path
      `stations`, `"Total weight must be greater than 0"`; only when every row passed.
- `.transform`: hidden fields `null` (`fuel` on weight rows, `weight` on fuel rows).
- `weightAndBalanceFormDataSchema = createWeightAndBalanceFormDataSchema(BASE_UNITS)`.

### UI

- `Calculator.tsx`: `useFieldArray({ control: form.control, name: 'stations' })`, `field.id` as
  the React key. Defaults (base units, no `rowId`; `useCalculator` adds ids; PHAK Fig. 10-5
  p. 10-7, front seat occupants 340 lb split into pilot and front passenger at the same arm),
  written as exact expressions with `POUND_IN_KILOGRAMS`, `INCH_IN_MILLIMETRES`,
  `US_GALLON_IN_LITRES`: Empty aircraft 2,100 lb at 78.3 in; Pilot 170 lb at 85.0 in; Front
  passenger 170 lb at 85.0 in; Rear passengers 350 lb at 121.0 in; Baggage 80 lb at 150.0 in; Fuel
  (fuel row) 75 US gal at 75.0 in; `fuelType: 'avgas'`; `maxTakeoffWeight` 3,400 lb. Each row:
  name `Input`, type `Select`, Weight or Fuel (`NumberInputWithIcon iconType="unit"`, weight or
  fuel symbol), Arm (arm symbol, `min0={false}`), a remove `ButtonWithIcon` (lucide `Trash2`,
  `aria-label="Remove station"`). Below: "Add station" (`Plus`) appends `{ rowId: createRowId(),
name: 'Station <n>', type: 'weight', weight: 0, fuel: null, arm: 0 }`; Fuel Type select only
  when a fuel row exists; Maximum Takeoff Weight (optional, placeholder "Optional"). Changing a
  row type clears the form errors. Rows stack on mobile (320 px) and use a grid from `sm:`; don't
  combine `xs:` and `sm:` on one property.
- `Report.tsx`: one `ReportGroup` per station (`name`: weight (fuel rows: `75.00 US gal (450.00
lb)`), arm, moment), `ReportDivider`, Total Weight, Total Moment (`281,430 lb-in`), Moment/1000
  (`281.43 lb-in/1000`), Center of Gravity (arm unit, signed, `84.77 in`), the maximum takeoff
  weight line if given, `<CalculatorDisclaimer category="aviation" />`. Values via
  `formatBaseValue` and `formatMoment`.
- `Info.tsx`: weight × arm = moment, CG = total moment / total weight (PHAK p. 10-7, Figure 10-5
  example), datum and negative arms (p. 10-6), moment index (p. 10-5), fuel density and standard
  weights (p. 10-5; use actual weights and POH values), why the calculator doesn't check the CG
  envelope (compare total weight and CG or moment/1000 with the POH envelope chart; envelopes are
  often not rectangular), `<p>{calculatorDisclaimers.aviation}</p>`, `ReportSource` to
  `https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak` ("FAA Pilot's Handbook
  of Aeronautical Knowledge").

### Part B files

1. `prisma/schema.prisma`: `enum WeightAndBalanceStationType { weight fuel }`; `type
WeightAndBalanceStation { name String type WeightAndBalanceStationType weight Float? fuel Float?
arm Float }` (no `rowId`); `type WeightAndBalanceCalculationFormData { stations
WeightAndBalanceStation[] fuelType FuelType maxTakeoffWeight Float? }`; `model
WeightAndBalanceCalculation`; `WeightAndBalanceCalculations WeightAndBalanceCalculation[]` on
   `User`. Run `npx prisma generate`.
2. `constants/data.ts`: `stationTypes`.
3. `schemas/index.ts` + test.
4. `types/calculations.ts`: `IWeightAndBalanceFormData`, `WeightAndBalanceReportProps`, add to
   `CalculationType`.
5. `lib/calculatorFns.ts` + test: `calculateWeightAndBalance`.
6. `constants/api.ts`: `WEIGHT_AND_BALANCE_CALCULATIONS_API_URL =
'/api/weight-and-balance-calculations'`, `WEIGHT_AND_BALANCE_CALCULATIONS_QUERY_KEY =
'weight-and-balance-calculations'`.
7. `constants/calculators.ts`: `{ name: 'Weight and Balance Calculator', url:
'weight-and-balance-calculator', category: 'aviation', description: 'Calculate the total weight,
moment and center of gravity of an aircraft from its stations, with fuel by volume or weight.
Additionally, logged in users can save their calculations.' }`.
8. `app/api/weight-and-balance-calculations/route.ts` and `[id]/route.ts`: both `POST` and `PUT`
   map rows explicitly to `{ name, type, weight: weight ?? undefined, fuel: fuel ?? undefined, arm
}` (drops any `rowId`) and `maxTakeoffWeight ?? undefined`; `PUT` replaces the whole `formData`.
9. `app/(calculators)/weight-and-balance-calculator/`: `page.tsx`, `Calculator.tsx`, `Report.tsx`,
   `Info.tsx`.
10. `README.md` aviation entry and units sentence (weight, arm); `00-epic.md` follow-up (13 done);
    this plan (mark Part B done, note differences from the code).

### Part B tests

`calculateWeightAndBalance` (inputs converted from lb/in/US gal to base units with the exact
constants; weights `toBeCloseTo(x, 6)` in kg, CG `toBeCloseTo(x, 6)` in mm, moments compared in
lb-in after dividing by `POUND_IN_KILOGRAMS × 25.4`):

| Case                 | Stations (lb at in)                                                                | Total (lb) | Moment (lb-in) | CG (in)              | Source               |
| -------------------- | ---------------------------------------------------------------------------------- | ---------- | -------------- | -------------------- | -------------------- |
| Computational method | 2,100 @ 78.3; 340 @ 85.0; 350 @ 121.0; fuel 75 US gal AVGAS @ 75.0; 80 @ 150.0     | 3,320      | 281,430        | 281,430 / 3,320      | PHAK Fig. 10-5, 10-7 |
| Negative arm         | 1,011.9 @ 68.6; 11.0 @ −31.0; 108.0 @ 84.0 (×2); 170.0 @ 81.0 (×2); 70.0 @ 105.0   | 1,648.9    | 122,109.34     | 122,109.34 / 1,648.9 | PHAK Fig. 10-10      |
| Zero fuel            | 3,230 @ 90.5; 335 @ 89.0; 350 @ 126.0; 200 @ 157.0; 100 @ 10.0; 25 @ 183.0         | 4,240      | 403,205        | 403,205 / 4,240      | PHAK Fig. 10-11      |
| Ramp                 | zero fuel + 822 @ 113.0; MTOW 5,224 → margin 162 lb; MTOW 5,000 → exceeds by 62 lb | 5,062      | 496,091        | 496,091 / 5,062      | PHAK Fig. 10-11      |
| Weight added         | 6,860 @ 80.0; 140 @ 150.0                                                          | 7,000      | 569,800        | 81.4                 | PHAK p. 10-11        |
| Balance board        | 100 @ 25; 50 @ 50                                                                  | 150        | 5,000          | 5,000 / 150          | PHAK Fig. 10-4, 10-7 |

- Fig. 10-5: the source rounds the CG to 84.8; assert the exact value and that it is within
  0.05 in of 84.8. The fuel row (75 US gal × 6 lb/US gal = 450 lb exactly) tests the fuel
  conversion.
- Fig. 10-10: the source's empty weight moment 69,393.0 isn't 1,011.9 × 68.6 = 69,416.34 (its
  total 122,086.0 and CG 74.0 follow from it). The calculator multiplies weight × arm, so assert
  the exact 122,109.34 and its CG, with a comment why they differ from the figure; the oil row
  (−341.0) checks the negative arm.
- Fig. 10-11: the source rounds the CGs to 95.1 and 98.0; assert exact values within 0.05 in.
  The margin cases check the maximum takeoff weight (5,224 is the figure's ramp weight maximum,
  used only as a value).
- Expected values from a standalone Python `decimal` script (sums and quotients above), never by
  running `calculateWeightAndBalance`; name the method in a comment.
- Independent checks: moving the datum by `d` (every arm + `d`) moves the CG by exactly `d`; adding
  a station at the CG doesn't change the CG; zero-weight rows change nothing; a single row's CG is
  its arm; hidden values are ignored (`fuel: 999` on a weight row); `rowId` is ignored; the same
  loading entered in kg/mm and lb/in gives the same base results.
- Units (through `formDataToBaseUnits` with `weightAndBalanceUnitFields`): Fig. 10-5 in lb, in and
  US gal gives base kg, mm and L; Jet A density for a fuel row; changing `fuelType` converts fuel
  rows from their input (context change counts as an edit), other rows keep exact values.

Schema: valid input (parsed hidden fields `null`, `rowId` kept); 0 and 21 stations rejected, 1
and 20 accepted; name empty, spaces only, 30 accepted, 31 rejected; invalid type; weight −0.01
rejected, 0 and 10,000 accepted, 10,000.01 rejected (in lb: `"... 22,046.22 lb"`); arm ±20,000
accepted, beyond rejected (in inches: `"... 787.40 in"`); fuel negative rejected; fuel weight at
and beyond 10,000 kg for AVGAS and Jet A, in L and US gal (message in kg and lb); hidden fields
may be missing, `''` or out of range; all weights 0 → `"Total weight must be greater than 0"` on
`stations`, and not reported when a row already failed; maximum takeoff weight 0 rejected,
10,000 accepted, 10,000.01 rejected, `''`/`null` → `undefined`; numeric strings coerced; `BUG:`
case for the zod 3.22 `preprocess` quirk on `maxTakeoffWeight` if it applies.

### Acceptance criteria

- `/weight-and-balance-calculator` appears in the Aviation section, the category filter and
  search.
- Results match the PHAK examples in every unit combination; storage uses base units and never
  contains `rowId`.
- Rows can be added (up to 20), removed (down to 1) and renamed; deleting a middle row, adding a
  row or changing a row's type, then switching units, keeps the other rows' exact values.
- The fuel type select appears only with a fuel row.
- Save, rename, update (no update when nothing changed), import, delete and free-plan limit work.
  Disclaimer present.
- Lint, typecheck, format check and tests pass after each part.

## Open questions

None at the moment.
