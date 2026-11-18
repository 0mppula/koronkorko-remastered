# 01 Foundation

Epic: `epic/aviation-calculators` (see `00-epic.md`) · Branch: `feature/aviation-foundation`
(create from up-to-date `epic/aviation-calculators`, PR back into it).

## Goal

Prepare the app for aviation calculators without adding one yet: calculator categories and landing
page sections, a unit preferences system (store, modal, sync with `User.preferences`), unit
conversion helpers, a unit-aware form input and form pattern, a reusable disclaimer, an AGENTS.md
checklist for aviation calculators, and copy that no longer says the app is finance-only.

Finance calculators must behave exactly as before.

## Scope

1. Calculator categories + Finance/Aviation sections on the landing page.
2. `lib/units.ts` (speed, altitude, temperature) + `lib/units.test.ts`.
3. Units Zustand store `hooks/useUnits.ts` (persisted).
4. Unit preferences in `User.preferences` (Prisma type, API validation, syncing).
5. Units button (`SlidersHorizontal`) + unit preferences modal in the Nav.
6. Unit-aware input (`NumberInputWithIcon`) and unit-aware form support in `useCalculator`.
7. Unit-aware zod field helper in `schemas/index.ts`.
8. `AviationDisclaimer` component + disclaimer text constant.
9. "Adding an aviation calculator" section and other updates in `AGENTS.md`.
10. Finance-only copy: metadata, manifest, README.

## Out of scope

- Any aviation calculator, Prisma calculation model or API route (02–05).
- Pressure and fuel unit preferences (added by 04 and 05). Distance has no preference until a
  calculator needs it.
- Angle/heading helpers (added by 02).
- Changes to the currency toggler, theme toggler behavior, Stripe, auth, `featuredApps`, or plan
  copy in `constants/data.ts` `plans` (it says "Unlimited calculations", which is not
  finance-specific).

## Current code this builds on

- `constants/calculators.ts`: `calculators` array (`as const`) of `{ name, url, description }`.
  Used by `app/page.tsx` (list + search filtering + highlight) and `lib/utils.ts`
  `getCalculatorWithPathname(path)` (page metadata).
- `app/page.tsx`: `TypographyH1` "Choose a Calculator", `CalculatorSearch`, one grid of calculator
  cards, then a divider (`bg-primary-neutral h-[2px]` bars around a `TypographyH2`) titled
  "Featured Apps" and a grid of `featuredApps`.
- `hooks/useCurrency.ts`: `useCurrencyStore` (`create<CurrencyStore>()(persist(..., { name:
'currency', storage: createJSONStorage(() => localStorage) }))`).
- `components/Nav/index.tsx`: right-hand group `<div className="flex items-center gap-2">` with
  `PreferredCurrencyToggler`, `ThemeToggler`, and `UserAccountNav` or `LoginModal`. This group is
  visible on all screen sizes.
- `components/Nav/PreferredCurrencyToggler.tsx` and `components/Nav/ThemeToggler.tsx`: each calls
  `useMutation({ mutationFn: updateUserPreferences, ... })` and
  `mutate({ sessionStatus, theme, currency })`; `onMutate` → `setIsGlobalLoading(true)`,
  `onSuccess` → invalidate `[USER_QUERY_KEY]`, `onError` → `toast.error(...)`.
- `lib/queryFns/auth.ts`: `getUser(sessionStatus)` and
  `updateUserPreferences({ sessionStatus, theme, currency })` → `PUT /api/auth/preferences` with
  `{ theme, currency }`.
- `app/api/auth/preferences/route.ts`: `PUT` writes `data: { preferences: body }` without
  validation. **It replaces the whole preferences object**, so every caller must send every field
  or the missing ones are lost.
- `components/providers/UserPreferencesProvider.tsx`: fetches the user; if
  `preferences.currency`/`theme` are missing it pushes the local values; otherwise it overrides
  local theme and currency from `data.preferences`.
- `prisma/schema.prisma`: `type preferences { theme String currency String }`,
  `User.preferences preferences?`.
- `components/Form/NumberInputWithIcon.tsx`: `iconType?: 'currency' | 'percentage'`, `min0` (default
  `true`), icon absolutely positioned at the right of the input.
