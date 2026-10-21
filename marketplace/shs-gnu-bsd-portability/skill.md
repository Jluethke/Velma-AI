# GNU versus BSD Command Portability

**One-line description:** Finds every command-line flag in a script that differs between GNU coreutils/sed/grep/find (Linux), BSD userland (macOS, FreeBSD) and busybox (Alpine), replaces each with a form that works on all target platforms (`sed -i.bak`, `wc -c <`, `grep -E`, `printf`, `date -u +FORMAT`), and proves it by running on each platform.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_path` (string, required): Script to fix.
- `target_platforms` (string[], required): Platforms the script must run on.

---

## Outputs

- `portability_fixes` (object[]): Per site: line, command, non-portable flag, portable replacement, platforms tested.

---

## Phase 1: Find Non-Portable Flags

### Entry Criteria
- `target_platforms` includes more than one userland (for example Linux plus macOS, or glibc Linux plus Alpine). If only one, record "single userland" and stop with empty `portability_fixes`.

### Actions
1. Search the script for each pattern and record hits:

| ID | Search (`grep -nE`) | GNU form | BSD/macOS | busybox |
|---|---|---|---|---|
| P1 | `sed -i` | `sed -i 's/a/b/' f` | needs a suffix argument: `sed -i '' ...` | `sed -i` like GNU |
| P2 | `date -d\|date --date` | `date -d '1 day ago'` | `date -v-1d`; parse with `date -j -f` | limited `-d` |
| P3 | `stat -c\|stat --format` | `stat -c %s f` | `stat -f %z f` | `stat -c` |
| P4 | `readlink -f` | supported | only on newer macOS releases | supported |
| P5 | `grep -P\|grep --perl` | PCRE (if built in) | not available | not available |
| P6 | `find .* -printf` | supported | not available | not available |
| P7 | `xargs -r\|xargs --no-run-if-empty` | supported | check `man xargs` on the target | supported |
| P8 | `base64 -w` | `-w 0` disables wrapping | no `-w` | check `--help` |
| P9 | `\btimeout\b` | coreutils `timeout` | not installed by default | applet |
| P10 | `\btac\b` | supported | missing; `tail -r` exists | applet varies |
| P11 | `echo -e\|echo -n` | bash builtin differs from `/bin/echo` and dash | | |
| P12 | `sha256sum\|md5sum` | coreutils | may be missing; `shasum -a 256` | applet |
| P13 | `head -n -\|tail -n +` with negative head | GNU only for `head -n -N` | no negative `head` | check |
| P14 | `--long-option` on any coreutils command | GNU accepts many long options | BSD tools mostly do not | partial |

2. Where the table says "check", run `<cmd> --help` or `man <cmd>` on that platform and paste the result. Do NOT assume a flag exists.

### Output
Hit list per ID.

### Quality Gate
- Each P1 to P14 has hits or "none found".
- Every "check" cell touched by a hit has pasted evidence.

---

## Phase 2: Replace With Portable Forms

### Entry Criteria
- Hit list exists.

### Actions
1. Use these replacements, one edit at a time, re-parsing after each:

| ID | Portable replacement |
|---|---|
| P1 | `sed 's/a/b/' "$f" > "$tmp" && mv -- "$tmp" "$f"`; or `sed -i.bak 's/a/b/' "$f" && rm -f -- "$f.bak"` (suffix attached to `-i` works in GNU and BSD) |
| P2 | Compute in seconds: `now=$(date -u +%s)` (GNU, BSD, busybox all support `%s`) and do arithmetic; for "older than N days" use `find -mtime +N` instead of date math |
| P3 | Size: `wc -c < "$f"` (strip spaces with `$(( $(wc -c < "$f") ))`); mtime: `find "$f" -newer ref` comparisons |
| P4 | `abs=$(cd -- "$(dirname -- "$p")" && pwd -P)/$(basename -- "$p")` (resolves the directory, not a final symlink) |
| P5 | `grep -E` with POSIX ERE; replace `\d` with `[0-9]`, `\s` with `[[:space:]]`, drop lookarounds |
| P6 | `find ... -exec stat ... {} +` per platform, or loop and print with `printf` |
| P7 | Guard the input: `if [ -s "$list" ]; then xargs ... < "$list"; fi`, or use `find -exec ... {} +` which never runs on empty |
| P8 | `base64 < "$f" \| tr -d '\n'` |
| P9 | Feature-detect: `if command -v timeout >/dev/null; then timeout "$secs" cmd; elif command -v gtimeout >/dev/null; then gtimeout "$secs" cmd; else cmd; fi` and log that no timeout was applied |
| P10 | `awk '{a[NR]=$0} END{for(i=NR;i>0;i--) print a[i]}'` |
| P11 | `printf '%s' "$x"` and `printf '%b' "$x"` for escapes |
| P12 | `if command -v sha256sum >/dev/null; then sha256sum; else shasum -a 256; fi`; or `cksum` when cryptographic strength is not needed |
| P13 | `sed '$d'` to drop the last line |
| P14 | Short POSIX options (`-r` not `--recursive`) |

2. Do NOT add a `uname`-based branch for each command when a single portable form exists. Use `uname` branches only when no portable form exists.
3. Do NOT tell the user to install GNU coreutils on macOS as the fix unless `script_requirements` allows extra dependencies; if it does, document `brew install coreutils gnu-sed` and the `g`-prefixed names (`gsed`, `gdate`).

### Output
Edited script, draft `portability_fixes`.

### Quality Gate
- Re-running every Phase 1 search returns no unhandled hit.
- The script parses.

---

## Phase 3: Run On Each Userland

### Entry Criteria
- Edits complete.

### Actions
1. Linux glibc: `docker run --rm -v "$PWD":/w -w /w debian:stable-slim bash /w/<script> <args>` (or `sh` for POSIX scripts).
2. Alpine/busybox: `docker run --rm -v "$PWD":/w -w /w alpine:3 sh /w/<script> <args>` (install bash first with `apk add --no-cache bash` if the script is bash).
3. macOS: run on a Mac or a `macos-latest` CI runner (`shs-ci-shell-matrix`). There is no faithful macOS userland container.
4. Compare stdout across platforms with `diff`.

### Output
`portability_fixes` with platform results.

### Quality Gate
- Every platform in `target_platforms` has a run with rc 0, or is marked "not run" with the reason.
- Cross-platform stdout `diff` is empty, or each difference is explained.

---

## Worked Example

Illustrative only.

Hits: P1 line 12 `sed -i "s/^version=.*/version=$v/" conf`; P3 line 20 `stat -c %s "$f"`; P5 line 31 `grep -oP '\d+\.\d+'`.

Replacements: line 12 `sed -i.bak "s/^version=.*/version=$v/" conf && rm -f -- conf.bak`; line 20 `size=$(( $(wc -c < "$f") ))`; line 31 `grep -oE '[0-9]+\.[0-9]+'`.

```
$ docker run --rm -v "$PWD":/w -w /w alpine:3 sh -c 'apk add -q bash && bash /w/bin/bump 1.4.0'; echo "rc=$?"
bumped conf to 1.4.0
rc=0
```
macOS run happens in CI.

---

## Exit Criteria

DONE when no GNU-only or BSD-only flag remains unhandled and the script runs with identical output on every reachable target userland.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Unsure if a flag is portable | **Adjust**: check `man` on each platform and the POSIX utility page; record the evidence. |
| Phase 2 | No portable form exists | **Adjust**: feature-detect with `command -v` or a `--version` probe, not `uname`, and log the branch taken. |
| Phase 3 | macOS not reachable locally | **Adjust**: rely on the CI macOS job; mark macOS "pending CI" until it passes. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
