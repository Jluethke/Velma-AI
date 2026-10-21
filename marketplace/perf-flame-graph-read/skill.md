# Flame Graph and Profile Reading

**One-line description:** Reads whichever profiles were captured (cProfile, py-spy, V8 cpuprofile, 0x, pprof, Linux perf, async-profiler) with one consistent method: identify the axis convention, separate self from total time, walk from the widest leaf down to the first frame in project code, and cross-check two profiles, producing a ranked hotspot list.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_cprofile_stats` (object, optional): From `perf-py-cprofile-capture`.
- `py_spy_profile` (object, optional): From `perf-py-spy-flamegraph`.
- `node_cpu_profile` (object, optional): From `perf-node-cpu-prof-devtools`.
- `node_flame_profile` (object, optional): From `perf-node-clinic-0x-flame`.
- `go_cpu_profile` (object, optional): From `perf-go-pprof-cpu`.
- `native_perf_profile` (object, optional): From `perf-linux-perf-flamegraph`.
- `jvm_cpu_profile` (object, optional): From `perf-jvm-async-profiler-cpu`.
- `perf_spec` (object, required): Primary metric, so on-CPU and wall-clock results are not mixed up.

At least one profile input must be present.

---

## Outputs

- `hotspot_list` (object[]): Ranked entries, each with `frame` (function), `location` (file:line), `owner` (project, dependency, runtime), `self_pct`, `total_pct`, `first_project_frame` (for dependency and runtime frames), `profile_kind` (on-CPU or wall), `source_profiles` (which inputs show it), and `agreement` (`confirmed` when two profiles agree, `single` otherwise). Written to `perf/hotspots.json`.

---

## Phase 1: Know What Each Picture Means

### Entry Criteria
- At least one profile input present with an existing file.

### Actions
1. For each present profile, record its conventions from this table before reading any number:

   | Profile | x-axis | Width or number means | Self time read from |
   |---|---|---|---|
   | flamegraph.pl SVG (Linux perf, py-spy SVG) | not time; stacks sorted alphabetically and merged | share of samples | width of a frame minus the width of frames directly above it |
   | speedscope `Left Heavy` | not time; heaviest stacks to the left | share of samples | `Sandwich` view, Self column |
   | Chrome DevTools flame chart, speedscope `Time Order` | time | duration of each call | `Bottom-Up` tab, Self Time |
   | 0x HTML | not time | share of on-CPU samples; brighter = more often on top of stack | hover tooltip, "top of stack" percent |
   | pprof `-top` | none (table) | `flat` = self, `cum` = total | `flat` column |
   | async-profiler HTML | not time | share of samples | tooltip, frames with nothing above |
   | cProfile `pstats` | none (table) | `tottime` = self, `cumtime` = total, deterministic | `tottime` column |

2. Record each profile's kind: on-CPU (perf, pprof CPU, py-spy default, async-profiler `cpu`/`itimer`, V8 cpuprofile) or wall-clock (py-spy `--idle`, async-profiler `wall`). Do not add percentages from an on-CPU profile to a wall-clock profile.
3. Record each profile's sample count. A frame's percent from a profile with few samples is uncertain; note the count next to it.

### Output
Convention notes per profile.

### Quality Gate
- Every present profile has its row, kind and sample count (or "deterministic" for cProfile) recorded.

---

## Phase 2: Walk the Stacks

### Entry Criteria
- Conventions recorded.

### Actions
1. List the frames with the largest self time (top 10 per profile). For each, read self percent and total percent from the tool, never estimate from pixel width by eye when the tool shows a number.
2. Classify each frame's owner:
   - `project`: file path inside `repo_path`.
   - `dependency`: `site-packages`, `node_modules`, `$GOPATH/pkg/mod`, `~/.cargo/registry`, `.m2`, third-party jars.
   - `runtime`: interpreter, VM, standard library, libc, kernel, GC.
3. For each `dependency` or `runtime` frame, walk down the stack (toward the root) to the first `project` frame. Record it as `first_project_frame`. That is where a change can be made. Example: `list.__contains__` (runtime) under `find_customer (app/report.py:92)` gives `first_project_frame = app/report.py:92`.
4. Merge entries that share the same `first_project_frame`; sum their self percents and keep the list of leaf frames.
5. Rank by summed self percent, then by total percent.

### Output
Draft ranked list.

### Quality Gate
- Every entry has an owner, and every non-project entry has a `first_project_frame` or the note "no project frame on stack".
- All percentages are copied from tool output.

---

## Phase 3: Cross-Check and Save

### Entry Criteria
- Draft ranked list exists.

### Actions
1. If two profiles are present (for example cProfile and py-spy, or `--cpu-prof` and 0x), mark entries that appear in the top 10 of both as `confirmed`. A function high in cProfile but low in py-spy is often inflated by cProfile's per-call overhead; mark it `single` and note it.
2. If only one profile is present, mark all entries `single` and record that a second capture would confirm.
3. Compare the top entry's total percent with the share of the primary metric. If the top project entry covers a small share, record "no dominant hotspot": the cost is spread out, and later flows must expect smaller gains per change.
4. Write `perf/hotspots.json` and validate with `python -m json.tool perf/hotspots.json`.

### Output
`hotspot_list`.

### Quality Gate
- `perf/hotspots.json` parses with exit code 0.
- Each entry lists the `source_profiles` it came from.

---

## Worked Example

Illustrative. Python, inputs `py_cprofile_stats` and `py_spy_profile`.

- Phase 1: cProfile deterministic; py-spy SVG on-CPU, 4,471 samples.
- Phase 2: py-spy leaf `find_customer (app/report.py:92)` self 86.3%; cProfile `find_customer` tottime 38.9 s of 44.8 s (86.8%). `csv.reader.__next__` (runtime) 2.4%, first project frame `load_rows (app/io.py:20)`.
- Phase 3:

```json
[{"frame": "find_customer", "location": "app/report.py:92", "owner": "project",
  "self_pct": 86.3, "total_pct": 86.5, "profile_kind": "on-CPU",
  "source_profiles": ["py_spy_profile", "py_cprofile_stats"], "agreement": "confirmed"},
 {"frame": "csv.reader.__next__", "location": "runtime", "owner": "runtime",
  "first_project_frame": "app/io.py:20", "self_pct": 2.4, "agreement": "single"}]
```

---

## Exit Criteria

DONE when `perf/hotspots.json` ranks hotspots by self time with owners, project call sites for every dependency or runtime frame, profile kinds, and cross-profile agreement.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No profile input present | **Stop**: run the profiler flow for the stack first. |
| Phase 1 | On-CPU and wall profiles disagree | **Adjust**: keep both, labeled by kind; the difference is waiting time. |
| Phase 2 | Stacks truncated (one or two frames) | **Return**: to the profiler flow; rebuild with frame pointers or symbols. |
| Phase 3 | No dominant hotspot | **Adjust**: record it; proceed, but rank candidates by summed share. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
