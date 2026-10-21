# fast-check Arbitraries and Property Tests

**One-line description:** Turns each JavaScript or TypeScript row of the property catalog into a fast-check arbitrary and an `fc.assert(fc.property(...))` test under Jest or Vitest, using constructive arbitraries instead of `.filter`, and proves each test can fail with a recorded `seed` and `path`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `property_catalog` (object[], required): Rows from `pft-invariant-discovery`.
- `repo_path` (string, required): Root containing `package.json`.

---

## Outputs

- `node_property_tests` (object[]): One row per test: catalog `id`, file, arbitrary expression, test runner, mutation used to prove it fails, and the `seed` and `path` printed for that failure.

---

## Phase 1: Install and Pick the Runner Binding

### Entry Criteria
- `package.json` exists and the project test command runs (`npm test` exits 0 before changes).

### Actions
1. Detect the runner from `package.json` `devDependencies`:

| Found | Install | Test style |
|---|---|---|
| `vitest` | `npm i -D fast-check @fast-check/vitest` | `import { test, fc } from '@fast-check/vitest'; test.prop([fc.integer()])('name', (n) => {...})` |
| `jest` | `npm i -D fast-check @fast-check/jest` | `import { test, fc } from '@fast-check/jest'; test.prop([fc.integer()])('name', (n) => {...})` |
| `node:test` or mocha | `npm i -D fast-check` | `test('name', () => { fc.assert(fc.property(fc.integer(), (n) => {...})); })` |

Use the lockfile's manager (`pnpm add -D`, `yarn add -D`) when `pnpm-lock.yaml` or `yarn.lock` exists.
2. Confirm: `node -e "console.log(require('fast-check/package.json').version)"`. If the project is ESM-only and `require` fails, use `npm ls fast-check`.

### Output
Installed versions and the chosen test style.

### Quality Gate
- `npm ls fast-check` prints one resolved version with no `UNMET` or `invalid` marker.

---

## Phase 2: Map Domains to Arbitraries

### Entry Criteria
- fast-check installed.

### Actions
1. Choose arbitraries from this table. Only use names listed here or found in the fast-check API docs for the installed major version.

| Domain | Arbitrary |
|---|---|
| Bounded integer | `fc.integer({ min, max })`; 64-bit values use `fc.bigInt({ min, max })` |
| Float without NaN | `fc.double({ noNaN: true, noDefaultInfinity: true })` or `fc.float({ noNaN: true })` |
| String | `fc.string({ minLength, maxLength })`; full Unicode with `fc.string({ unit: 'grapheme' })` on fast-check 4, `fc.fullUnicodeString()` on fast-check 3 (check your major version) |
| Array, unique array | `fc.array(arb, { minLength, maxLength })`, `fc.uniqueArray(arb, { selector })` |
| Object with fixed keys | `fc.record({ id: fc.uuid(), qty: fc.nat() })` |
| Tuple | `fc.tuple(a, b)` |
| Fixed choices | `fc.constantFrom('a', 'b')` |
| Union | `fc.oneof(a, b)` |
| Optional value | `fc.option(arb)` (yields `null`) |
| Recursive structure | `fc.letrec(tie => ({ node: fc.oneof({ depthSize: 'small' }, leaf, fc.array(tie('node'))) }))` |
| JSON value | `fc.json()` (string) or `fc.jsonValue()` (value) |
| Dependent values | `arb.chain(v => ...)`; shrinks worse than independent draws, so prefer `fc.tuple` plus `.map` when possible |

2. Constructive rule: produce valid inputs with `.map` (for example even numbers: `fc.integer().map(n => n * 2)`). Use `.filter` or `fc.pre(cond)` only when the condition rejects a small share of values, and write why.
3. Take size limits from the catalog `input_domain`. If the catalog leaves a limit open, omit it (fast-check default) and record the open question.

### Output
Arbitrary per catalog row.

### Quality Gate
- Every arbitrary name used is in the table or cited from the docs of the installed major version.
- Every `.filter` or `fc.pre` has a written justification.

---

## Phase 3: Write, Run and Mutation-Check

### Entry Criteria
- Arbitraries chosen.

### Actions
1. Create `test/property/<module>.prop.test.ts` (match the project's existing test glob in `vitest.config.*` or `jest.config.*`). Write one test, run it, then the next.
2. Shape with plain `fc.assert`:

```ts
import fc from 'fast-check';
import { encode, decode } from '../../src/varint';

test('P1 round-trip', () => {
  fc.assert(
    fc.property(fc.bigInt({ min: 0n, max: 2n ** 64n - 1n }), (n) => {
      const bytes = encode(n);
      expect(decode(bytes)).toEqual({ value: n, length: bytes.length });
    }),
    { examples: [[0n], [2n ** 64n - 1n]] }   // explicit edge cases from the catalog
  );
});
```

3. Async code uses `fc.asyncProperty` and `await fc.assert(...)`. Forgetting `await` makes the test pass without running; check the run count in the failure test below.
4. Run `npx vitest run test/property` or `npx jest test/property`.
5. Apply one temporary mutation to the target per test. The run must fail and print a block like:

```text
Property failed after 2 tests
{ seed: -1819918769, path: "1:0:0", endOnFailure: true }
Counterexample: [128n]
Shrunk 3 time(s)
```

6. Record `seed` and `path`; replay with `fc.assert(prop, { seed: -1819918769, path: "1:0:0", endOnFailure: true })` to confirm it fails the same way.
7. Revert the mutation (`git checkout -- <file>`), rerun, confirm green.

### Output
`node_property_tests`.

### Quality Gate
- `npx vitest run test/property` (or jest) exits 0 on the unmodified target.
- Every test has a recorded mutation, `seed` and `path` that reproduced the failure on replay.
- `git diff -- src/` is empty at the end.

---

## Worked Example

Illustrative. Catalog row P2: `slugify(slugify(s)) === slugify(s)` (idempotence).

```ts
test.prop([fc.string({ maxLength: 50 })])('P2 slugify idempotent', (s) => {
  expect(slugify(slugify(s))).toBe(slugify(s));
});
```

The length 50 came from the catalog (`input_domain: title up to 50 chars`, product spec). Mutation: remove the trailing-dash trim.

```text
Property failed after 6 tests
{ seed: 1427812633, path: "5:1:0:0", endOnFailure: true }
Counterexample: ["a "]
Shrunk 4 time(s)
Got error: expected 'a' to be 'a-'
```

Row: `{id: P2, arbitrary: "fc.string({maxLength: 50})", runner: vitest, mutation: "drop trailing dash trim", seed: 1427812633, path: "5:1:0:0"}`.

---

## Exit Criteria

DONE when each JavaScript or TypeScript catalog row has a passing fast-check test, each was killed by a recorded mutation with a replayable seed and path, and the target source is unchanged.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `@fast-check/vitest` peer dependency mismatch | **Adjust**: install the binding version whose peer range matches the project's vitest, or use plain `fc.assert`. |
| Phase 2 | Arbitrary name not found in the installed version | **Adjust**: check the fast-check migration guide for the renamed API; do not guess a name. |
| Phase 3 | Real failure before mutation | **Return**: record seed, path and counterexample for `pft-shrinking-reproduction`; do not loosen the assertion. |
| Phase 3 | Test passes under mutation | **Adjust**: strengthen the property; check for a missing `await` on async properties. |
| Phase 3 | Test times out | **Adjust**: reduce `numRuns` only through a documented project setting, or bound sizes from the catalog; report if neither applies. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
