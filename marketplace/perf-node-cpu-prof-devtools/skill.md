# Node.js CPU Profile with --cpu-prof and Chrome DevTools

**One-line description:** Captures a V8 `.cpuprofile` from a Node.js process with `--cpu-prof` (or interactively through `--inspect` and Chrome DevTools), maps frames to TypeScript sources with source maps, and reads the Bottom-Up and Call Tree views to list self-time hotspots.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `workload_spec` (object, required): Command, inputs, sizes, and for servers the load to apply.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `node_cpu_profile` (object): Path to the `.cpuprofile` file, the command, Node version, sampling interval, and the top functions by self time and total time with source location, plus the share of `(garbage collector)`, `(program)` and `(idle)`.

---

## Phase 1: Capture the Profile

### Entry Criteria
- `node --version` exits 0. The production build exists (`npm run build` done).

### Actions
1. Choose the capture method:

   | Workload | Method |
   |---|---|
   | Script or CLI that exits | `node --cpu-prof --cpu-prof-dir=perf/profiles dist/cli.js <args>`; the file is written on exit |
   | Server you can restart | same flags; apply load, then stop the server with SIGINT (Ctrl+C) so Node writes the profile on a clean exit |
   | Server you must inspect live | `node --inspect dist/server.js`, open `chrome://inspect` in Chrome, click `inspect`, use the Performance panel Record button while load runs |

2. Add `--enable-source-maps` when the build is TypeScript or bundled and emits source maps, so stack traces name source files.
3. Leave `--cpu-prof-interval` at its default unless the run is short; check `node --help | grep cpu-prof` for the default and units on your version (microseconds).
4. Never profile through `ts-node`, `tsx` or a dev server with hot reload; the transpiler and watcher dominate the profile.
5. A process killed with SIGKILL writes no profile. If the server ignores SIGINT, add a temporary `process.on('SIGINT', () => process.exit(0))` in a local copy of the entry file under `perf/`, not in application code.

### Output
`perf/profiles/CPU.<timestamp>.<pid>.cpuprofile` (Node's default file name pattern) or a saved DevTools profile.

### Quality Gate
- `ls perf/profiles/*.cpuprofile` lists a non-empty file.
- `node -e "const p=require('./perf/profiles/<file>');console.log(p.nodes.length, p.samples.length)"` prints two numbers greater than 0.

---

## Phase 2: Read It in DevTools

### Entry Criteria
- Profile file exists.

### Actions
1. Open Chrome DevTools (any page), Performance panel, click the upload icon (Load profile), select the `.cpuprofile`. Alternatively drag it into https://www.speedscope.app.
2. Use the `Bottom-Up` tab sorted by `Self Time`. This answers "which function burns CPU itself". Expand a row to see who called it.
3. Use the `Call Tree` tab sorted by `Total Time` to find the top-level operation that contains the hot function.
4. The flame chart in the Performance panel has time on the x-axis (left to right is chronological). This differs from a classic flame graph, where x is not time. Look for long repeated blocks of the same function rather than single wide bars.
5. Record these special rows:

   | Row | Meaning | What to note |
   |---|---|---|
   | `(garbage collector)` | time in V8 GC | a large share points to allocation pressure |
   | `(program)` | native V8 or Node work not attributed to JS | large share: check native addons or JSON parse in C++ |
   | `(idle)` | event loop idle | large share in a CPU profile means the process waited (I/O) |

6. Click a hot row to jump to the source line; confirm the file is your source, not `node_modules`, before calling it your hotspot. If it is a dependency, record the dependency and the call site in your code.

### Output
Self-time and total-time tables with special rows.

### Quality Gate
- At least the top 10 Bottom-Up rows by self time are recorded with self ms and percent.
- The three special rows are recorded with their share, or "absent".

---

## Phase 3: Record

### Entry Criteria
- Tables recorded.

### Actions
1. Fill `node_cpu_profile` with file path, command, Node version, interval, the top functions (name, file:line, self, total) and the special-row shares.
2. If `(idle)` dominates, add `"off_cpu_suspected": true`.

### Output
`node_cpu_profile`.

### Quality Gate
- Every listed function has a file and line from the profile, not from memory.

---

## Worked Example

Illustrative. CLI `dist/cli.js index --docs data/docs_40000.json`, Node 22.

```bash
node --cpu-prof --cpu-prof-dir=perf/profiles --enable-source-maps dist/cli.js index --docs data/docs_40000.json
```

Bottom-Up (self time): `tokenize (src/search/tokenize.ts:14)` 41.2%; `(garbage collector)` 22.8%; `Array.prototype.includes` 18.5% called from `addTerm (src/search/index.ts:57)`; `(program)` 3.1%; `(idle)` 0.4%.

---

## Exit Criteria

DONE when a `.cpuprofile` of the production build exists, the Bottom-Up self-time and Call Tree totals are recorded with source locations, and the GC, program and idle shares are noted.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No file written | **Retry**: exit with SIGINT or `process.exit`, not SIGKILL; check `--cpu-prof-dir` exists. |
| Phase 1 | Frames show `dist/*.js` minified names | **Adjust**: enable source maps in the build and pass `--enable-source-maps`. |
| Phase 2 | Hot function is inside `node_modules` | **Adjust**: record the dependency and your call site; the fix is usually at the call site. |
| Phase 2 | Server profile is mostly `(idle)` | **Return**: run `perf-node-clinic-0x-flame` with load or classify as I/O in `perf-hotspot-classify`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
