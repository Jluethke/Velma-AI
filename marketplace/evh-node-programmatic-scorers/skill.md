# TypeScript Programmatic Scorers

**One-line description:** Implements deterministic TypeScript scorers for an LLM eval (normalized exact match, token F1, anchored regex, JSON Schema validation with Ajv, numeric tolerance, length and forbidden-string checks) in a module that promptfoo `javascript` assertions and Vitest can both import, and unit tests every scorer with Vitest before any model is scored.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `task_spec` (object, required): From `evh-task-rubric-spec`; `output_type` and `hard_constraints` decide which scorers are needed.
- `golden_set` (string, required): Path to `evals/data/golden.jsonl`.
- `project_dir` (string, required): Repository root with Node.js and a `package.json`.

---

## Outputs

- `scorer_module` (string): Path to `evals/scorers.ts` (compiled or run through `tsx`) exporting `score<Name>(output: string, item: Item): ScoreResult` with `ScoreResult = { name: string; pass: boolean; score: number; reason: string }`. The `pass`, `score`, `reason` fields match promptfoo's GradingResult shape.
- `scorer_tests` (string): Path to `evals/scorers.test.ts`.

---

## Phase 1: Pick Scorers and Install

### Entry Criteria
- `rubric.yaml` lists programmatic criteria.

### Actions
1. Install: `npm install --save-dev vitest ajv ajv-formats typescript tsx`. Do not add a library for something a few lines of code do (normalization, F1).
2. Map criteria to scorers:

| Need | Scorer | Call |
|---|---|---|
| Label | `scoreExact` | `s.normalize("NFKC").trim().toLowerCase()` then `===` |
| Short answer | `scoreTokenF1` | SQuAD v1.1 normalization then token overlap F1 |
| Whole-output format | `scoreRegexFull` | build the RegExp with `^(?:` + pattern + `)$`; for "contains" use the plain pattern |
| JSON | `scoreJsonSchema` | `JSON.parse` then `new Ajv({ allErrors: true, strict: true })`, `addFormats(ajv)`, `ajv.compile(schema)`, read `validate.errors` |
| Number | `scoreNumericTol` | `Math.abs(a - b) <= Math.max(absTol, relTol * Math.max(Math.abs(a), Math.abs(b)))` with tolerances from `task_spec` |
| Length | `scoreMaxWords` | `s.trim().split(/\s+/).filter(Boolean).length` |
| Forbidden or canary | `scoreForbidden` | `list.some(x => s.toLowerCase().includes(x.toLowerCase()))` |

3. Pitfalls to avoid: a RegExp with the `g` flag keeps `lastIndex` between `test()` calls and gives alternating results; never use `g` in scorers. `toLowerCase` is not full case folding; for non-ASCII domains also apply `normalize("NFKC")`. `JSON.parse` accepts a bare number or string; check `typeof obj === "object" && obj !== null` before schema validation if the schema needs an object.
4. Ajv default is JSON Schema draft-07. If your schema declares `"$schema": "https://json-schema.org/draft/2020-12/schema"`, import `Ajv2020` from `ajv/dist/2020` instead.

### Output
Scorer list and installed dependencies.

### Quality Gate
- `npx vitest --version` and `node -e "require('ajv')"` both exit 0.
- Every tolerance or limit is quoted from `task_spec`.

---

## Phase 2: Write Tests First

### Entry Criteria
- Dependencies installed.

### Actions
1. Create `evals/scorers.test.ts`. Use `it.each([...])` with a `name` column so failures are named. Cover pass, fail, empty string, whitespace only, Unicode composed vs decomposed, JSON in a code fence, number with thousands separator.
2. Run `npx vitest run evals/scorers.test.ts`. It must fail because `evals/scorers.ts` does not export the functions yet.

### Output
Failing tests.

### Quality Gate
- Vitest output names the missing exports (for example `does not provide an export named 'scoreExact'` or `scoreExact is not a function`), not a TypeScript syntax error in the test file.

---

## Phase 3: Implement, Verify, Wire for promptfoo

### Entry Criteria
- Failing tests exist.

### Actions
1. Implement one scorer at a time and run `npx vitest run evals/scorers.test.ts -t <scorerName>` after each.
2. Scorers never throw on model output: wrap `JSON.parse` in `try/catch` and return `{ pass: false, score: 0, reason: String(err) }`.
3. Add a promptfoo entry file `evals/assert_<name>.js` (CommonJS) for each scorer that promptfoo will call:
   `module.exports = (output, context) => scoreJsonSchema(output, context.vars);`
   If the scorers are TypeScript, build them first (`npx tsc -p evals/tsconfig.json`) and require the compiled `.js`. promptfoo passes `output` and a `context` with `vars`; returning an object with `pass`, `score`, `reason` is a documented GradingResult.
4. Mutation check: remove the `^` anchor in `scoreRegexFull`, rerun, confirm a test fails, revert.
5. Self-score the golden targets as outputs; all must pass.

### Output
`scorer_module`, `scorer_tests`, promptfoo assertion entry files.

### Quality Gate
- `npx vitest run evals/scorers.test.ts` prints all tests passed, zero failed, zero skipped.
- `node -e "const f=require('./evals/assert_json_schema.js');console.log(f('{}',{vars:{}}))"` prints an object with `pass`, `score`, `reason`.
- Golden self-score is 100 percent.

---

## Worked Example

Illustrative only. Extraction feature returning `{"order_id": "^ORD-\\d{6}$", "amount": number}`; amount tolerance `absTol: 0.01` from the task spec (currency cents).

- Phase 1: `scoreJsonSchema` with `Ajv2020` (schema declares 2020-12), `scoreNumericTol` on `amount`.
- Phase 2: 11 cases; first run fails with `scoreJsonSchema is not a function`.
- Phase 3: `npx vitest run evals/scorers.test.ts` prints `Tests 11 passed (11)`. Anchor mutation made `regex: trailing text` fail; reverted. `evals/assert_json_schema.js` prints `{ pass: false, score: 0, reason: "must have required property 'order_id'" }` for `{}`.

---

## Exit Criteria

DONE when every programmatic criterion has a tested TypeScript scorer, Vitest is green, the mutation check failed as expected, and promptfoo entry files return GradingResult objects.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Ajv `strict` mode rejects the schema | **Adjust**: fix the schema (unknown keywords, missing `type`); do not turn strict off to get green. |
| Phase 2 | Tests pass before implementation | **Stop**: the import path is wrong or tests are skipped; fix it. |
| Phase 3 | ESM and CommonJS mismatch when promptfoo requires the file | **Adjust**: emit CommonJS for the entry files or use `.cjs`; check promptfoo docs for the module format it loads. |
| Phase 3 | Golden target fails its scorer | **Return**: fix the target or normalization in `golden.jsonl`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
