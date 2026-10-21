# Node and TypeScript Import Graph with madge

**One-line description:** Builds the JavaScript or TypeScript module graph with madge, resolving tsconfig path aliases, then lists every import that crosses the candidate module's boundary in both directions, every circular dependency through it, and every import madge cannot resolve statically.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Monolith working tree.
- `extraction_brief` (object, required): From `mex-extraction-candidate-brief`; supplies `candidate_module` (for example `src/billing`).

---

## Outputs

- `node_import_graph` (object): `source_root`, `candidate_dir`, `inbound_edges` and `outbound_edges` as `importer -> imported` file pairs with the import line, `circular_through_candidate`, `unresolved_or_dynamic`, and the raw graph JSON path.

---

## Phase 1: Configure madge for This Repo

### Entry Criteria
- `extraction_brief.stack` == `node`.
- `node_modules` is installed (`npm ci`, `pnpm install --frozen-lockfile` or `yarn install --immutable`, whichever lockfile exists).

### Actions
1. Pick the flags from this table. Read `tsconfig.json` and `package.json` to decide; do not guess.

   | Repo has | Add flag |
   |---|---|
   | TypeScript (`tsconfig.json`) | `--extensions ts,tsx,js,jsx --ts-config tsconfig.json` |
   | `compilerOptions.paths` aliases such as `@billing/*` | the `--ts-config` flag above is required, or aliases appear as unresolved |
   | webpack `resolve.alias` | `--webpack-config webpack.config.js` |
   | Plain JS with ESM and CJS | `--extensions js,mjs,cjs` |
   | Generated or vendored dirs | `--exclude '^(dist|build|coverage|generated)/'` |

2. Run madge from the repo root against the source root (usually `src`): `npx madge --json <flags> src > /tmp/mex_madge.json`. `npx madge` fetches madge without adding it to `package.json`; do not run `npm install madge --save`.
3. Run the warning pass to see what madge skipped: `npx madge --warning <flags> src`. Copy every "skipped" file into `unresolved_or_dynamic`.
4. Run the circular pass: `npx madge --circular <flags> src > /tmp/mex_circular.txt`.

### Output
`/tmp/mex_madge.json`, the warning list, the circular list.

### Quality Gate
- `jq 'keys | length' /tmp/mex_madge.json` prints a number greater than zero.
- `jq 'keys[]' /tmp/mex_madge.json | grep -c '^"billing/'` (replace with the candidate dir relative to the source root) is greater than zero. If zero, the base dir or extensions are wrong.

---

## Phase 2: List Boundary-Crossing Edges

### Entry Criteria
- Graph JSON exists. madge keys are paths relative to the directory passed (for `src`, a key looks like `billing/invoice.service.ts`).

### Actions
1. Inbound edges (outside file imports a candidate file):
   ```
   jq -r --arg c "billing/" 'to_entries[] | select(.key|startswith($c)|not) | .key as $k | .value[] | select(startswith($c)) | "\($k) -> \(.)"' /tmp/mex_madge.json | sort > /tmp/mex_inbound.txt
   ```
2. Outbound edges (candidate file imports an outside file):
   ```
   jq -r --arg c "billing/" 'to_entries[] | select(.key|startswith($c)) | .key as $k | .value[] | select(startswith($c)|not) | "\($k) -> \(.)"' /tmp/mex_madge.json | sort > /tmp/mex_outbound.txt
   ```
3. For each edge, attach the import line: `rg -n "from ['\"].*billing|require\(['\"].*billing" src/<importer>`. Record file, line number and text.
4. Find imports madge cannot see: `rg -n "import\(\s*[^'\"]|require\(\s*[^'\"]" src` (dynamic `import()` or `require()` with a variable), and DI or string lookups such as NestJS `@Inject('BILLING_SERVICE')` or `moduleRef.get(`. Add hits to `unresolved_or_dynamic`.
5. From `/tmp/mex_circular.txt`, keep only cycles that contain a candidate file; store them in `circular_through_candidate`.

### Output
Edge lists with import lines, cycles, unresolved sites.

### Quality Gate
- `wc -l /tmp/mex_inbound.txt /tmp/mex_outbound.txt` matches the lengths of `inbound_edges` and `outbound_edges`.
- Every edge has a line number found by `rg`, or is tagged `line_not_found` with the reason.

---

## Phase 3: Summarize

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Count inbound edges per imported candidate file. Files imported from outside are the de facto public API; an `index.ts` barrel with most inbound edges is the natural facade.
2. Count outbound edges per imported outside directory. Edges into `shared/`, `common/`, `utils/` or `models/` are tagged `shared_kernel_candidate`.
3. Tag inbound edges from `*.spec.ts`, `*.test.ts` or `__tests__/` as `test_only`.
4. Write `node_import_graph`.

### Output
`node_import_graph`.

### Quality Gate
- Grouped counts sum to the edge list lengths.

---

## Worked Example

Illustrative. Candidate `src/billing` in a NestJS TypeScript app with `paths: {"@billing/*": ["src/billing/*"]}`.

```
$ npx madge --json --extensions ts --ts-config tsconfig.json --exclude '^(dist|generated)/' src > /tmp/mex_madge.json
$ jq 'keys | length' /tmp/mex_madge.json
512
$ wc -l /tmp/mex_inbound.txt /tmp/mex_outbound.txt
  41 /tmp/mex_inbound.txt
  17 /tmp/mex_outbound.txt
$ npx madge --circular --extensions ts --ts-config tsconfig.json src
1) billing/invoice.service.ts > orders/order.service.ts > billing/invoice.service.ts
```
Inbound top file: `billing/entities/invoice.entity.ts` (19 importers, TypeORM entity used directly by orders and admin). Unresolved: `src/app.module.ts:22 moduleRef.get('BILLING_GATEWAY')`.

---

## Exit Criteria

DONE when `node_import_graph` lists every madge-visible boundary edge with its import line, every cycle through the candidate and every dynamic or string-based reference.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Aliased imports show as skipped | **Adjust**: add `--ts-config` pointing at the tsconfig that defines `paths`; for a monorepo use the package-level tsconfig. |
| Phase 1 | madge exits with a parse error on new syntax | **Adjust**: check `npx madge --help` and the madge README for the detective options of the installed version; do not edit source files to make madge parse. |
| Phase 2 | Inbound count is zero but the brief lists callers | **Retry**: the prefix is wrong; print `jq 'keys[0:5]'` and match the key format. |
| Phase 3 | Barrel file hides real dependencies | **Adjust**: also list which symbols each importer pulls from the barrel with `rg -n "import \{[^}]*\} from ['\"]@billing"`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