- `hooks/useCalculator.ts`: `onCalculate` → `calcFn(formData)`; `handleSave` →
  `saveMutate({ formData: form.getValues() })`; `handleSaveUpdateStart` compares
  `JSON.stringify(activeCalculation.formData)` with `JSON.stringify(form.getValues())` and sends
  `form.getValues()`; `handleImport` → `form.reset(formData)`, `form.trigger()`,
  `calcFn(formData)`; `resetForm`/`handleClose` → `form.reset(defaultValues)`. It passes
  `defaultValues` to `useCalculationMutations`, whose delete `onSuccess` also resets to them.
- `schemas/index.ts`: private helpers `numberFieldSchema`, `positiveNumberFieldSchema`,
  `greaterThanZeroNumberFieldSchema`, `positiveNumberFieldSchemaWithMax`, all `z.coerce.number`
  with messages like `` `${fieldName} cannot be negative` ``.
- `components/Report/ReportSection.tsx`: children rendered in
  `flex flex-wrap items-center gap-4`; `ReportGroup` uses `basis-full sm:basis-[calc(50%-1rem/2)]`.
- Muted text: `text-muted-foreground` exists (`tailwind.config.ts` `muted.foreground`); reports and
  cards currently use `text-neutral-700 dark:text-neutral-300`.
- `lucide-react` `^0.365.0` exports `SlidersHorizontal` (checked in `node_modules`).

## 1. Categories and landing page

`constants/calculators.ts`:

- Add `category: 'finance'` to all 12 entries.
- Export the categories in display order:
    ```ts
    export const calculatorCategories = [
    	{ value: 'finance', label: 'Finance' },
    	{ value: 'aviation', label: 'Aviation' },
    ] as const;

    export type CalculatorCategory = (typeof calculatorCategories)[number]['value'];
    ```
- Each aviation calculator PR adds its entry with `category: 'aviation'`. Order inside the array is
  display order within a section.
- The file stays free of React and `lucide-react` imports (it is also used by `lib/utils.ts`).
  Category icons are mapped in the UI code, not here.

`app/page.tsx`:

- Keep `TypographyH1`, `CalculatorSearch` (its count stays the total of `filteredCalculators`),
  search filtering and `highlightText` as they are.
- Replace the single grid with one section per `calculatorCategories` entry: a heading using the
  same divider markup as "Featured Apps" (bars + `TypographyH2` with the category label), then the
  existing grid/card markup for `filteredCalculators.filter((c) => c.category === category.value)`.
- A section, including its heading, only renders when it has calculators (no matches for the
  search, or no aviation calculators yet, means no heading). Until 02 is merged, the page looks like
  today plus a "Finance" heading.
- When the search matches nothing, keep today's empty-result behavior: no category headings, no
  new "no results" message, `CalculatorSearch` shows `0`, and "Featured Apps" still renders.
- Category icon on each calculator card:
    - In `app/page.tsx`, map category → icon:
        ```ts
        import { Coins, ExternalLink, Plane, type LucideIcon } from 'lucide-react';
        import { type CalculatorCategory } from '@/constants/calculators';

        const categoryIcons: Record<CalculatorCategory, LucideIcon> = {
        	finance: Coins,
        	aviation: Plane,
        };
        ```
        The `Record` type makes a new category without an icon a type error.
    - Render it inside the card `Link` (already `relative`) with the same position, size and
      styling as the `ExternalLink` icon on the Featured Apps cards:
        ```tsx
        <div className="absolute top-[20px] right-[20px]">
        	<Icon className="w-[1.25rem] h-[1.25rem]" aria-hidden="true" />
        	<span className="sr-only">{category.label} calculator</span>
        </div>
        ```
        where `Icon = categoryIcons[calculator.category]`. The sr-only label reads e.g. "Finance
        calculator" / "Aviation calculator", using the label from `calculatorCategories`.
- Icon position on both card types: change the Featured Apps `ExternalLink` wrapper from
  `absolute top-[26px] right-[20px]` to `absolute top-[20px] right-[20px]`, so the category icon and
  the `ExternalLink` icon sit in the same place. Its icon size and styling stay the same.
