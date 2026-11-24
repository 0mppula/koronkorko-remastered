# 08 True, Magnetic and Compass Heading Calculator

Branch: `feature/aviation-wave-3` (from an up-to-date `master`; plans 08–12 are written and all
five calculators are implemented there, in order 08 → 12). The aviation epic is closed; there is
no epic branch.

Follow "Adding a calculator" and "Adding an aviation calculator" in `AGENTS.md`. This plan only
lists what is specific to this calculator. Heading inputs and formatting reuse
`headingFieldSchema`, `normalizeDegrees` and `formatDegrees` from 02/03.

## Goal

Given the true heading, the magnetic variation and, optionally, the deviation correction from the
compass card, calculate the magnetic heading and the compass heading. No units (degrees only); no
new unit preference.

## Decisions

- **Direction:** true → magnetic → compass only. No reverse calculation.
- **Start value:** the true heading (wind already corrected). `Info.tsx` links to the Wind
  Triangle Calculator (`/wind-triangle-calculator`) to get it from the true course and wind.
- **Variation:** a value 0–180° plus an East/West select, as printed on charts. Stored as a
  Prisma enum `variationDirection` (`east`, `west`).
- **Deviation:** optional, entered as the **signed correction printed on the compass card**
  (e.g. `−2`, `+3`), applied as compass heading = magnetic heading + correction. Label: "Deviation
  correction from the compass card". PHAK gives deviation only as a signed correction (8-25,
  16-20), never as East/West, so there is no East/West select for it. Empty (`null`) means "magnetic
  heading only"; the compass heading is then not calculated (`null`).
- **Limits:** true heading 1–360 (`headingFieldSchema`), variation 0–180, correction −20 to +20.
- **Crosswind link:** `Info.tsx` also links to the Crosswind Calculator
  (`/crosswind-calculator`): METAR/TAF winds are true, runway headings are magnetic, so a true wind
  direction converted to magnetic here can go into the crosswind calculator.

## Scope

- Full-stack calculator (Prisma model, API routes, save, rename, update, import, delete, free-plan
  limit, tests).

## Out of scope

- Variation lookup from a position (WMM/IGRF), a full deviation card with interpolation, compass
  turning and acceleration errors, wind correction (Wind Triangle Calculator), compass → true.

## Inputs and outputs

| Field                         | Unit    | Notes                                                    |
| ----------------------------- | ------- | -------------------------------------------------------- |
| `trueHeading` (input)         | degrees | 1–360 (`headingFieldSchema`, north is 360)               |
| `variation` (input)           | degrees | 0–180                                                    |
| `variationDirection` (input)  | —       | `'east' \| 'west'`                                       |
| `deviationCorrection` (input) | degrees | optional (`.nullish()`, default `null`); −20 to +20      |
| `magneticHeading` (output)    | degrees | normalized to [0, 360); shown as heading (north `360°`)  |
| `compassHeading` (output)     | degrees | `null` without a correction; normalized like `magnetic…` |

No unit fields: `useCalculator` gets no `unitFields`.

## Formulas

