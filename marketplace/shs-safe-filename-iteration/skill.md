# Safe Filename Iteration

**One-line description:** Replaces `for f in $(ls ...)`, `for f in $(find ...)` and `cat list | while read f` with loops that survive spaces, globs, leading dashes and newlines in filenames: shell globs with a no-match guard, `find -print0` with `while IFS= read -r -d ''` (bash) or `find -exec ... {} +` (POSIX), and `xargs -0`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_path` (string, required): Script to fix.
- `shell_dialect` (string, required): `bash` or `posix`.

---

## Outputs

- `iteration_fixes` (object[]): Per loop: line, pattern ID (L1 to L5), before, after, and hostile-name test result.

---

## Phase 1: Find Unsafe Loops

### Entry Criteria
- The script parses.

### Actions
1. Search and record each hit:

| ID | Unsafe pattern | Search |
|---|---|---|
| L1 | `for f in $(ls ...)` | `grep -nE 'for\s+\w+\s+in\s+\$\(\s*ls' "$script_path"` (ShellCheck SC2045) |
| L2 | `for f in $(find ...)` | `grep -nE 'for\s+\w+\s+in\s+\$\(\s*find' "$script_path"` (SC2044) |
| L3 | `while read f` without `IFS=` and `-r` | `grep -nE 'while\s+read\s' "$script_path"` then keep lines missing `IFS=` or `-r` (SC2162) |
| L4 | `find ... \| xargs cmd` without `-print0`/`-0` | `grep -nE 'find.*\|\s*xargs' "$script_path"` |
| L5 | Unquoted glob loop with no empty-match guard | `grep -nE 'for\s+\w+\s+in\s+[^$]*\*' "$script_path"` |

2. For each hit, note whether the loop body modifies variables that must survive after the loop (a pipe into `while` runs the loop in a subshell, so those changes are lost).

### Output
Unsafe loop list.

### Quality Gate
- Each L1 to L5 has hits or "none found".
- Each hit notes whether it needs loop variables after the loop.

---

## Phase 2: Rewrite Each Loop

### Entry Criteria
- Unsafe loop list exists.

### Actions
1. Choose the replacement with this table:

| Need | bash | POSIX sh |
|---|---|---|
| Files in one directory | `shopt -s nullglob; for f in "$dir"/*.log; do ...; done` | `for f in "$dir"/*.log; do [ -e "$f" ] \|\| [ -L "$f" ] \|\| continue; ...; done` |
| Recursive, loop body needs shell logic | `while IFS= read -r -d '' f; do ...; done < <(find "$dir" -type f -name '*.log' -print0)` | `find "$dir" -type f -name '*.log' -exec sh -c 'for f do ...; done' sh {} +` |
| Recursive, one command per batch | `find "$dir" -type f -name '*.log' -exec gzip -- {} +` | same |
| Feed to xargs | `find ... -print0 \| xargs -0 cmd --` | same (`-print0` and `-0` are in GNU, BSD and busybox, and in POSIX.1-2024) |
| Lines from a file (not filenames) | `while IFS= read -r line \|\| [[ -n $line ]]; do ...; done < "$file"` | `while IFS= read -r line \|\| [ -n "$line" ]; do ...; done < "$file"` |

2. The bash `< <(find ...)` form keeps the loop in the current shell, so counters set inside are visible after it. A `find ... | while` form loses them; do not use it when Phase 1 noted the need.
3. In `find -exec sh -c '...' sh {} +`, the literal `sh` fills `$0`; filenames arrive as `"$@"`. Never splice `{}` inside the quoted script text.
4. Under `set -e`, a `find` that errors inside `< <( )` does not fail the script. When that matters, check afterward: run `find` once more with `-quit` or save its stderr to a temp file and test it is empty.

### Output
Edited script and `iteration_fixes`.

### Quality Gate
- The Phase 1 searches return no hits, or each remaining hit is a reasoned exception in `iteration_fixes`.
- `shellcheck -i SC2044,SC2045,SC2162 "$script_path"` prints nothing.

---

## Phase 3: Test With Hostile Names

### Entry Criteria
- Rewrites complete.

### Actions
1. `t=$(mktemp -d); mkdir "$t/sub dir"; touch "$t/a b.log" "$t/-x.log" "$t/sub dir/c*.log" "$t/n
l.log"`.
2. Run the script against `$t` and count processed files from its log or output. Expect 4.
3. Run against an empty directory and confirm the loop body runs zero times (no literal `*.log` processed).

### Output
Test log in `iteration_fixes`.

### Quality Gate
- Processed count equals 4 for the hostile tree.
- Processed count equals 0 for the empty directory, with exit 0.

---

## Worked Example

Illustrative only.

Before (line 30): `for f in $(find "$src" -name '*.csv'); do total=$((total + 1)); import "$f"; done`

After (bash):
```bash
total=0
while IFS= read -r -d '' f; do
  total=$((total + 1))
  import "$f"
done < <(find "$src" -type f -name '*.csv' -print0)
printf 'imported %d files\n' "$total" >&2
```
```
$ bin/import "$t"; echo "rc=$?"
imported 4 files
rc=0
$ bin/import "$(mktemp -d)"
imported 0 files
```

---

## Exit Criteria

DONE when every loop over filenames uses a safe form and the hostile-tree and empty-directory tests give the expected counts.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Target `find` lacks `-print0` (very old or embedded systems) | **Adjust**: use the `-exec ... {} +` form, which POSIX has required for a long time. |
| Phase 3 | Count is 3, the newline name is missing | **Adjust**: a line-based reader is still in use; switch to `-print0` or `-exec`. |
| Phase 3 | Literal `*.log` processed in the empty directory | **Adjust**: add `nullglob` (bash) or the `[ -e "$f" ]` guard (posix). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