- Title padding on both card types, so a title never runs under the icon:
    - Space the icon needs from the card's right edge: icon right offset `20px` + icon width
      `1.25rem` (`20px`) + gap `1rem` (`16px`) = `56px`.
    - The title already sits inside the card's `p-4` right padding (`16px`): the calculator `Link`
      and the Featured Apps `<a>` both use `p-4`, and the inner calculator `Card` adds no padding
      (`border-none`, no `p-*`). Both the padding and the icon's `right-[20px]` are measured from
      inside the `border-2`, so the border doesn't change the result.
    - Extra right padding on the title: `56px − 16px = 40px` = `2.5rem` = **`pr-10`**.
    - Calculator cards: `highlightText(calculator.name, query, TypographyH2, 'mb-2 pr-10')`.
    - Featured Apps cards: `<TypographyH2 className="mb-2 pr-10">{app.name}</TypographyH2>`.
    - Only the title gets `pr-10`. The separator and description keep the full width.
- Search stays as it is: no category filter in v1, and it doesn't match category labels. Aviation
  calculators are found by name and description like the others.
- "Featured Apps" stays below the sections. Its only markup changes are the icon `top-[20px]` and
  the title `pr-10` above. `featuredApps` data in `constants/data.ts` is unchanged.
- To avoid duplicating the divider markup three times, a small local component in `app/page.tsx` is
  fine (server component, no `'use client'`).

## 2. `lib/units.ts`

Pure TypeScript, no React. Exports (names are binding for 02–05):

```ts
export const unitQuantities = [
	{ value: 'speed', label: 'Speed' },
	{ value: 'altitude', label: 'Altitude' },
	{ value: 'temperature', label: 'Temperature' },
] as const; // modal order; 04 adds 'pressure', 05 adds 'fuel'

export const unitOptions = {
	speed: [
		{ value: 'kt', label: 'Knots (kt)', symbol: 'kt', toBase: ..., fromBase: ... },
		{ value: 'kmh', label: 'Kilometres per hour (km/h)', symbol: 'km/h', ... },
		{ value: 'mph', label: 'Miles per hour (mph)', symbol: 'mph', ... },
		{ value: 'ms', label: 'Metres per second (m/s)', symbol: 'm/s', ... },
	],
	altitude: [
		{ value: 'ft', label: 'Feet (ft)', symbol: 'ft', ... },
		{ value: 'm', label: 'Metres (m)', symbol: 'm', ... },
	],
	temperature: [
		{ value: 'c', label: 'Celsius (°C)', symbol: '°C', ... },
		{ value: 'f', label: 'Fahrenheit (°F)', symbol: '°F', ... },
	],
} as const;

export type UnitQuantity = (typeof unitQuantities)[number]['value'];
export type UnitValue<Q extends UnitQuantity> = (typeof unitOptions)[Q][number]['value'];
export type UnitPreferences = { [Q in UnitQuantity]: UnitValue<Q> };

export const BASE_UNITS: UnitPreferences = { speed: 'kt', altitude: 'ft', temperature: 'c' };
export const DEFAULT_UNIT_PREFERENCES: UnitPreferences = BASE_UNITS; // ICAO units

export const toBaseUnit = (value: number, quantity: UnitQuantity, unit: string): number
export const fromBaseUnit = (value: number, quantity: UnitQuantity, unit: string): number
export const getUnitSymbol = (quantity: UnitQuantity, unit: string): string
export const formatUnitValue = (value: number, quantity: UnitQuantity, unit: string, fractionDigits?: number): string
export const withDefaultUnitPreferences = (units?: Partial<Record<UnitQuantity, string>> | null): UnitPreferences

export type UnitFields<TFormData> = Partial<Record<keyof TFormData, UnitQuantity>>;
export const formDataToBaseUnits = <T>(formData: T, unitFields: UnitFields<T>, units: UnitPreferences): T
export const formDataFromBaseUnits = <T>(formData: T, unitFields: UnitFields<T>, units: UnitPreferences): T
```

Speed options are decided: kt, km/h, mph, m/s. Defaults for new users and signed-out users are the
ICAO units kt, ft and °C (no locale detection); when 04 adds pressure its default is hPa.

Conversion definitions (all exact by definition; no rounding anywhere in conversion):

| Unit | To base                    | Source                                       |
| ---- | -------------------------- | -------------------------------------------- |
| kt   | identity                   | —                                            |
| km/h | kt = km/h ÷ 1.852          | international nautical mile = 1852 m (exact) |
| mph  | kt = mph × 1609.344 ÷ 1852 | international mile = 1609.344 m (exact)      |
| m/s  | kt = m/s × 3600 ÷ 1852     | NM = 1852 m, 1 h = 3600 s                    |
| ft   | identity                   | —                                            |
| m    | ft = m ÷ 0.3048            | international foot = 0.3048 m (exact)        |
| °C   | identity                   | —                                            |
| °F   | °C = (°F − 32) × 5 ÷ 9     | definition of the Fahrenheit scale           |

