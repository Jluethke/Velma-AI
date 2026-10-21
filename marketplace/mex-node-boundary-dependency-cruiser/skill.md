# Node Boundary Enforcement with dependency-cruiser

**One-line description:** Encodes the module boundary as dependency-cruiser `forbidden` rules in `.dependency-cruiser.js` so only the candidate's public entry file can be imported from outside and the candidate cannot import other domains, freezes today's violations with a known-violations baseline, and runs the check in CI.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Monolith working tree.
- `module_interface` (object, required): From `mex-interface-boundary-contract`; names the public entry file (for example `src/billing/api.ts`).

---

## Outputs

- `node_boundary_rules` (object): Config file path, rule names with `from` and `to` paths, the known-violations file path and entry count, the `depcruise` summary line, and the CI step.

---

## Phase 1: Initialize and Write Rules

### Entry Criteria
- `stack` is `node`.

### Actions
1. Install as a dev dependency: `npm install --save-dev dependency-cruiser` (or the `pnpm add -D` / `yarn add -D` equivalent matching the lockfile).
2. If no config exists, generate one: `npx depcruise --init`. It writes `.dependency-cruiser.js` (or `.cjs`) with default rules such as `no-circular` and `no-orphans`. Keep the defaults.
3. Add two rules to the `forbidden` array. Paths are regular expressions matched against file paths relative to the cruise root:
   ```js
   {
     name: 'billing-internals-private',
     severity: 'error',
     comment: 'Outside code may import only src/billing/api.ts',
     from: { pathNot: '^src/billing/' },
     to: { path: '^src/billing/', pathNot: '^src/billing/api\\.ts$' }
   },
   {
     name: 'billing-no-other-domains',
     severity: 'error',
     from: { path: '^src/billing/' },
     to: { path: '^src/(orders|catalog|admin)/' }
   }
   ```
4. If the repo uses TypeScript path aliases, confirm `options.tsConfig.fileName` in the config points at the tsconfig that defines them, otherwise aliased imports are not resolved and the rules silently miss them.

### Output
Updated `.dependency-cruiser.js`.

### Quality Gate
- `npx depcruise src --config .dependency-cruiser.js --output-type err` runs to completion and prints a summary (violations allowed at this point).
- `npx depcruise src --config .dependency-cruiser.js --output-type json | jq '.summary.totalCruised'` is greater than zero.

---

## Phase 2: Baseline Existing Violations

### Entry Criteria
- Rules run.

### Actions
1. Run the check and read each violation: `npx depcruise src --config .dependency-cruiser.js --output-type err`.
2. Fix what can be fixed one importer file per commit by routing to `src/billing/api.ts`; run the test command after each.
3. Freeze the rest so new violations still fail: `npx depcruise src --config .dependency-cruiser.js --output-type baseline --output-to .dependency-cruiser-known-violations.json`. Then add `--ignore-known` to the check command. Check `npx depcruise --help` for the exact option names in the installed version before relying on them.
4. Do not lower `severity` to `warn` or `info`, and do not delete rules, to get a green run.

### Output
A passing check with a known-violations file.

### Quality Gate
- `npx depcruise src --config .dependency-cruiser.js --ignore-known --output-type err` exits 0.
- `jq length .dependency-cruiser-known-violations.json` is recorded and equals the unfixed count.

---

## Phase 3: CI and Mutation Check

### Entry Criteria
- Local check passes.

### Actions
1. Add a script to `package.json`: `"depcruise": "depcruise src --config .dependency-cruiser.js --ignore-known --output-type err"`. Add `npm run depcruise` to the existing CI workflow after install.
2. Mutation check on a scratch branch: add `import { InvoiceRepo } from '../billing/store/invoice.repo';` to an orders file, run `npm run depcruise`, confirm it fails with rule `billing-internals-private`, delete the branch.
3. Record results in `node_boundary_rules`.

### Output
`node_boundary_rules`.

### Quality Gate
- The mutation run exited non-zero and named `billing-internals-private`.
- `rg -n "depcruise" .github/workflows package.json` shows both the script and the CI step.

---

## Worked Example

Illustrative.

```
$ npx depcruise src --config .dependency-cruiser.js --output-type err
  error billing-internals-private: src/orders/order.service.ts -> src/billing/entities/invoice.entity.ts
  error billing-internals-private: src/admin/report.controller.ts -> src/billing/store/invoice.repo.ts
  error no-circular: src/billing/invoice.service.ts -> src/orders/order.service.ts -> src/billing/invoice.service.ts
x 3 dependency violations (3 errors, 0 warnings). 512 modules, 1904 dependencies cruised.
```
`order.service.ts` fixed (uses `BillingApi`), which also removes the cycle. `report.controller.ts` frozen in the baseline. Re-run with `--ignore-known`: `no dependency violations found`.

---

## Exit Criteria

DONE when the boundary rules pass in CI with only baselined exceptions, and a new forbidden import fails the check.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Rule matches nothing because paths are absolute or prefixed differently | **Adjust**: print one module path with `--output-type json | jq '.modules[0].source'` and write the regex to match that form. |
| Phase 1 | Monorepo with packages importing `@acme/billing` by package name | **Adjust**: add a `to: { path: 'node_modules/@acme/billing/(?!dist/api)' }` style rule or check the dependency-cruiser docs for workspace resolution. |
| Phase 2 | `--ignore-known` not recognized | **Stop**: read `npx depcruise --help` for the installed version; upgrade only with the user's approval. |
| Phase 3 | CI passes but the mutation also passes | **Retry**: the CI command lacks `--config`; fix the script. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
