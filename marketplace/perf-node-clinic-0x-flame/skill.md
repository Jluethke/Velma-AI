# Node.js Server Flame Graph with 0x, clinic and autocannon

**One-line description:** Profiles a Node.js HTTP server under a controlled autocannon load, first triaging with `clinic doctor` (CPU, event loop delay, GC, active handles), then capturing a flame graph with `0x` or `clinic flame`, and reads the hot frames and event-loop blocking.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `workload_spec` (object, required): Server start command, route, connections, duration or arrival rate.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `node_flame_profile` (object): Paths to the `clinic doctor` report, the 0x or `clinic flame` HTML flame graph, the autocannon summary (latency percentiles, requests per second, errors), the triage verdict, and the top frames with their on-CPU share.

---

## Phase 1: Install and Define the Load

### Entry Criteria
- The server starts with a single command, for example `node dist/server.js`, and listens on a known port.

### Actions
1. Install as dev dependencies so versions are pinned: `npm install --save-dev 0x autocannon clinic`. Record `npx 0x --version`, `npx autocannon --version`, `npx clinic --version`.
2. clinic depends on native modules and may not install on the newest Node versions; check its repository status and supported Node versions. If `clinic` fails to install or run, continue with `0x` alone and record that.
3. Take the load parameters from `workload_spec`: connections (`-c`), duration in seconds (`-d`), and if a fixed rate is specified, `-R` (overall requests per second). Confirm flags with `npx autocannon --help`.
4. Do a dry run: start the server, run `npx autocannon -c <c> -d <d> http://localhost:<port><route>`, stop the server. Record the summary table.

### Output
Installed tools and a dry-run load summary.

### Quality Gate
- The dry-run autocannon summary shows 0 errors and 0 timeouts, or the errors are recorded and investigated before profiling.
- Load parameters in the command match `workload_spec`.

---

## Phase 2: Triage with clinic doctor

### Entry Criteria
- Dry run succeeded.

### Actions
1. Run doctor with its built-in load trigger:

```bash
npx clinic doctor --autocannon [ -c <c> -d <d> <route> ] -- node dist/server.js
```

   clinic starts the server, runs autocannon against it, stops it, and writes an HTML report under `.clinic/`.
2. Read the four graphs: CPU usage, memory (RSS, heap, GC), event loop delay, active handles. Read the recommendation text at the bottom.
3. Map the result:

   | Doctor finding | Next step |
   |---|---|
   | High CPU and high event loop delay | synchronous CPU work blocks the loop: capture a flame graph (Phase 3) |
   | Low CPU, low delay, slow responses | waiting on I/O (database, network): record "io" for `perf-hotspot-classify`; try `clinic bubbleprof` for async flow |
   | Heap growing steadily with frequent GC | allocation or leak: record "allocation" |
   | Doctor did not run | skip to Phase 3 with 0x |

### Output
Doctor report path and verdict.

### Quality Gate
- The `.clinic/*.html` report exists, or the failure to run is recorded.
- The verdict is one row of the table.

---

## Phase 3: Capture and Read the Flame Graph

### Entry Criteria
- Verdict says CPU work, or doctor was skipped.

### Actions
1. Start the server under 0x in one terminal: `npx 0x --output-dir perf/profiles/0x -- node dist/server.js`. In a second terminal run the load: `npx autocannon -c <c> -d <d> http://localhost:<port><route>`. Then press Ctrl+C in the first terminal; 0x writes `flamegraph.html` into the output directory. (`npx clinic flame --autocannon [ ... ] -- node dist/server.js` does the same in one command.)
2. Open the HTML. In 0x, width is on-CPU share and color brightness marks frames that were more often on top of the stack (hot self time). Use the search box to find your source files and the toggles to hide `node_modules`, Node core and V8 internals.
3. Find the widest bright frames in your code. Click a frame to zoom. Record function, file and line with its percentage shown on hover.
4. Look for synchronous calls that block the loop under load: `JSON.parse`/`JSON.stringify` of large bodies, `fs.*Sync`, `crypto.pbkdf2Sync`, `zlib.*Sync`, regular expressions with nested quantifiers, sorting large arrays per request.
5. Fill `node_flame_profile`.

### Output
`node_flame_profile`.

### Quality Gate
- `perf/profiles/0x/flamegraph.html` (or the clinic flame HTML) exists.
- Top frames are recorded with percentages and source locations; dependency frames are labeled as such.

---

## Worked Example

Illustrative. Express server, route `/api/search?q=shoe`, 50 connections for 30 s from `workload_spec`.

- Phase 1: dry-run autocannon: Latency p50 182 ms, p99 611 ms, Req/Sec average 268, 0 errors.
- Phase 2: doctor shows CPU near 100% of one core and event loop delay peaks of hundreds of ms; recommendation "Detected event loop issue". Verdict: CPU work.
- Phase 3: 0x flame graph: `scoreDocuments (src/search/score.ts:33)` 58% with bright top, under it `JSON.parse` of the whole index file 21% on every request in `loadIndex (src/search/index.ts:12)`.

---

## Exit Criteria

DONE when the server was profiled under the load from `workload_spec`, the doctor verdict (or its absence) is recorded, a flame graph exists, and its top frames are listed with source locations and the load summary.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | autocannon reports errors or timeouts | **Stop**: fix the server or the route first; errors distort latency. |
| Phase 1 | clinic will not install | **Adjust**: use 0x alone and record it. |
| Phase 2 | Verdict is I/O | **Return**: pass "io" to `perf-hotspot-classify`; a CPU flame graph will not show the waiting. |
| Phase 3 | 0x shows mostly V8 internals | **Adjust**: turn off the internals toggle; if still opaque, use `perf-node-cpu-prof-devtools`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