Notes:

- Temperature is affine. `toBaseUnit`/`fromBaseUnit` are for absolute temperatures only.
  Temperature _differences_ (e.g. ISA deviation in 04) convert with × 9/5 and no offset; 04 adds
  a helper for that.
- `formatUnitValue` formats with `Intl.NumberFormat(undefined, { minimumFractionDigits,
maximumFractionDigits })` like `formatNumber`/`formatPercentage` in `lib/utils.ts` and appends
  `' ' + symbol` (e.g. `"1,250 ft"`, `"12.5 kt"`, `"15.0 °C"`). Returns `0` formatted for `NaN`,
  like `formatNumber`.
- **Display precision (decided)**, used as `formatUnitValue`'s default per quantity: speeds 1
  decimal, altitudes whole numbers, temperatures 1 decimal. Headings and angles are whole degrees
  shown as three digits (e.g. `090°`); 02 adds `formatDegrees` for that. 04 and 05 set the
  default precision for the quantities they add.
- `withDefaultUnitPreferences` returns `DEFAULT_UNIT_PREFERENCES` overlaid with every valid value
  from the input; unknown quantities are dropped and invalid unit values fall back to the default.
  It is used for the persisted store, for `User.preferences.units` and anywhere old data may lack a
  quantity added later.
- `formDataToBaseUnits`/`formDataFromBaseUnits` return a new object; only fields listed in
  `unitFields` are converted (using `units[quantity]`), other fields are copied unchanged. Field
  values may be numeric strings coming from inputs; convert with `Number(value)` and keep
  non-numeric values unchanged so zod still reports them. Empty values (`''`, `undefined`, `null`)
  of optional fields (e.g. gust speed in 02, taxi fuel in 05) stay unchanged; never turn them into
  `0`.

### `lib/units.test.ts`

Expected values come from the exact definitions in the table above:

- `fromBaseUnit(1, 'speed', 'kmh')` → `1.852`; `toBaseUnit(1.852, 'speed', 'kmh')` → `1`.
- `fromBaseUnit(1, 'speed', 'mph')` ≈ `1852 / 1609.344` (`toBeCloseTo(1.150779, 6)`).
- `fromBaseUnit(1, 'speed', 'ms')` ≈ `1852 / 3600` (`toBeCloseTo(0.514444, 6)`).
- `fromBaseUnit(1000, 'altitude', 'm')` → `304.8`; `toBaseUnit(304.8, 'altitude', 'm')` → `1000`.
- Temperature: 0 °C ↔ 32 °F, 100 °C ↔ 212 °F, −40 °C ↔ −40 °F, 15 °C ↔ 59 °F.
- Base unit (`kt`, `ft`, `c`) conversions are identities.
- Round trip `fromBaseUnit(toBaseUnit(x))` ≈ `x` for every option of every quantity.
- Not rounded: `toBaseUnit(10, 'speed', 'kmh')` equals `10 / 1.852` exactly (`toBe`).
- `getUnitSymbol('temperature', 'f')` → `'°F'`.
- `formatUnitValue`: number + space + symbol, default precision per quantity (speed `12.5 kt`,
  altitude `1,250 ft`, temperature `15.0 °C`), explicit fraction digits respected, `NaN` handled
  (assert the same way `lib/utils.test.ts` asserts `formatNumber`).
- `withDefaultUnitPreferences`: `null`/`undefined` → defaults; `{ speed: 'kmh' }` → defaults with
  `speed: 'kmh'`; `{ speed: 'furlongs' }` → default speed; extra keys dropped.
- `formDataToBaseUnits`/`formDataFromBaseUnits`: converts mapped fields only, leaves other fields
  untouched, does not mutate its input, accepts numeric strings, leaves empty optional values
  (`''`, `undefined`, `null`) unchanged.

## 3. Units store: `hooks/useUnits.ts`

Mirror `hooks/useCurrency.ts`:

