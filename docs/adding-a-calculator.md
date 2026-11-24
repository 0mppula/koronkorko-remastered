# Adding a calculator with an agent

The human workflow used for calculators 01–12 (`docs/plans/aviation/`). All technical rules
(files, schemas, units, tests, pitfalls, git) are in [AGENTS.md](../AGENTS.md); this guide doesn't
repeat them.

## 1. Decide whether a plan file is needed

- **Plan file needed:** any new calculator, anything that adds a unit preference or changes shared
  code (`lib/units.ts`, `useCalculator`, Prisma `unitPreferences`, the units modal), or several
  calculators built together.
- **No plan file:** small follow-ups (copy, styling, a fix with a failing test first). Describe
  them directly in the prompt.

Plans go in `docs/plans/<area>/NN-<name>.md`, start from [\_template.md](plans/_template.md) and
use the closest existing plan as a model (06–12 for aviation). A group of calculators gets an
epic or status file (`00-epic.md`).

## 2. Write the plan (Plan mode, docs only)

Ask for the domain and design questions first; the answers go into the plan as decisions. Answer
each question explicitly and correct anything the agent assumed.

```text
Write the plan file docs/plans/<area>/NN-<name>.md for: <what it calculates from what>.
Plan files only, no code.

Read AGENTS.md (including the pitfalls) and docs/plans/_template.md. Use <closest plans> as the
model for length and structure: concise, referencing AGENTS.md and existing plans instead of
repeating conventions. Read the code only where needed.

Before writing anything, ask me the domain and design questions (inputs, outputs, formulas,
limits including limits on computed results, new unit preferences, what's in and out of scope).
Then write my answers into the plan as decisions.

Don't guess formulas or reference values. Only cite a source as confirming a value if you opened
it and checked the number; otherwise say it wasn't opened.

Create the branch feature/<kebab-case> from an up-to-date master. Format with Prettier. You can
make commits, with the message "Add plan for <name> calculator". Don't push.
```

Review the plan before implementing:

- Every formula and expected value has a source that was opened (title, page, quoted text), or
  is an exact derivation. Rules of thumb only from opened sources, next to the exact value.
- Limits are in base units and include limits on computed results.
- Each test row names its source, and there is an independent verification method.
- Where a source rounds, the plan states the exact value and the tolerance to the source's figure.

## 3. Implement (one chat per calculator)

Start a new chat for each calculator. Build calculators **one at a time, in order, never in
parallel**. Calculators that change shared unit code (`lib/units.ts`, Prisma `unitPreferences`,
the units modal) are merged one at a time, or built in sequence on one branch.

```text
Implement docs/plans/<area>/NN-<name>.md. Read it and AGENTS.md (including the pitfalls) first.
Use <closest existing calculator> as the example. Where the merged code differs from the plan,
follow the code and tell me.

<Create the branch feature/<kebab-case> from an up-to-date master | Stay on the current branch
feature/<kebab-case>.> You can make commits. Don't push. Present your implementation plan first,
including anything in the plan file you think is wrong or risky.
```

### Check the agent's implementation plan

Before saying "go", check that it:

- Lists every file from the plan's "Files to create or change", and nothing outside the scope.
- Reuses existing helpers and components instead of new ones (see AGENTS.md).
- Names where each error message appears (field path) and how hidden or optional fields are stored.
- Computes expected test values independently, not by running the new code.
- Flags differences between the plan and the code instead of silently choosing one.

Reply with corrections as a numbered list and ask the agent to update the plan file accordingly,
then "go". After implementing, the agent updates the plan file (and the epic checklist) to match
the code.

## 4. Test manually

Run `npm run dev` and check:

- The calculator appears in its landing page section, the category filter and search.
- Results match the plan's source examples, in every unit (switch units in the units modal and
  press Save; values convert without drift).
- Every limit message, including computed-result limits, at and beyond the limit.
- Optional and hidden fields: empty, cleared, switching modes clears the form errors.
- Signed in: save, rename, update, import (also after switching units), delete, free-plan limit.
- Light and dark mode, 320 px, 375 px and desktop. Report and `Info.tsx` end with the disclaimer.

If the dev overlay blocks clicks on the first compile, reload the page.

## 5. PR, merge and clean up

1. The agent runs lint, typecheck, format check and tests before each commit.
2. Push the branch yourself (the agent doesn't push unless asked) and open a PR (to `master`, or
   to the `epic/` branch for epic features). CI must pass; check the Vercel preview.
3. Merge, then delete the remote and local branch and fetch:

```sh
git switch master && git pull && git branch -d feature/<kebab-case> && git fetch --prune
```

## Source honesty

- Only cite a source as confirming a value if it was actually opened and the number checked.
  Otherwise say "not opened" and don't rely on it.
- Cite the printed page (FAA PDFs: the page number in extracted text is a footer).
- Ask the agent which sources it opened if the plan or tests don't say.
