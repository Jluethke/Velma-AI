# TDD JavaScript Mutation Testing With StrykerJS

**One-line description:** Runs StrykerJS with the Jest or Vitest runner plugin over the changed source files, reads the mutation score and the Survived and NoCoverage mutants in the HTML report, and kills each survivor with one red-first test or records it as equivalent.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `refactored_code` (object, required): Changed production files and suite result from `tdd-refactor-under-green`.
- `coverage_report` (object, required): From `tdd-node-coverage`; used to scope `mutate` to covered, changed files.
- `test_runner` (string, required): `jest` or `vitest`.

---

## Outputs

- `mutation_report` (object): Stryker version, config file, mutation score, counts per status (Killed, Survived, NoCoverage, Timeout, CompileError, RuntimeError, Ignored), and report path.
- `killing_tests` (object[]): Mutant id, mutator, location, new test name, red evidence with the mutant hand-applied, green evidence after restore.
- `equivalent_mutants` (object[]): Mutant id, diff and reason.

---

## Phase 1: Install and Configure

### Entry Criteria
- Suite passes; `git status --porcelain` is empty.

### Actions
1. Run `npm init stryker@latest` and answer the prompts (test runner, reporters), or install by hand: `npm install --save-dev @stryker-mutator/core` plus the runner plugin:

| test_runner | Plugin | `testRunner` value |
|---|---|---|
| jest | `@stryker-mutator/jest-runner` | `"jest"` |
| vitest | `@stryker-mutator/vitest-runner` | `"vitest"` |

For TypeScript type checking of mutants add `@stryker-mutator/typescript-checker` and `"checkers": ["typescript"]` (mutants that do not compile become CompileError instead of wasting test time).
2. Config file `stryker.config.mjs` (or `stryker.config.json`); keep it small:

```js
export default {
  testRunner: 'vitest',
  mutate: ['src/discount.ts'],
  reporters: ['clear-text', 'progress', 'html'],
  coverageAnalysis: 'perTest',
};
```

`mutate` lists only files changed in this TDD cycle. Leave `thresholds` at Stryker's documented defaults unless the user gives values.
3. Run `npx stryker run`. The HTML report lands in `reports/mutation/mutation.html`. Add `reports/` and `.stryker-tmp/` to `.gitignore`.

### Output
A completed Stryker run.

### Quality Gate
- The run ends with a `Mutation score` line and a table per file.
- `reports/mutation/mutation.html` exists.

---

## Phase 2: Read the Report

### Entry Criteria
- Report exists.

### Actions
1. Status meanings:

| Status | Meaning | Action |
|---|---|---|
| Killed | a test failed: good | none |
| Timeout | mutant hung; counted as detected | none |
| Survived | tests ran this code and all passed | Phase 3 |
| NoCoverage | no test runs this code | uncovered code: missing behavior or dead code per `tdd-node-coverage` |
| CompileError / RuntimeError | mutant invalid | ignore; not counted in the score |
| Ignored | excluded by config or `// Stryker disable` comment | none |

2. The clear-text reporter prints each survivor as `[Survived] <Mutator>` with file, line and a `-`/`+` diff. Common mutators: `ConditionalExpression`, `EqualityOperator` (`<=` to `<`), `ArithmeticOperator`, `BlockStatement` (body emptied), `StringLiteral` (string emptied), `BooleanLiteral`, `LogicalOperator`, `OptionalChaining`, `MethodExpression` (`.filter` removed).
3. Note each survivor's behavior change in one sentence.

### Output
Survivor list.

### Quality Gate
- Every Survived mutant has its mutator name, location and a behavior sentence.

---

## Phase 3: Kill or Classify

### Entry Criteria
- Survivor list exists.

### Actions
1. For each survivor, if some input makes original and mutant behave differently, write a killing test:
   a. Write the test asserting the requirement's result. Run it alone (`npx vitest run <file> -t "<name>"` or `npx jest <file> -t "<name>"`): it must pass on the original.
   b. Hand-apply the mutant's `+` line to the source file. Run the new test: it must fail.
   c. `git restore <source file>`. Run the full suite: green.
2. StringLiteral survivors on log or error message text: kill them only if the requirement specifies the message. Otherwise they are equivalent for this requirement; record them.
3. Equivalent mutants: record the reason. Use `// Stryker disable next-line <Mutator>: <reason>` only if the project allows disable comments.
4. Rerun `npx stryker run` (add `--incremental` to reuse results for unchanged code; it stores `reports/stryker-incremental.json`).
5. Do not narrow `mutate` or add disable comments to raise the score.

### Output
`mutation_report`, `killing_tests`, `equivalent_mutants`.

### Quality Gate
- After the rerun, every former survivor is Killed, Timeout, or listed in `equivalent_mutants`.
- Each killing test has red output from step 1b.
- `git status --porcelain` shows no hand-applied mutant left.

---

## Worked Example

Illustrative only. `test_runner` = `vitest`, `mutate: ['src/discount.ts']`.

```
$ npx stryker run
[Survived] EqualityOperator
src/discount.ts:9:7
-     if (total >= 100) {
+     if (total > 100) {
Mutation score: 88.89
```

The requirement says "orders of 100 or more get 10 percent off". Test: `expect(discount(100)).toBe(10)`. Passes on the original; after hand-editing `>=` to `>` it fails with `expected +0 to be 10`; `git restore src/discount.ts`; suite green. Rerun: `Killed` for that mutant.

---

## Exit Criteria

DONE when Stryker ran with the matching runner plugin over the changed files, every Survived mutant is killed by a test proven red against it or recorded as equivalent, and no mutant edits remain in source.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Cannot find TestRunner plugin "vitest"` | **Adjust**: install `@stryker-mutator/vitest-runner` (or the jest one) at the same major version as `@stryker-mutator/core`. |
| Phase 1 | Initial test run fails inside Stryker | **Retry**: run the suite normally first; fix config such as `vitest.configFile` or `jest.configFile` per the plugin docs. |
| Phase 3 | Killing test fails on the original | **Stop**: test or code is wrong; return to red with the requirement. |
| Phase 3 | Requirement silent about the mutated behavior | **Return**: record an open question; not equivalent. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