```ts
interface UnitsStore {
	units: UnitPreferences;
	setUnits: (units: UnitPreferences) => void;
}

const useUnitsStore = create<UnitsStore>()(
	persist(
		(set) => ({
			units: DEFAULT_UNIT_PREFERENCES,
			setUnits: (units) => set({ units }),
		}),
		{
			name: 'units',
			storage: createJSONStorage(() => localStorage),
			// Stored units may predate quantities added later (pressure, volume, mass).
			merge: (persisted, current) => ({
				...current,
				units: withDefaultUnitPreferences((persisted as Partial<UnitsStore>)?.units),
			}),
		}
	)
);

export default useUnitsStore;
```

## 4. Preferences in the database and syncing

`prisma/schema.prisma`:

```prisma
type UnitPreferences {
  speed       String?
  altitude    String?
  temperature String?
}

type preferences {
  theme    String
  currency String
  units    UnitPreferences?
}
```

All unit fields are optional because existing documents have no `units` and later quantities are
added to existing documents; missing values are filled by `withDefaultUnitPreferences`. Run
`npx prisma generate`. No `prisma db push` (composite types need no indexes; ask before running it).

`schemas/index.ts`:

- `unitPreferencesSchema`: `z.object` with one `z.enum` per quantity built from
  `unitOptions[quantity].map((o) => o.value)`.
- `userPreferencesSchema`: `{ theme: z.string(), currency: z.enum(<currencies values>), units:
unitPreferencesSchema }`.
- Tests in `schemas/index.test.ts`: valid input, missing `units`, unknown unit value, unknown
  currency.

`app/api/auth/preferences/route.ts`: parse the body with `userPreferencesSchema` and store the
parsed value; add the `ZodError` → `400` with the first issue message branch from AGENTS.md
conventions. Session handling stays as it is.

`lib/queryFns/auth.ts`: `updateUserPreferences` variables become
`{ sessionStatus, theme, currency, units: UnitPreferences }` and the request body
`{ theme, currency, units }`. Add `lib/queryFns/auth.test.ts` mocking axios like
`lib/queryFns/calculations.test.ts`: sends `theme`, `currency` and `units`; returns `null` without
calling axios when not authenticated.

Callers (all must send `units`, since the route replaces the whole object):

- `components/Nav/ThemeToggler.tsx` and `components/Nav/PreferredCurrencyToggler.tsx`: read
  `units` from `useUnitsStore` and add it to `mutate(...)`. No other change.
- `components/providers/UserPreferencesProvider.tsx`:
    - The "no preferences yet" effect also runs when `data?.preferences?.units` is missing, and
      sends the local `units` (defaults for a new user, or what they chose while signed out).
    - The override effect also calls `setUnits(withDefaultUnitPreferences(data.preferences.units))`
      when `units` exists.
    - Keep the existing dependency arrays; don't fix or add `react-hooks/exhaustive-deps` warnings.
- New `UnitPreferencesModal` (below).

## 5. Units button and modal: `components/Nav/UnitPreferencesModal.tsx`

`'use client'`. Rendered in `components/Nav/index.tsx` right group, before
`PreferredCurrencyToggler`, so it shows on every page and every screen size.

- Trigger: `<Button variant="ghost" size="icon">` with
  `<SlidersHorizontal className="h-[1.25rem] w-[1.25rem]" />` and
  `<span className="sr-only">Set unit preferences</span>` (same sizing as the currency toggler).
- `Dialog` / `DialogContent` / `DialogHeader` / `DialogTitle` ("Unit Preferences") from
  `components/ui/dialog`, open state in local `useState` (like `SaveCalculationModal` is controlled).
- A react-hook-form form with `zodResolver(unitPreferencesSchema)`. One `FormField` per
  `unitQuantities` entry: `FormLabel` with the quantity label and a `Select` /
  `SelectTrigger` / `SelectContent` / `SelectItem` listing `unitOptions[quantity]` labels, exactly
  like the "Distribution Frequency" select in
  `app/(calculators)/dividend-yield-calculator/Calculator.tsx`. Because the fields are generated
  from `unitQuantities`, 04/05 only extend `lib/units.ts` and the schema.
- Reset the form to the store's `units` every time the dialog opens.
- Save button: `<Button type="submit" className="w-full">Save</Button>`. On submit: if unchanged,
  just close; otherwise `setUnits(values)`, and when `sessionStatus === 'authenticated'`
  `mutate({ sessionStatus, theme: resolvedTheme || 'system', currency, units: values })` with the
  same `onMutate`/`onSuccess`/`onSettled` as the currency toggler and `onError` toast
  `'Something went wrong while saving your unit preferences. Please try again'`. Close the dialog.
  No success toast: the dialog closing is the feedback (consistent with the currency toggler).
