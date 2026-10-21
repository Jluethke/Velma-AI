# TDD Node Coverage With c8 and Istanbul

**One-line description:** Measures statement, branch, function and line coverage for a JavaScript or TypeScript suite with the right provider for the runner (Jest istanbul or v8, Vitest coverage-v8 or coverage-istanbul, c8 for node --test), reads the Uncovered Line # column and lcov HTML, and maps gaps to behaviors.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `refactored_code` (object, required): Files and suite result from `tdd-refactor-under-green`.
- `test_runner` (string, required): `jest`, `vitest` or `node-test` (the built-in `node --test` runner).
- `coverage_floor` (number, optional): A minimum percentage set by the user or project policy. When absent, no threshold is applied.

---

## Outputs

- `coverage_report` (object): Provider used, totals for % Stmts, % Branch, % Funcs, % Lines, per-file uncovered lines, and report paths (`coverage/lcov-report/index.html` or `coverage/index.html`, `coverage/lcov.info`).
- `uncovered_lines` (object[]): Each uncovered line or branch with file, line, classification and action.

---

## Phase 1: Pick Provider and Run

### Entry Criteria
- Full suite green.

### Actions
1. Choose by `test_runner`:

| test_runner | Install | Run | Provider note |
|---|---|---|---|
| jest | nothing extra | `npx jest --coverage` | default `coverageProvider: "babel"` instruments with istanbul; set `"v8"` in config for native V8 coverage |
| vitest | `npm install --save-dev @vitest/coverage-v8` (or `@vitest/coverage-istanbul`) | `npx vitest run --coverage` | set `test.coverage.provider` to `'v8'` (default) or `'istanbul'`; the package version must match the `vitest` version |
| node-test | `npm install --save-dev c8` | `npx c8 --reporter=text --reporter=lcov node --test` | c8 reads V8's built-in coverage; Node 20+ also has the experimental `--experimental-test-coverage` flag |

2. Include files that no test imports, or they are invisible:
   - Jest: `collectCoverageFrom: ["src/**/*.{js,ts}", "!src/**/*.d.ts"]`.
   - Vitest: `test.coverage.include: ['src/**']` (check the Vitest coverage docs for the installed major version; the defaults for `all` and `include` changed across majors).
   - c8: `--all --src src` (check `npx c8 --help`).
3. Exclude test files, generated code and type declarations from coverage (Jest `coveragePathIgnorePatterns`, Vitest `test.coverage.exclude`, c8 `--exclude`).

### Output
Text table and `coverage/` folder.

### Quality Gate
- The text table lists a file from `src/` that has no tests (proves untested files are included), or every source file appears.
- `coverage/lcov.info` exists.

---

## Phase 2: Read the Table

### Entry Criteria
- Coverage table printed.

### Actions
1. Read the istanbul-style table: `File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s`.
   - `% Branch` counts each side of `if`, `?:`, `&&`, `||`, `??`, default parameters and `switch` cases.
   - `Uncovered Line #s` lists lines never run, with ranges like `40-44`.
   - A line can be fully "covered" while one branch on it never ran; open `coverage/lcov-report/index.html` (Jest, c8) or `coverage/index.html` (Vitest) and look for yellow highlighting and the `I`/`E` markers (if-path or else-path not taken).
2. Note V8 versus istanbul differences: V8 coverage counts at the byte-code level and can report slightly different branch numbers than istanbul for the same code. Compare runs only with the same provider.
3. Copy every uncovered line and every uncovered branch marker for files in `refactored_code` into `uncovered_lines`.

### Output
Draft `uncovered_lines`.

### Quality Gate
- Each file in `refactored_code` with less than full branch coverage has at least one entry in `uncovered_lines`.

---

## Phase 3: Classify, Act and Check the Floor

### Entry Criteria
- Draft list exists.

### Actions
1. Classify each entry: missing behavior (requirement covers it: add a behavior row and go to red), dead code (delete under green), defensive only (keep; an `/* istanbul ignore next */` or `/* c8 ignore next */` comment only if project policy allows), or excluded (generated or platform code: add to the exclude config).
2. Do not write tests that call code without asserting the result. Stryker (`tdd-node-stryker`) will flag them.
3. If `coverage_floor` is given, enforce it with the runner's own setting and record the exit code:
   - Jest: `coverageThreshold: { global: { branches: <floor>, lines: <floor> } }`.
   - Vitest: `test.coverage.thresholds: { lines: <floor>, branches: <floor> }`.
   - c8: `npx c8 --check-coverage --lines <floor> --branches <floor> node --test`.
   If not given, report the totals with no verdict.

### Output
`coverage_report`, `uncovered_lines`.

### Quality Gate
- Every entry in `uncovered_lines` has a classification and action.
- Threshold settings use only `coverage_floor`; no other number was introduced.

---

## Worked Example

Illustrative only. `test_runner` = `vitest`, provider v8.

```
$ npx vitest run --coverage
 % Coverage report from v8
-------------|---------|----------|---------|---------|-------------------
File         | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------|---------|----------|---------|---------|-------------------
All files    |   91.66 |    83.33 |     100 |   91.66 |
 discount.ts |   91.66 |    83.33 |     100 |   91.66 | 18-19
-------------|---------|----------|---------|---------|-------------------
```

Phase 3: lines 18-19 return 0 for a negative subtotal. Requirement: "subtotals below zero are invalid" means a thrown `RangeError`, not 0. Missing behavior, plus a likely bug: new row B07 goes to red.

---

## Exit Criteria

DONE when coverage is measured with a provider that matches the runner, untested files are included, every gap is classified with an action, and any threshold came from `coverage_floor`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `MISSING DEPENDENCY  Cannot find dependency '@vitest/coverage-v8'` | **Adjust**: install the provider package at the same version as `vitest`. |
| Phase 1 | Table lists only files with tests | **Adjust**: set `collectCoverageFrom` / `coverage.include` / `--all`. |
| Phase 2 | Numbers change after switching provider | **Adjust**: pick one provider and compare only within it. |
| Phase 3 | Floor not met | **Return**: report the totals and the classified gaps; do not lower the floor or add ignore comments to pass. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
