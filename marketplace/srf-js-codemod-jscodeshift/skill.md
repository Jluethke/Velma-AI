# JavaScript and TypeScript Codemod with jscodeshift

**One-line description:** Writes a jscodeshift transform for one mechanical, behavior-preserving rewrite, tests it first with input and output fixtures through `defineTest`, dry-runs it on the codebase with `--dry --print`, applies it per directory, and commits each batch with typecheck and tests green.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Project root.
- `test_command` (string, required): Full suite command.
- `baseline_commit` (string, required): From `srf-baseline-green-check`.
- `codemod_spec` (object, required): The rewrite as before and after examples plus exclusions, for example `{"before": "import { get } from 'lodash'; get(o, 'a.b')", "after": "o?.a?.b", "only_when": "path is a string literal with identifier segments"}`.
- `source_root` (string, required): Directory to transform, for example `src`.

---

## Outputs

- `step_commits` (string[]): SHAs: transform tests (kept outside the product code or in a `codemods/` folder the user approves), then one per applied batch.
- `step_log` (object[]): Per batch: files ok, unmodified, skipped, errors from the jscodeshift summary, results, SHA.

---

## Phase 1: Specify and Check Equivalence

### Entry Criteria
- `git status --porcelain` empty.

### Actions
1. Write down the exact AST pattern: node type (`CallExpression`, `ImportDeclaration`, `MemberExpression`), callee name, argument count and kinds. Use https://astexplorer.net with the `recast` printer and the parser matching the code (`babel`, `tsx`) to see node shapes. Do NOT guess node type names.
2. State the equivalence conditions. Use this table for common traps:

| Rewrite | Equivalent only when |
|---|---|
| `_.get(o, 'a.b')` to `o?.a?.b` | Path is a literal with plain segments; no default argument; `o` is not `null` treated differently (both give `undefined`) |
| `Object.assign({}, a, b)` to `{...a, ...b}` | First argument is a fresh `{}` literal; getters on `a` are acceptable to invoke either way |
| `arr.indexOf(x) !== -1` to `arr.includes(x)` | `x` can never be `NaN` (`includes` finds `NaN`, `indexOf` does not) |
| `function` callback to arrow | Body does not use `this`, `arguments`, `new.target`, or `super` |
| Default import to named import | The module's default export is the same binding as the named one |

3. Any case not meeting the condition must be left unmodified by the transform (return `undefined` or skip the node), never "best-effort" rewritten.

### Output
Pattern description and equivalence conditions.

### Quality Gate
- Every condition from the table that applies is written as a check the transform will perform.

---

## Phase 2: Write and Test the Transform

### Entry Criteria
- Phase 1 complete.

### Actions
1. Create `codemods/lodash-get-to-optional-chain.js` (or under `.refactor/` if the user does not want it committed):
```js
module.exports = function transform(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  let changed = false;
  root.find(j.CallExpression, { callee: { object: { name: "_" }, property: { name: "get" } } })
    .filter((p) => p.node.arguments.length === 2 && p.node.arguments[1].type === "StringLiteral"
      && /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(p.node.arguments[1].value))
    .replaceWith((p) => {
      changed = true;
      const [obj, path] = p.node.arguments;
      return path.value.split(".").reduce(
        (acc, key) => j.optionalMemberExpression(acc, j.identifier(key), false, true), obj);
    });
  return changed ? root.toSource({ quote: "single" }) : undefined;
};
module.exports.parser = "tsx";
```
   With the `tsx` parser string literals are `StringLiteral`; with `babel` they may be `Literal`. Check in astexplorer with the same parser.
2. Fixtures: `codemods/__testfixtures__/lodash-get-to-optional-chain.input.ts` and `.output.ts`, covering one positive case and every negative case from Phase 1 (default argument, computed path, array index path).
3. Test: `codemods/__tests__/lodash-get-to-optional-chain.test.js` with
   `const { defineTest } = require("jscodeshift/dist/testUtils"); defineTest(__dirname, "lodash-get-to-optional-chain", null, "lodash-get-to-optional-chain", { parser: "tsx" });`
   Run with the project's Jest or `npx jest codemods`. Check the `defineTest` argument order in the jscodeshift README for your version.
4. Do NOT apply the transform to the codebase until the fixture test passes.

### Output
Transform plus passing fixture test.

### Quality Gate
- Fixture test exits 0.
- The negative fixtures appear unchanged in the `.output.ts` file.

---

## Phase 3: Dry Run, Apply in Batches, Commit

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Dry run: `npx jscodeshift -t codemods/lodash-get-to-optional-chain.js src --extensions=ts,tsx --parser=tsx --dry --print > /tmp/codemod-dry.txt`. Read the summary at the end: `Results: 0 errors, 412 unmodified, 0 skipped, 23 ok`.
2. Any `errors` count above 0: read the error lines (parse failures). Fix the parser choice or exclude those files with `--ignore-pattern`; do not proceed with errors.
3. Apply one directory at a time: `npx jscodeshift -t codemods/lodash-get-to-optional-chain.js src/pricing --extensions=ts,tsx --parser=tsx`.
4. Run the formatter on changed files only: `npx prettier --write $(git diff --name-only)`.
5. Run `npx tsc --noEmit`, the characterization tests (no snapshot update), `test_command`, and the API check.
6. Green: `git commit -am "refactor(codemod): lodash get to optional chaining in src/pricing"`. Red: `git checkout -- src/pricing`, add a failing case as a fixture, fix the transform, rerun Phase 2.
7. When all directories are done, remove the now-unused import if the transform did not (a second, small transform or by hand), and check `npx jscodeshift ... --dry` reports `0 ok` (nothing left to change).

### Output
`step_commits`, `step_log`.

### Quality Gate
- Each batch commit passes `tsc`, tests and API check.
- Final dry run shows `0 ok` and `0 errors`.
- `git status --porcelain` empty.

---

## Worked Example

Illustrative only.
```
$ npx jest codemods
PASS codemods/__tests__/lodash-get-to-optional-chain.test.js
$ npx jscodeshift -t codemods/lodash-get-to-optional-chain.js src --extensions=ts,tsx --parser=tsx --dry
Results:
0 errors
412 unmodified
0 skipped
23 ok
$ npx jscodeshift -t codemods/lodash-get-to-optional-chain.js src/pricing --extensions=ts,tsx --parser=tsx
$ npx tsc --noEmit && npx jest --ci
Tests:       61 passed, 61 total
```

---

## Exit Criteria

DONE when the transform is fixture-tested including negative cases, applied in green per-directory commits, and a final dry run finds nothing left.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Equivalence condition cannot be checked statically | **Stop**: leave those sites for manual review; transform only the provable ones. |
| Phase 2 | Fixture output differs only in formatting | **Adjust**: pass printer options to `toSource` or format fixtures with the project formatter. |
| Phase 3 | Parse errors in some files | **Adjust**: switch `--parser` (`ts` for files with `<T>` casts, `tsx` for JSX) or run separate passes per extension. |
| Phase 3 | Tests fail in a batch | **Retry**: revert the batch, add the case to fixtures, fix the transform. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
