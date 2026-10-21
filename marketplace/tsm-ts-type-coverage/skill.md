# TypeScript Type Coverage Measurement

**One-line description:** Measures the share of identifiers whose type is not `any` with the `type-coverage` CLI in strict mode, saves the list of every remaining `any` location, and records the number the CI ratchet will compare against.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `migration_profile` (object, required): From `tsm-migration-intake`; supplies `package_manager` and `config_file`.

---

## Outputs

- `ts_type_coverage` (object): `typed` and `total` identifier counts, `percent` (as printed by the tool), `tool_version`, the exact command used, `by_file` (count of `any` locations per file, sorted descending), and the path of the saved detail log.

---

## Phase 1: Install and Run type-coverage

### Entry Criteria
- A `tsconfig.json` exists. For a JavaScript-only repo this flow runs after `tsm-ts-allowjs-checkjs` creates one; before that, record coverage as not applicable.

### Actions
1. Add the tool pinned as a dev dependency: `npm install --save-dev --save-exact type-coverage` (pnpm: `pnpm add -D -E type-coverage`; yarn: `yarn add -D -E type-coverage`). Never run it only through an unpinned `npx` download; the number must be reproducible in CI.
2. Run `npx type-coverage --help` and confirm these flags appear in the help text before using them: `-p`, `--detail`, `--strict`, `--at-least`, `--ignore-files`, `--ignore-catch`. If one is missing in the installed version, do not use it.
3. Run the measurement:
   `npx type-coverage -p tsconfig.json --strict --detail > .typecheck-logs/type-coverage.txt 2>&1`
   `--strict` also counts `as` type assertions and non-null assertions as untyped, and treats `any` inside generics (for example `Promise<any>`) as untyped. Use it from the start; switching modes later changes the number and breaks the ratchet.
4. Exclude generated files only, never hand-written code: if the repo has generated code (for example `src/generated/**`), add `--ignore-files "src/generated/**"`. Record every ignore pattern.
5. Read the output. The detail lines name each untyped identifier as `path/file.ts:LINE:COL: name`. The summary line is `<typed> / <total> <percent>%`. Copy `typed`, `total` and `percent` exactly.

### Output
Coverage numbers and detail log.

### Quality Gate
- `type-coverage` appears in `devDependencies` with an exact version (no `^` or `~`).
- The summary line in `.typecheck-logs/type-coverage.txt` contains the recorded numbers verbatim.
- The command string recorded in `ts_type_coverage` reproduces the same numbers when run twice in a row.

---

## Phase 2: Rank the any Locations

### Entry Criteria
- Phase 1 log exists.

### Actions
1. Count untyped locations per file:
   `grep -E "^[^ ]+:[0-9]+:[0-9]+:" .typecheck-logs/type-coverage.txt | cut -d: -f1 | sort | uniq -c | sort -rn > .typecheck-logs/any-by-file.txt`
2. For the top files, open each listed line and classify the cause with this table (record the class next to each file):

   | What you see at the line | Class | Fixed by |
   |---|---|---|
   | `: any` written in source | explicit | `tsm-ts-eliminate-any` |
   | `as Foo` or `x!` | assertion | `tsm-ts-eliminate-any` |
   | Value from `JSON.parse`, `res.json()`, `require()` of an untyped module | boundary | `tsm-ts-zod-boundaries` or `tsm-ts-declaration-files` |
   | Parameter with no annotation in a `.js` file | implicit | `tsm-ts-convert-file`, then `tsm-ts-noimplicitany` |
   | Value typed from an `@types` package that itself says `any` | library | leave; note in `by_file` |

3. Record `by_file` and the class counts.

### Output
`ts_type_coverage`.

### Quality Gate
- The sum of the per-file counts equals `total - typed`.
- Every file in the top list carries a class from the table.

---

## Worked Example

Illustrative only. Repo with `src/` in TypeScript and `src/generated/api.ts` produced by an OpenAPI generator.

Phase 1:
```
$ npx type-coverage -p tsconfig.json --strict --detail --ignore-files "src/generated/**"
src/routes/orders.ts:31:9: body
src/routes/orders.ts:32:22: items
src/lib/cache.ts:14:5: value
...
18342 / 19970 91.84%
```
Recorded: `typed=18342`, `total=19970`, `percent=91.84`.

Phase 2: `any-by-file.txt` starts `212 src/routes/orders.ts`, `140 src/lib/cache.ts`. `orders.ts` line 31 is `const body = req.body` (boundary, Express types `req.body` as `any`); `cache.ts` line 14 is `value: any` (explicit).

---

## Exit Criteria

DONE when the pinned tool produced reproducible numbers, every ignore pattern is listed, and the per-file ranking is classified.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Tool reports tsconfig errors or zero files | **Adjust**: pass the correct `-p` path from `migration_profile.config_file`; confirm with `npx tsc --listFilesOnly -p tsconfig.json`. |
| Phase 1 | Numbers differ between two identical runs | **Stop**: find the nondeterminism (a cache directory or a changing generated file) before recording. |
| Phase 1 | Someone proposes ignoring hand-written files to raise the number | **Stop**: coverage of hand-written code is the thing being measured. |
| Phase 2 | Per-file sum does not match | **Retry**: the grep pattern missed lines; inspect a few raw lines and fix the pattern. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