Sources: FAA PHAK (FAA-H-8083-25C), chapter 16 "Navigation", p. 16-7 to 16-8 ("if variation is
west, add; if east, subtract … 'east is least (subtract) and west is best (add)'") and the
sequence "TH ± variation (V) = magnetic heading (MH) ± deviation (D) = compass heading (CH)"
(p. 16-9); chapter 8, "Compass Systems", p. 8-24 to 8-25. Ed Williams, "Compass Errors"
(`https://edwilliams.org/compass/node1.html`): "Magnetic Direction = True Direction (−E/+W)
Variation".

- `MH = normalizeDegrees(TH − variation)` for East, `normalizeDegrees(TH + variation)` for West.
- `CH = normalizeDegrees(MH + deviationCorrection)` when a correction is given, otherwise `null`.

`calculateHeading` returns unrounded values; the report shows whole degrees with
`formatDegrees(value, { heading: true })` (north `360°`, never `000°`). The variation is shown with
`formatVariation` (`9° E`; `0°` without East/West when the displayed value is 0) and the correction
with `formatSignedDegrees` (`+2°`, `-2°`, `0°`), both in `lib/units.ts`.

## Zod schema rules (`schemas/index.ts`)

- `trueHeading: headingFieldSchema('True heading')`.
- `variation: numberFieldSchema('Variation')` with `.min(0)` / `.max(180)` (messages
  `"Variation cannot be negative"`, `"Variation cannot be greater than 180°"`).
- `variationDirection: z.enum(variationDirections)` (`constants/data.ts`, like `fuelTypes`),
  message `"Variation must be East or West"`.
- `deviationCorrection`: optional number, −20 to +20 (`"Deviation correction must be between -20°
and +20°"`); `z.preprocess` (`''`/`null` → `undefined`) around `.nullish()`, like `gustSpeed`, so
  an empty input parses to `undefined` (form default and Prisma value are `null`), never 0. The zod
  3.22 `preprocess` quirk applies to this optional field (`BUG:` test); don't work around it.
- No cross-field checks.

## UI

- `Calculator.tsx`: defaults `{ trueHeading: 88, variation: 10, variationDirection: 'east',
deviationCorrection: -4 }` (PHAK Figure 16-16). Inputs: "True Heading" (`°`), "Variation"
  (`°`) with an East/West `Select` next to it (inline `FormGroup`), "Deviation Correction from the
  Compass Card" (`°`, `min0={false}`, optional, placeholder "Optional"). No `unitFields`.
- `Report.tsx`: True Heading, Variation, Deviation Correction (only when given), `ReportDivider`,
  Magnetic Heading, Compass Heading (otherwise "Not calculated (no deviation correction)"),
  `<CalculatorDisclaimer category="aviation" />`.
- `Info.tsx`: true north vs magnetic north, isogonic/agonic lines, "east is least, west is best"
  with the PHAK 9° E examples, deviation and the compass card (correction as printed, PHAK 8-25
  example), the links to the Wind Triangle and Crosswind calculators,
  `<p>{calculatorDisclaimers.aviation}</p>`, `ReportSource` to the PHAK page.

## Files to create or change

1. `prisma/schema.prisma`: `enum VariationDirection { east west }`; `type
HeadingCalculationFormData { trueHeading Float variation Float variationDirection
VariationDirection deviationCorrection Float? }`, `model HeadingCalculation`,
   `HeadingCalculations HeadingCalculation[]` on `User`. Run `npx prisma generate`.
2. `constants/data.ts`: `variationDirections`.
3. `schemas/index.ts` + test: `headingFormDataSchema`.
4. `lib/units.ts` + test: `formatVariation`, `formatSignedDegrees`.
5. `types/calculations.ts`: `IHeadingFormData`, `HeadingReportProps extends IHeadingFormData {
magneticHeading: number; compassHeading: number | null }`, add to `CalculationType`.
6. `lib/calculatorFns.ts` + test: `calculateHeading`.
7. `constants/api.ts`: `HEADING_CALCULATIONS_API_URL = '/api/heading-calculations'`,
   `HEADING_CALCULATIONS_QUERY_KEY = 'heading-calculations'`.
8. `constants/calculators.ts`: `{ name: 'True, Magnetic and Compass Heading Calculator', url:
'heading-calculator', category: 'aviation', description: 'Calculate the magnetic and compass
heading, given the true heading, magnetic variation and compass deviation correction.
Additionally, logged in users can save their calculations.' }`.
9. `app/api/heading-calculations/route.ts` and `[id]/route.ts` (`POST` saves `null` as
   `?? undefined`).
10. `app/(calculators)/heading-calculator/`: `page.tsx`, `Calculator.tsx`, `Report.tsx`,
    `Info.tsx`.
11. `README.md` aviation entry; `00-epic.md` follow-up (mark 08 done).

## Test cases

`calculateHeading` (`toBeCloseTo(x, 6)`), PHAK worked examples (exact):

| TH  | Variation | Correction | MH  | CH   | Source                                             |
| --- | --------- | ---------- | --- | ---- | -------------------------------------------------- |
| 360 | 9° E      | —          | 351 | null | PHAK 16-7 ("9° E": 360 → 351)                      |
| 90  | 9° E      | —          | 81  | null | PHAK 16-7 (090 → 081)                              |
| 180 | 9° E      | —          | 171 | null | PHAK 16-7 (180 → 171)                              |
| 270 | 9° E      | —          | 261 | null | PHAK 16-7 (270 → 261)                              |
| 60  | 9° E      | —          | 51  | null | PHAK 16-7 (TH 060 → 051)                           |
| 180 | 10° W     | −2         | 190 | 188  | PHAK 8-24/8-25 (Washington, D.C., correction −2°)  |
| 180 | 14° E     | —          | 166 | null | PHAK 8-24 (Los Angeles)                            |
| 28  | 7° E      | +2         | 21  | 23   | PHAK 16-20 flight planning example                 |
| 88  | 10° E     | −4         | 78  | 74   | PHAK Figure 16-16 (TH 088°, MH 078°, CH 074°)      |
| 5   | 10° E     | —          | 355 | null | Exact (wraps below 0)                              |
| 355 | 10° W     | +20        | 5   | 25   | Exact (wraps above 360)                            |
| 90  | 180° E/W  | —          | 270 | null | Exact (East and West give the same result at 180°) |
| 10  | 0° E      | −20        | 10  | 350  | Exact (zero variation; correction wraps below 0)   |

- PHAK 16-20 states the variation as "6.30° E (rounded to 7° E)"; the test uses 7° E as the text
  does.
- PHAK Figure 16-12 deviation card (For → Steer): MH 030 with correction −2 → CH 028; MH 210 with
  +2 → CH 212.
- Independent check: PHAK 8-25 reverse rule ("Compass Course ± Deviation = Magnetic Course ±
  Variation = True Course"): for every row, `CH − correction` gives MH and `MH + E − W` gives TH
  (after `normalizeDegrees`).
- Report labels (`lib/units.test.ts`): a variation of 0 shows `0°` without East/West; MH exactly 0
  shows `360°` (`formatDegrees` tests; `calculateHeading` returns 0 for magnetic north).

Schema: valid input passes; missing true heading, variation or direction; TH 1 and 360 accepted,
0 and 360.01 rejected (existing `headingFieldSchema` messages); variation 0 and 180 accepted,
−0.01 and 180.01 rejected; unknown direction rejected; correction `null`/missing/`''` accepted as
no correction (`undefined`), −20 and 20 accepted, −20.01 and 20.01 rejected; numeric strings
coerced; `BUG:` an invalid correction is not reported together with an invalid true heading.

## Acceptance criteria

- `/heading-calculator` appears in the Aviation section, the category filter and search.
- Results match the PHAK examples; storage holds the raw inputs (correction `null` when empty).
- Info links to the Wind Triangle and Crosswind calculators.
- Save, rename, update, import, delete and free-plan limit work. Disclaimer present.
- Lint, typecheck, format check and tests pass.

## Open questions

None at the moment.