- Check the Nav right group still fits on a 320px wide screen (logo + 4 buttons).

## 6. Unit-aware input and form pattern

`components/Form/NumberInputWithIcon.tsx`: extend instead of creating a new input.

- `iconType?: 'currency' | 'percentage' | 'unit'` and `unitSymbol?: string`.
- For `'unit'`, render `<span aria-hidden>{unitSymbol}</span>` in the existing right-side slot,
  plus an `sr-only` span with the symbol, and give the input enough right padding for symbols like
  `km/h` (e.g. `pr-14`) so long values don't run under it.
- Placeholder for `'unit'`: no currency-like default; take it from props (fallback `'0'`).
- Directions use `iconType="unit" unitSymbol="°"`. Inputs that may be negative (temperature,
  elevation) pass `min0={false}`.
- Existing usages must render exactly as before.

`hooks/useCalculator.ts`: add an optional `unitFields?: UnitFields<TFormData>`. When it is not
given, behavior is identical to today (finance calculators don't change). When it is given:

- `useCalculator` reads `units` from `useUnitsStore`.
- `defaultValues` passed in are **base units**; resets (`resetForm`, `handleClose`, and the delete
  reset in `useCalculationMutations`) use `formDataFromBaseUnits(defaultValues, unitFields, units)`.
- `onCalculate(formData)` → `calcFn(formDataToBaseUnits(formData, unitFields, units))`.
- `handleSave` → `formData: formDataToBaseUnits(form.getValues(), ...)`.
- `handleSaveUpdateStart` compares in the user's units:
  `JSON.stringify(formDataFromBaseUnits(activeCalculation.formData, ...))` vs
  `JSON.stringify(form.getValues())` (deterministic, avoids float noise from converting back), and
  sends `formDataToBaseUnits(form.getValues(), ...)` as `formData`.
- `handleImport` → `form.reset(formDataFromBaseUnits(formData, ...))`, then `await form.trigger()`
  (validates the converted values with the current units' schema):
    - If it passes: `setReport(calcFn(formData))` (stored data is already base units) and the
      success toast `` `${name} imported` ``.
    - If it fails: keep today's behavior: error toast
      `` `${name} has invalid values. Fix them and calculate again.` ``, `setReport(null)`, and the
      field errors stay visible in the form. `calcFn` is not called.
    - In both cases the calculation becomes the active calculation and the import modal closes, as
      today.
- When `units` change while the calculator is open (user saves the units modal), convert the
  current form values from the previous units to the new ones
  (`formDataFromBaseUnits(formDataToBaseUnits(values, fields, prevUnits), fields, units)`, previous
  units kept in a `useRef`) and `form.reset` them, so the same physical values stay in the form.
  The report holds base values and is re-formatted on render, so it needs no change.
- Wrap new functions in `useCallback` with complete dependency arrays (no new lint warnings).

The report always receives base units (`calcFn` output) and formats with
`formatUnitValue(value, quantity, units[quantity])`.

Pure conversion logic lives in `lib/units.ts` and is tested there; the hook is not unit-tested
(no React test setup, see AGENTS.md).

### Unit-aware zod fields (`schemas/index.ts`)

Add and export a helper used by every aviation form schema:

```ts
export const unitNumberFieldSchema = (
	fieldName: string,
	quantity: UnitQuantity,
	unit: string,
	limits: { min?: number; max?: number; minExclusive?: boolean } // base units
) => ...
```

- Built on `numberFieldSchema(fieldName)` (coercion and "is required"/"has to be a number"/"finite"
  messages unchanged).
- Checks limits by converting the value to base units, with a small tolerance (e.g. `1e-9`) so a
  user entering the displayed limit in their unit is not rejected by float noise.
- Messages show limits in the user's unit with `formatUnitValue`, e.g.
  `"Wind speed cannot be greater than 370.4 km/h"`, `"Temperature cannot be lower than -76 °F"`,
  `"True airspeed must be greater than 0 kt"`.

Each aviation calculator then defines:

```ts
export const create<X>FormDataSchema = (units: UnitPreferences) => z.object({ ... });
export const <x>FormDataSchema = create<X>FormDataSchema(BASE_UNITS); // API routes + types
```

The Calculator uses `useMemo(() => create<X>FormDataSchema(units), [units])` with `zodResolver`.
react-hook-form must validate with the current schema after a units change: verify that
`useForm` picks up the new resolver on re-render; if it doesn't, pass a resolver that reads the
latest schema from a ref.

Tests (in `schemas/index.test.ts`, `describe('unitNumberFieldSchema')`): accepts a value at the
limit in a non-base unit, rejects above it, message contains the limit in the user's unit and
symbol, coerces numeric strings.

## 7. Disclaimer

- `constants/data.ts`: `export const AVIATION_DISCLAIMER = 'For training and educational use only. Not for flight planning or navigation.';`
- `components/Report/AviationDisclaimer.tsx` (server-safe, no hooks):
    ```tsx
    const AviationDisclaimer = () => {
    	return <p className="basis-full text-sm text-muted-foreground">{AVIATION_DISCLAIMER}</p>;
    };
    ```
    `basis-full` because `ReportSection` lays children out in a wrapping flex row.
- Usage (by 02–05): last child of `<ReportSection>` in each aviation `Report.tsx`, and one sentence
  in each aviation `Info.tsx` (e.g. "This calculator is for training and educational use only and
  must not be used for flight planning or navigation.").

## 8. AGENTS.md updates

- **Project**: describe KoronKorko as a full-stack web app with finance and aviation calculators
  (keep the list of finance calculators; aviation ones are added by their PRs). Mention unit
  preferences next to currency.
- **Structure**: add `lib/units.ts` (unit definitions and conversions), `hooks/useUnits.ts`,
  `components/Nav/UnitPreferencesModal.tsx`, `components/Report/AviationDisclaimer.tsx`,
  `docs/plans/` (plan files).
- **Zustand convention**: "`persist` only for currency and units".
- **Conventions**: format aviation values with `formatUnitValue(value, quantity, units[quantity])`
  from `lib/units`; `units` from `useUnitsStore`.
- Add this section after "Adding a calculator":

```md
## Adding an aviation calculator

Follow "Adding a calculator" with these differences:

1. Base units everywhere except the form: kt, ft, NM, hPa, °C, kg, L, degrees. Prisma formData,
   API bodies, `calculate<X>` input/output and stored values use base units and are never rounded.
2. `lib/units.ts`: if the calculator needs a quantity that has no preference yet, add it to
   `unitQuantities`/`unitOptions` (exact conversion factors, cited), as an optional field on the
   Prisma `UnitPreferences` type, and test it in `lib/units.test.ts`. The units modal and
   `unitPreferencesSchema` pick it up automatically.
3. `schemas/index.ts`: `create<X>FormDataSchema(units)` using `unitNumberFieldSchema` with limits
   in base units, plus `<x>FormDataSchema = create<X>FormDataSchema(BASE_UNITS)` for the API.
   Infer `I<X>FormData` from `<x>FormDataSchema`.
4. `lib/calculatorFns.ts`: `calculate<X>` takes and returns base units. Cite the formula source in
   a one-line comment.
5. `Calculator.tsx`: export a `<x>UnitFields` map (`UnitFields<I<X>FormData>`), base-unit
   `defaultValues`, schema via `useMemo(() => create<X>FormDataSchema(units), [units])`, pass
   `unitFields` to `useCalculator`, and use `NumberInputWithIcon iconType="unit"` with
   `getUnitSymbol(...)` (`unitSymbol="°"` for directions).
6. `Report.tsx`: format with `formatUnitValue` in the user's units; end with
   `<AviationDisclaimer />`.
7. `Info.tsx`: explain the formula and sources, include the disclaimer sentence, end with
   `ReportSource`.
8. `constants/calculators.ts`: `category: 'aviation'`. Add the calculator to README's aviation
   section.
9. Tests: formula tests with expected values from ICAO/FAA/E6B worked examples or exact
   derivations; schema tests in base units and in at least one non-base unit (message shows the
   user's unit).
```

## 9. Finance-only copy

| File                         | Current                                                                                          | Change to (proposal)                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `app/layout.tsx` metadata    | "A finance web-application with various types of easy to use finance calculators."               | "A web-application with easy to use finance and aviation calculators."               |
| `app/manifest.ts`            | "KoronKorko is a finance web-application with various types of easy to use finance calculators." | "KoronKorko is a web-application with easy to use finance and aviation calculators." |
| `README.md` intro (line ~18) | "a full-stack finance web-app … KoronKorko has different types of finance calculators."          | "a full-stack web-app … KoronKorko has finance and aviation calculators."            |
| `README.md` preferences      | "select a preferred currency in which all the monetary values are printed…"                      | Add: users can also choose units (speed, altitude, temperature) stored the same way. |
| `README.md` calculator list  | "## Calculators of KoronKorko" lists finance calculators only                                    | Add an "Aviation Calculators" section (see below).                                   |
| `AGENTS.md` Project          | "full-stack finance web app … with 12 finance calculators"                                       | See section 8.                                                                       |

Not changed: `featuredApps` (decision), `plans` features, `app/thank-you/page.tsx`, `LoginModal`
title, finance calculators' `Info.tsx` (they talk about finance correctly), "Choose a Calculator"
heading.

README: add an "Aviation Calculators" section after the existing calculator list, with a heading
and a short intro (e.g. "Calculators for pilots and student pilots. Values can be entered and shown
in the units chosen in the unit preferences."). It has no entries yet; each calculator branch adds
its own entry in the same format as the existing list (`### [Name][n]`, a one-line description,
`---` separator, and a link reference at the bottom).

Footer: `components/Footer.tsx/index.tsx` renders `footerLinks` from `constants/data.ts`
(Technologies, Resources, Developer, Other). It does not list calculators, so following the
existing pattern means no footer change.

## Files to create or change

Create: `lib/units.ts`, `lib/units.test.ts`, `hooks/useUnits.ts`,
`components/Nav/UnitPreferencesModal.tsx`, `components/Report/AviationDisclaimer.tsx`,
`lib/queryFns/auth.test.ts`.

Change: `constants/calculators.ts`, `app/page.tsx`, `prisma/schema.prisma`, `schemas/index.ts`,
`schemas/index.test.ts`, `app/api/auth/preferences/route.ts`, `lib/queryFns/auth.ts`,
`components/Nav/index.tsx`, `components/Nav/ThemeToggler.tsx`,
`components/Nav/PreferredCurrencyToggler.tsx`,
`components/providers/UserPreferencesProvider.tsx`, `components/Form/NumberInputWithIcon.tsx`,
`hooks/useCalculator.ts`, `hooks/useCalculationMutations.ts` (only if needed to pass converted
reset values), `constants/data.ts`, `app/layout.tsx`, `app/manifest.ts`, `README.md`, `AGENTS.md`,
`docs/plans/aviation/00-epic.md` (check off 01).

## Acceptance criteria

- Landing page shows a "Finance" section with all 12 calculators; no "Aviation" section until an
  aviation calculator exists; search hides empty sections; "Featured Apps" content unchanged (only
  the icon position and title padding below change).
- A section heading only renders when its section has calculators. A search that matches nothing
  behaves as today: no category headings, no new message, count `0`, "Featured Apps" still shown.
- Each calculator card shows its category icon (Finance: `Coins`, Aviation: `Plane`, from
  `lucide-react`) in the same position, size and styling as the `ExternalLink` icon on the Featured
  Apps cards, with `aria-hidden` on the icon and an sr-only label like "Finance calculator". The
  mapping is a `Record<CalculatorCategory, LucideIcon>` in the UI code; `constants/calculators.ts`
  has no React or `lucide-react` imports.
- The category icon and the Featured Apps `ExternalLink` icon are in the same position on both card
  types (`absolute top-[20px] right-[20px]`, `w-[1.25rem] h-[1.25rem]`).
- At a 320px viewport, long titles on both card types (e.g. the longest calculator name and the
  longest Featured App name) wrap before the icon and never run under it; both titles have `pr-10`.
- README has an "Aviation Calculators" section with heading and intro.
- The `SlidersHorizontal` button is visible on every page (desktop and mobile), opens the modal
  with Speed, Altitude and Temperature selects showing the current values, and Save applies them.
- Signed out: unit choice survives a reload (localStorage key `units`).
- Signed in: unit choice is saved to `User.preferences.units` and restored on another browser;
  changing theme or currency keeps `units` in the database; an existing user without `units` gets
  defaults written on next load without losing theme/currency.
- `PUT /api/auth/preferences` rejects an invalid unit with `400` and the zod message.
- Finance calculators: inputs, save/update/import/delete and reports unchanged.
- `lib/units.test.ts`, schema tests and `auth.test.ts` pass; lint, typecheck, format check pass.

## Open questions

None at the moment.
