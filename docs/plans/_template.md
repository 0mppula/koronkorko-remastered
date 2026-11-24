# NN <Name> Calculator

Branch: `feature/<kebab-case>` (from an up-to-date `master`).

Follow "Adding a calculator" (and "Adding an aviation calculator" for aviation) in `AGENTS.md`.
This plan only lists what is specific to this calculator; conventions are as in <closest existing
plan>.

## Goal

<What the calculator computes from what, in one or two sentences. Which existing unit preferences
it uses, or which new one it adds.>

## Decisions

<The answers to the domain and design questions, one bullet each.>

- **<Topic>:** <decision>.
- **Limits (base units):** <field> <min> to <max>, ... **Computed results** must stay within
  <limits>, rejected on `<field>` (a field always involved).
- **Rules of thumb** (`Info.tsx` only, from sources actually opened): <rule, source, page>.

## Scope

- Full-stack calculator (Prisma model, API routes, save, rename, update, import, delete, free-plan
  limit, tests).

## Out of scope

- <...>

## Inputs and outputs (base units)

| Field             | Base unit | Preference | Notes |
| ----------------- | --------- | ---------- | ----- |
| `<field>` (input) |           |            |       |
| report `<field>`  |           |            |       |

`<x>UnitFields`: `{ <field>: '<quantity>' }`.

## Formulas

Sources: <title (document number)>, chapter, page, quoted text and worked example. Mark any source
that was not opened as **not opened** and don't rely on it.

- `<output> = <formula>` (base units).

## Zod schema rules (`schemas/index.ts`)

- `create<X>FormDataSchema(units)`: <field> (`unitNumberFieldSchema`, `min`, `max`), optional
  fields, enums (options in `constants/data.ts`, messages).
- Cross-field (`superRefine`), each only when the involved fields passed their own checks:
    - <condition> → path `<field>`, `"<message>"`.
    - computed results (run `calculate<X>` on the base values, same tolerance as the unit limits):
      only the first exceeded one, path `<field>`, `"<message>"`.
- `.transform`: <fields stored as `null`>.
- Messages in the user's unit, rounded inwards: e.g. `"<message>"`.

## UI

- `Calculator.tsx`: defaults (base units) `{ ... }` (<source>). Inputs: <label> (<unit symbol>,
  `min0={false}` if negative allowed, optional/placeholder).
- `Report.tsx`: inputs, `ReportDivider`, <outputs and formats>,
  `<CalculatorDisclaimer category="<category>" />`.
- `Info.tsx`: <formula, examples, applicability>, `<p>{calculatorDisclaimers.<category>}</p>`,
  `ReportSource` to <page>.

## Files to create or change

1. `prisma/schema.prisma`: `type <X>CalculationFormData { ... }`, `model <X>Calculation`,
   `<X>Calculations <X>Calculation[]` on `User`. Run `npx prisma generate`.
2. `schemas/index.ts` + test.
3. `types/calculations.ts`: `I<X>FormData`, `<X>ReportProps`, add to `CalculationType`.
4. `lib/calculatorFns.ts` + test: `calculate<X>`.
5. `constants/api.ts`: `<X>_CALCULATIONS_API_URL = '/api/<x>-calculations'`,
   `<X>_CALCULATIONS_QUERY_KEY = '<x>-calculations'`.
6. `constants/calculators.ts`: `{ name: '<Name> Calculator', url: '<x>-calculator', category:
'<category>', description: '<...> Additionally, logged in users can save their calculations.' }`.
7. `app/api/<x>-calculations/route.ts` and `[id]/route.ts`.
8. `app/(calculators)/<x>-calculator/`: `page.tsx`, `Calculator.tsx`, `Report.tsx`, `Info.tsx`.
9. `README.md` entry; epic/status file (mark NN done).

## Test cases

`calculate<X>` (`toBeCloseTo(x, <digits>)`):

| <Inputs> | <Outputs> | Source |
| -------- | --------- | ------ |
|          |           |        |

- Expected values come from the sources above or exact derivations, computed in a standalone
  script (e.g. Python `decimal`), never by running `calculate<X>`; name the method in a comment.
- Where a source rounds intermediate steps: assert the exact value and that it is within <n> % of
  the source's figure, with a comment why.
- Independent verification method: <inverse formula, feeding results back, vector addition, ...>.
- Units: <values in non-base units through `formDataToBaseUnits`>.

Schema: valid input; missing fields; each limit at and beyond (messages in at least one non-base
unit); cross-field and computed-result limits at and beyond; no cross-field message when a field
already failed; numeric strings coerced; `BUG:` cases where applicable.

## Acceptance criteria

- `/<x>-calculator` appears in its category section, the category filter and search.
- Results match the source examples in every unit; storage uses base units.
- Save, rename, update, import, delete and free-plan limit work. Disclaimer present.
- Lint, typecheck, format check and tests pass.

## Open questions

None at the moment.
