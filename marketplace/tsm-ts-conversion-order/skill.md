# TypeScript Conversion Order from the Import Graph

**One-line description:** Builds the module import graph with madge, collapses import cycles into single units, and emits a leaf-first order so each file is converted only after every file it imports already has real types.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `migration_profile` (object, required): From `tsm-migration-intake`; supplies `source_roots` and `config_file`.

---

## Outputs

- `ts_conversion_order` (object[]): Ordered list of units. Each unit has `files` (one file, or every file of one import cycle), `depth` (0 for files that import no other project file), `importers` (count of project files that import it), `status` (`js` or `ts`).

---

## Phase 1: Extract the Import Graph

### Entry Criteria
- `migration_profile.source_roots` is non-empty.

### Actions
1. Install madge pinned: `npm install --save-dev --save-exact madge`.
2. Run `npx madge --help` and confirm `--json`, `--circular`, `--extensions` and `--ts-config` are listed.
3. Export the graph for all source roots and all script extensions:
   `npx madge --extensions js,jsx,ts,tsx,mjs,cjs --ts-config tsconfig.json --json src > .typecheck-logs/deps.json`
   If there is no tsconfig yet, omit `--ts-config`. If the project uses path aliases (`compilerOptions.paths` or a webpack/vite alias) and there is no tsconfig, alias imports will be missing from the graph; record that as a known gap.
4. The JSON maps each file (relative to the root passed) to the list of files it imports. Confirm it is not empty: `node -e "const g=require('./.typecheck-logs/deps.json');console.log(Object.keys(g).length)"` prints the file count.
5. List cycles: `npx madge --extensions js,jsx,ts,tsx --circular src > .typecheck-logs/cycles.txt`. Each numbered line is one cycle, for example `1) a.js > b.js > a.js`.

### Output
`deps.json` and `cycles.txt`.

### Quality Gate
- The file count printed in step 4 equals `git ls-files src | grep -E "\.(js|jsx|ts|tsx|mjs|cjs)$" | wc -l` minus any files madge reports as skipped. Investigate any other difference.
- `cycles.txt` exists (it may say no circular dependency found).

---

## Phase 2: Compute the Leaf-First Order

### Entry Criteria
- Phase 1 outputs exist.

### Actions
1. Merge every cycle into one unit: all files in one cycle convert together in one commit, because none of them can be typed before the others.
2. Assign depth by repeatedly peeling leaves. Run this one-liner. When only cycles remain it releases the file with the fewest unmet imports and prints it with the tag `CYCLE`:
   ```
   node -e "const g=require('./.typecheck-logs/deps.json');const d={};let left=Object.keys(g),lvl=0;const un=f=>g[f].filter(x=>(x in g)&&!(x in d)).length;while(left.length){let ready=left.filter(f=>un(f)===0);if(!ready.length){const m=Math.min(...left.map(un));ready=[left.find(f=>un(f)===m)];console.log('CYCLE',ready[0])}ready.forEach(f=>d[f]=lvl);left=left.filter(f=>!(f in d));lvl++}for(const[f,l]of Object.entries(d).sort((a,b)=>a[1]-b[1]))console.log(l,f)" > .typecheck-logs/order.txt
   ```
   In an interactive bash shell run `set +H` first, otherwise `!` triggers history expansion and the command fails with `event not found`.
3. For every file tagged `CYCLE`, find its cycle in `cycles.txt` and merge all members of that cycle into one unit. Give the unit the highest depth of any of its members.
4. Count importers for each file: `node -e "const g=require('./.typecheck-logs/deps.json');const c={};for(const v of Object.values(g))for(const x of v)c[x]=(c[x]||0)+1;for(const[k,n]of Object.entries(c).sort((a,b)=>b[1]-a[1]))console.log(n,k)"`.
5. Order units: lower depth first. Within the same depth, more importers first, because their types reach more files. Mark files already ending in `.ts` or `.tsx` as `status: ts`; they stay in the list because later strict flags follow the same order.

### Output
`ts_conversion_order`.

### Quality Gate
- Every file key in `deps.json` appears in exactly one unit.
- For every unit, every project file it imports appears in an earlier unit or in the same cycle unit. Spot-check by picking five units and reading their entries in `deps.json`.

---

## Worked Example

Illustrative only. `src/` with 64 JavaScript files.

Phase 1: `deps.json` has 64 keys. `cycles.txt` prints `1) models/user.js > models/order.js` meaning `user.js` and `order.js` import each other.

Phase 2 output (head):
```
0 config/env.js            importers 22
0 lib/money.js             importers 17
0 lib/dates.js             importers 9
1 lib/validate.js          importers 11
2 [models/user.js, models/order.js]  importers 14  (cycle unit)
3 services/billing.js      importers 4
4 routes/orders.js         importers 0
```
`config/env.js` converts first; the cycle unit converts in one commit after `lib/validate.js`.

---

## Exit Criteria

DONE when every source file sits in exactly one ordered unit, cycles are explicit units, and no unit precedes a file it imports.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | madge reports skipped files | **Adjust**: rerun with `--warning` to list them; fix the extension list or `--ts-config` so aliases resolve. |
| Phase 1 | Graph is empty | **Retry**: wrong root directory or extensions; check `migration_profile.source_roots`. |
| Phase 2 | One cycle contains a large share of the codebase | **Return**: report the cycle members to the user; breaking it is a refactor that belongs before the migration, not inside it. |
| Phase 2 | Dynamic `require(variable)` or `import()` with a computed path | **Adjust**: madge cannot see these; list them and place their targets by hand. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
