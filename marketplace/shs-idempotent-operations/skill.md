# Idempotent Shell Operations

**One-line description:** Makes a script safe to run twice by converting each side effect to a check-then-act or naturally idempotent form (`mkdir -p`, `ln -sfn`, `grep -qxF || append`, `install -m`, write-to-temp then `mv`), adding a `-n` dry-run path, and proving a second run changes nothing with a before/after state hash.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_path` (string, required): Script to fix.
- `script_requirements` (object, required): Its `side_effects[]` lists what the script changes.

---

## Outputs

- `idempotency_report` (object): Per side effect: before form, after form, and the state-hash comparison of run 1 versus run 2.

---

## Phase 1: Classify Each Side Effect

### Entry Criteria
- `script_requirements.side_effects` is not empty.

### Actions
1. Find the lines that perform each side effect: `grep -nE '\b(mkdir|ln|cp|mv|rm|chmod|chown|useradd|groupadd|systemctl|apt-get|apk|dnf|yum|tee|>>|sed -i)\b' "$script_path"`.
2. Classify each with this table:

| Operation | Problem on rerun | Idempotent form |
|---|---|---|
| `mkdir dir` | fails "File exists" | `mkdir -p -- "$dir"` |
| `ln -s target link` | fails, or creates `link/target` inside an existing dir symlink | `ln -sfn -- "$target" "$link"` (`-n` treats an existing link to a directory as a file; GNU and BSD both accept it) |
| `echo line >> file` | duplicates the line | `grep -qxF -- "$line" "$file" \|\| printf '%s\n' "$line" >> "$file"` |
| `cp src dst` then `chmod` | brief window with wrong mode | `install -m 0644 -- "$src" "$dst"` (`install -d -m 0755 dir` for directories) |
| `> file` written in place | readers see a half-written file if interrupted | write to `tmp=$(mktemp "$dst.XXXXXX")`, then `mv -f -- "$tmp" "$dst"` (rename is atomic on one filesystem) |
| `sed -i` edit | applies twice (for example appends twice) | make the pattern match only the unedited state, or check with `grep -q` first |
| `useradd name` | fails "already exists" | `id -u name >/dev/null 2>&1 \|\| useradd ...` |
| `apt-get install pkg` | already idempotent | keep; add `-y` and `DEBIAN_FRONTEND=noninteractive` |
| `systemctl enable --now svc` | already idempotent | keep |
| `rm file` | fails when absent | `rm -f -- "$file"` |

3. Mark each side effect as already-idempotent, fix-needed, or cannot-be-idempotent (for example "send an email"); the last kind needs a state marker file in Phase 2.

### Output
Classified side-effect list.

### Quality Gate
- Every entry in `script_requirements.side_effects` has a class.
- Every fix-needed entry has its target form from the table.

---

## Phase 2: Apply the Forms and Add Dry Run

### Entry Criteria
- Classified list exists.

### Actions
1. Edit one side effect at a time and re-parse.
2. For cannot-be-idempotent actions, record completion in a marker: `marker=/var/lib/$SCRIPT_NAME/sent-$(date -u +%Y%m%d)`; skip when it exists; create it only after the action succeeds.
3. Add a dry-run wrapper and route every side effect through it:

```sh
run() {
  if [ "${dry_run:-0}" = 1 ]; then
    printf 'DRY-RUN:' >&2; printf ' %s' "$@" >&2; printf '\n' >&2
  else
    "$@"
  fi
}
# usage: run install -d -m 0755 -- "$dest"
```

4. Do NOT wrap read-only commands in `run`; only changes.

### Output
Edited script.

### Quality Gate
- `"$script_path" -n ...` prints `DRY-RUN:` lines and the state hash (Phase 3) is unchanged after it.
- The script parses.

---

## Phase 3: Prove Two Runs Converge

### Entry Criteria
- Edits complete.

### Actions
1. Pick the state root the script changes (for example a test prefix such as `$t/root` passed by option, never a real system path for this test).
2. Hash the state: `state() { find "$1" -exec ls -ld {} + | awk '{print $1, $NF}' | sort; find "$1" -type f -exec cksum {} + | sort; }` (`cksum` is POSIX; it avoids the `sha256sum` versus `shasum` difference).
3. Run 1, capture `state > s1`. Run 2, capture `state > s2`. `diff s1 s2` must be empty.
4. Run the dry run, capture `state > s3`; `diff s2 s3` must be empty.

### Output
`idempotency_report`.

### Quality Gate
- `diff s1 s2` prints nothing and exits 0.
- `diff s2 s3` prints nothing and exits 0.
- Run 2 exits 0.

---

## Worked Example

Illustrative only.

Side effects: create `/opt/app/conf`, link `/opt/app/current` to a release, add a line to `/etc/hosts`.

Rewrites: `mkdir -p -- "$root/opt/app/conf"`; `ln -sfn -- "$release" "$root/opt/app/current"`; `grep -qxF -- "10.0.0.5 db" "$root/etc/hosts" || printf '%s\n' "10.0.0.5 db" >> "$root/etc/hosts"`.

```
$ t=$(mktemp -d); bin/setup --root "$t"; state "$t" > s1
$ bin/setup --root "$t"; echo "rc=$?"; state "$t" > s2; diff s1 s2 && echo same
rc=0
same
```

---

## Exit Criteria

DONE when every side effect is idempotent or marker-guarded, dry run changes nothing, and two real runs produce identical state.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Script has no option to target a test root | **Adjust**: add a `--root` or `DESTDIR` prefix variable first, defaulting to empty. |
| Phase 3 | `diff s1 s2` shows mtimes or new log lines | **Adjust**: exclude the script's own log file from the hash; any other difference is a real non-idempotent step to fix. |
| Phase 3 | Run 2 fails | **Retry**: read the failing command from stderr; it is a create-only operation still missing its idempotent form. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
