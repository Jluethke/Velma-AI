# Upgrade Order Plan From The Dependency Graph

**One-line description:** Turns the outdated, vulnerability and breaking-change records into an ordered list of single-purpose commits: runtime first when required, security fixes next, lockstep peer groups kept together, dependencies before their dependents, and each item tagged with the method that will apply it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `stack`, `upgrade_goal`, `framework`, `runtime_version`, `work_dir`.
- `breaking_changes` (object[], required): From `dup-changelog-triage`.

---

## Outputs

- `upgrade_plan` (object[]): Ordered items: `order`, `packages` (one name, or a lockstep group), `from`, `to`, `reason` (`security`, `runtime-floor`, `framework`, `currency`), `method` (`bump`, `codemod`, `framework-flow`, `runtime-flow`), `blocked_by` (item orders that must land first), `breaking_refs` (indexes into `breaking_changes`), `commit_message`. Also written to `<work_dir>/plan.json`.

---

## Phase 1: Build The Graph

### Entry Criteria
- `<work_dir>/breaking_changes.json` exists; `<work_dir>/outdated.json` and/or `<work_dir>/vulns.json` exist.

### Actions
1. For each candidate package, record who requires it and what it requires, using the stack's tool:

| Stack | "Who depends on X" | "What X's new version requires" |
|---|---|---|
| python | `pipdeptree --reverse --packages X` | `curl -s https://pypi.org/pypi/X/<to>/json` key `info.requires_dist` |
| node | `npm explain X` / `pnpm why X` | `npm view X@<to> dependencies peerDependencies engines --json` |
| go | `go mod graph \| grep ' X@'` | `go mod download -json X@<to>` then read its `go.mod` |
| rust | `cargo tree -i X --locked` | `cargo info X@<to>` (dependencies section) |
| jvm | Maven `dependency:tree -Dincludes=<g>:<a>`; Gradle `dependencyInsight --dependency <a>` | the artifact POM on Maven Central |

2. Draw edges `A -> B` meaning "A's target version requires B at a version newer than B's current". Save as `<work_dir>/plan-graph.txt` lines `A -> B (needs B>=v)`.
3. Mark lockstep groups: packages that pin each other exactly or through peer ranges (node `peer_group`; Python plugins whose new version requires the new framework, such as `django-*` apps; Spring Boot BOM-managed artifacts; `@types/*` paired with their runtime package). A lockstep group becomes one plan item.

### Output
`plan-graph.txt` and lockstep groups.

### Quality Gate
- Every edge in `plan-graph.txt` cites the command output it came from.
- The graph has no cycle outside a lockstep group (a cycle means those packages must be one item).

---

## Phase 2: Order The Items

### Entry Criteria
- Graph built.

### Actions
1. Apply these ordering rules in sequence (earlier rule wins):

| Rule | Items |
|---|---|
| 1 | Runtime upgrades whose floor is required by any other item (`runtime-floor` breaking change with `affects_repo=true`), method `runtime-flow` (Node uses `dup-node-lts-upgrade`; Python, Go, Rust, Java runtime changes are listed for the user) |
| 2 | Security fixes with `fix_update_type` patch or minor, lowest blast radius first, method `bump` |
| 3 | Remaining patch updates of direct dependencies, method `bump`, one item per package (see step 3 for grouping) |
| 4 | Minor updates of direct dependencies, method `bump` |
| 5 | Items `A` before any item that depends on `A` (topological order of the graph) |
| 6 | Major updates of non-framework libraries: method `codemod` when a `breaking_changes` record has a `codemod`, else `bump` |
| 7 | The framework named in `upgrade_scope.framework`, method `framework-flow`, after every plugin that must first move to a version supporting both old and new framework |

2. Filter by goal: `security-only` keeps rule 1 and 2 items plus anything they are `blocked_by`; `minor-patch` keeps rules 1 to 5; `framework-major` keeps the framework item, its lockstep group and its `blocked_by` chain; `node-lts` keeps rule 1 for Node and items blocked by the Node version; `all` keeps everything.
3. Grouping rule for patch items (rule 3): group all patch bumps of one ecosystem into one item ONLY if the user allows it; otherwise one per package. If a grouped item later fails tests, `dup-apply-one-bump` splits it.
4. Never place two majors in one item unless they are one lockstep group.
5. Write `commit_message` as `deps: bump <name> <from> -> <to>` (or `deps: bump <group> to <to>`), with `(security: <advisory ids>)` appended for rule 2 items.

### Output
Ordered items.

### Quality Gate
- For every item, every `blocked_by` order number is smaller than the item's own `order`.
- No item contains two majors outside a lockstep group.

---

## Phase 3: Mark Blocked Items And Write The Plan

### Entry Criteria
- Ordered items exist.

### Actions
1. Mark items whose target needs a runtime newer than the one available and no runtime item precedes them: set `blocked_by=["runtime:<name> <version>"]`.
2. Mark items whose fix does not exist (`no_fix`) as `method=user-decision`, kept at the end, never silently dropped.
3. Write `<work_dir>/plan.json` and print the plan as a table for the user: order, packages, from, to, reason, method.

### Output
`upgrade_plan`.

### Quality Gate
- `<work_dir>/plan.json` parses; every record from `vulns.json` with priority 1 (Go `called`, npm runtime-exposed, pip-audit, RustSec vulnerability) appears in some item or as `user-decision`.

---

## Worked Example

Illustrative only. Node app on Node 20.11, goal `all`, framework `react`.

- Phase 1: `npm view vite@7.1.5 engines --json` gives `{"node":"^20.19.0 || >=22.12.0"}`: edge `vite -> node>=20.19`. Lockstep: `react`, `react-dom`, `@types/react`, `@types/react-dom`. `@testing-library/react@16` peers `react ^18 || ^19`, so it can move before React.
- Phase 2 output (abbreviated): 1 `node 20.11 -> 22` runtime-flow; 2 `express 4.20.0 -> 4.21.1` bump (security: GHSA-pxg6-pf52-xh8x via cookie); 3 `zod 3.23.8 -> 3.25.76` bump; 4 `@testing-library/react 14 -> 16` bump; 5 `vite 5 -> 7` method `bump` (no codemod listed in `breaking_changes`), blocked_by [1]; 6 react group `18.2.0 -> 19.1.1` framework-flow, blocked_by [4].
- Phase 3: no unfixable advisories; plan.json written.

---

## Exit Criteria

DONE when `<work_dir>/plan.json` orders every in-goal change into single-purpose items with methods and blockers, and every priority-1 vulnerability is covered.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Graph tool unavailable (`pipdeptree` not installed) | **Adjust**: `pipx run pipdeptree --python <venv-python> -r -p X`. |
| Phase 1 | Cycle between non-lockstep packages | **Adjust**: merge them into one lockstep item and record why. |
| Phase 2 | Framework plugin has no release supporting the new framework | **Return**: mark the framework item `blocked_by=["plugin:<name>"]`; the user chooses to wait, replace, or fork. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
