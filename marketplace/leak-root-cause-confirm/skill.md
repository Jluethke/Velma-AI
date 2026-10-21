# Leak Root Cause Statement and Confirmation Experiment

**One-line description:** Merges the tool evidence from whichever stack flows ran into one root cause statement (allocation site, holder, path from root, causes-table row), then proves it with a no-fix toggle experiment that removes only the suspected retention and reruns the same fixed load.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cause_hypotheses` (object[], required): From `leak-classic-causes-triage`.
- `load_recipe` (object, required): From `leak-intake-load-recipe`.
- `py_referrer_report` (object[], optional): From `leak-py-gc-referrers`.
- `py_native_leak_report` (object[], optional): From `leak-py-memray-native`.
- `node_retainer_paths` (object[], optional): From `leak-node-heap-snapshot-compare`.
- `node_listener_report` (object[], optional): From `leak-node-emitter-listener-audit`.
- `detached_dom_report` (object[], optional): From `leak-browser-detached-dom`.
- `jvm_retention_report` (object[], optional): From `leak-jvm-mat-dominator-tree`.
- `jvm_native_report` (object[], optional): From `leak-jvm-native-memory-tracking`.
- `go_heap_diff` (object[], optional): From `leak-go-pprof-heap-diff`.
- `go_goroutine_report` (object[], optional): From `leak-go-goroutine-leak`.
- `memcheck_report` (object[], optional): From `leak-cpp-valgrind-memcheck`.
- `lsan_report` (object[], optional): From `leak-cpp-asan-lsan`.
- `heaptrack_report` (object[], optional): From `leak-cpp-heaptrack`.
- `allocator_report` (object, optional): From `leak-native-malloc-fragmentation`.

At least one of the optional evidence inputs must be present.

---

## Outputs

- `root_cause` (object[]): One entry per confirmed leak: allocation site file:line, holder (the long-lived object and field), path from root to leaked object, causes-table row id, per-operation growth from the tool, and the evidence input names that support it.
- `confirm_experiment` (object): The toggle change made on a throwaway branch, the slope before and with the toggle, and the verdict `confirmed` or `rejected`.

---

## Phase 1: Write the Root Cause Statement

### Entry Criteria
- At least one evidence input is present and non-empty.

### Actions
1. List every evidence input present. Ignore absent ones; they belong to stacks that did not run.
2. For each leak candidate, fill these four fields from the evidence. Copy values; do not paraphrase numbers.

   | Field | Comes from |
   |---|---|
   | allocation site | tracemalloc or memray traceback, heap snapshot instance constructor, pprof `list`, Valgrind or LSan stack, heaptrack call site |
   | holder | objgraph or gc referrer chain, DevTools Retainers, MAT Path to GC Roots, goroutine `created by` plus blocked channel, heaptrack storage location |
   | path | the hop list from a root to the leaked object |
   | causes row | match to C1 to C12 in `cause_hypotheses` |

3. A candidate with an allocation site but no holder is incomplete. For unreachable leaks (Valgrind definitely lost, LSan Direct), the "holder" is "none: lost pointer" and the path is the code path that drops the last pointer (for example an early return). Write that path from reading the code.
4. If two stack flows disagree (for example tracemalloc points at one line and objgraph at an unrelated type), keep both as separate candidates. Do not merge them by guesswork.
5. For `allocator_report` verdict `allocator_retention` or `fragmentation`, the root cause is the allocator configuration; record the run that removed growth.

### Output
Draft `root_cause` entries.

### Quality Gate
- Every entry has all four fields filled, each citing which evidence input it came from.

---

## Phase 2: Toggle Experiment

### Entry Criteria
- Draft `root_cause` exists.

### Actions
1. Create a throwaway branch: `git switch -c leak-confirm-<short-name>`.
2. Make the smallest change that removes only the suspected retention, without trying to be the final fix. Examples:
   - Unbounded cache: bypass the cache (call the uncached function).
   - Listener: skip the registration line.
   - Goroutine: give the result channel a buffer of 1.
   - Native: free the object on the suspected path.
   - Allocator: set the allocator environment variable from the winning run.
   One change, one file where possible.
3. Rerun the same `load_recipe` with the same sampling and fit as `leak-rss-growth-confirm`.
4. Decide:

   | Slope with toggle | Verdict |
   |---|---|
   | 95 percent interval contains 0, or falls by close to the tool's per-operation growth for this candidate | `confirmed` |
   | unchanged within intervals | `rejected`: this candidate does not explain the growth |
   | falls but stays above 0 | `confirmed` for this candidate; another leak remains, go back to Phase 1 with the next candidate |

5. Delete the throwaway branch after recording results: `git switch -` then `git branch -D leak-confirm-<short-name>`. The toggle is evidence, not the fix.

### Output
`confirm_experiment`.

### Quality Gate
- Before and toggle slopes with intervals are recorded from `linregress` output.
- `git branch --list "leak-confirm-*"` prints nothing after cleanup.

---

## Worked Example

Illustrative only.

Input: `py_referrer_report` says `Cart` held by `quote_for` lru_cache; `cause_hypotheses` H1 = C1 at `pricing.py:41`.

Phase 1: allocation site `orders/pricing.py:41` (tracemalloc, about 400 bytes per op); holder `functools._lru_cache_wrapper` `quote_for` internal cache (from `py_referrer_report`); path `orders.pricing` -> `quote_for` -> cache dict -> key tuple -> `Cart`; row C1.

Phase 2: branch `leak-confirm-quote-cache`; toggle replaces `quote_for(cart)` with `quote_for.__wrapped__(cart)`. Before: 401 bytes/op (interval 362 to 440). Toggle: 6 bytes/op (interval -21 to 33). Verdict `confirmed`.

---

## Exit Criteria

DONE when every candidate is either `confirmed` by a toggle experiment or `rejected`, and at least one confirmed root cause explains the measured growth.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No evidence inputs present | **Return**: to the stack flows for this `stack`; there is nothing to merge. |
| Phase 1 | Holder unknown for a reachable leak | **Return**: to the stack's retention flow (objgraph, Retainers, MAT, goroutine dump, heaptrack GUI). |
| Phase 2 | Every candidate rejected | **Return**: to `leak-classic-causes-triage` with the tool evidence to widen the hypotheses. |
| Phase 2 | Toggle breaks functionality so the load cannot run | **Adjust**: pick a narrower toggle (bound the cache to 1 entry instead of bypassing it). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
