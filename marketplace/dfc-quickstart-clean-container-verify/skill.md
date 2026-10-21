# Quickstart Verification in a Clean Container

**One-line description:** Runs the README's Install and Quickstart commands verbatim inside a fresh official Docker image with no host caches, no host credentials and no pre-installed project tooling, recording each command's exit code and output against the README's stated expected outcome.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `readme_commands` (object[], required): Ordered commands with expected outcomes from `dfc-readme-structure`.
- `base_image` (string, optional): Docker image to use as the clean machine. When absent, chosen from the runtime table in Phase 1.

---

## Outputs

- `quickstart_report` (object[]): One row per command: command text, exit code, last 20 lines of combined output, expected outcome, match result (match, mismatch, not-run).
- `quickstart_fixes` (object[]): One row per failure: README line, root cause class, the exact README change that fixes it, and the rerun result after the fix.

---

## Phase 1: Build the Clean Machine

### Entry Criteria
- `docker version` prints both Client and Server sections (the daemon is running).
- `readme_commands` is non-empty.

### Actions
1. Pick the image. If `base_image` is supplied, use it. Otherwise take the oldest runtime version the README claims to support (testing the oldest catches the most breakage) and use the official image:

   | Stack | Image pattern | Example |
   |---|---|---|
   | Python | `python:<version>-slim` | `python:3.10-slim` |
   | Node | `node:<major>-bookworm-slim` | `node:18-bookworm-slim` |
   | Go | `golang:<version>` | `golang:1.22` |
   | Rust | `rust:<version>-slim` | `rust:1.75-slim` |
   | Plain shell tool | `debian:bookworm-slim` | `debian:bookworm-slim` |

2. Confirm the tag exists before use: `docker pull <image>`. If the pull fails with "manifest unknown", the tag does not exist; pick the nearest listed tag from the image's Docker Hub page, never a guessed tag.
3. Export the repository without untracked files, build artifacts or caches: `git -C <repo_path> archive --format=tar HEAD > /tmp/qs-src.tar`. Uncommitted changes are excluded on purpose: a reader clones what is committed.
4. Do NOT mount the host home directory, `~/.npmrc`, `~/.pypirc`, `~/.cargo`, `~/.cache/pip`, `~/go/pkg` or an SSH agent. Each of these hides a missing step.

### Output
Chosen image pulled; source tarball created.

### Quality Gate
- `docker image inspect <image> --format '{{.Id}}'` prints an image ID.
- `tar -tf /tmp/qs-src.tar | head` lists repository files and no `node_modules/`, `.venv/` or `target/` entries.

---

## Phase 2: Run the Commands Verbatim

### Entry Criteria
- Image and tarball ready.

### Actions
1. Write the commands from `readme_commands` into `/tmp/qs-run.sh`, one per line, unchanged, after a header line `set -x`. Do NOT add `sudo`, extra `apt-get install` lines, `export` lines or flags that the README does not contain. Adding them makes the test pass while the README stays broken.
2. Create the container, copy both files in, and run it:
   ```bash
   id=$(docker create -w /work <image> bash -c 'tar -xf /src.tar -C /work && bash ./qs-run.sh')
   docker cp /tmp/qs-src.tar "$id":/src.tar
   docker cp /tmp/qs-run.sh "$id":/work/qs-run.sh
   docker start -a "$id" 2>&1 | tee /tmp/qs-out.log
   docker rm "$id"
   ```
   `docker cp` creates `/work` in the stopped container when it copies the script there. The README is followed from inside the extracted source tree, as a reader who ran `git clone` and `cd` would be. If the README starts with `git clone`, keep that line: it then clones into a subdirectory, which is also what the reader does.
   To record each command's exit code, append `; echo "EXIT=$?"` to each command line when writing `qs-run.sh`. This is the only change allowed to the command text.
3. Do not use `set -e` for the first run; run every command so all failures are visible in one pass. The `tee` in step 2 keeps the full log in `/tmp/qs-out.log`.
4. For each command, record exit code and compare output with the expected outcome text: `match` when every line of the expected `text` block appears in the output (ignoring trailing whitespace), `mismatch` otherwise.

### Output
`quickstart_report`.

### Quality Gate
- `quickstart_report` has one row per `readme_commands` row.
- Each row's exit code is taken from the log, not inferred.

---

## Phase 3: Classify Failures and Fix the README

### Entry Criteria
- At least one row with non-zero exit code or `mismatch`; otherwise skip to Exit Criteria.

### Actions
1. Classify each failure with this table:

   | Symptom in log | Root cause class | README fix |
   |---|---|---|
   | `command not found: git`, `gcc: not found`, `pkg-config not found` | Missing system dependency | Add a "Prerequisites" line naming the package |
   | `<tool>: command not found` right after a successful `pip install --user`, `go install`, `cargo install` | Install directory not on PATH | Add the PATH step: `~/.local/bin`, `$(go env GOPATH)/bin`, `~/.cargo/bin` |
   | `No such file or directory` on a file the reader should have | Quickstart uses a file the reader never created | Add the command that creates it |
   | `KeyError`/`undefined` for an env var | Hidden environment variable | Document the variable and how to set it |
   | `404` or `No matching distribution` on install | Package name or version wrong, or not published | Fix the name from the manifest or switch to from-source install |
   | Output differs from expected block | Stale expected output | Replace the expected block with the real output |

2. Edit `README.md` for one failure at a time, then rerun the whole script in a NEW container (Phase 2 step 2). Never reuse a container, because state from the failed run hides the next failure.
3. Repeat until every row is exit 0 and `match`, recording each fix in `quickstart_fixes`.
4. Do NOT fix the README by deleting the failing command or the expected output block.

### Output
`quickstart_fixes` and an all-passing `quickstart_report`.

### Quality Gate
- The final run log shows exit code 0 for every command.
- Every `quickstart_fixes` row names a README line that `git diff README.md` shows as changed.

---

## Worked Example

Illustrative only. Python CLI; README says "Python 3.10+" and has:
```
pip install tidyconf
tidyconf check example.yaml
```
Phase 1: image `python:3.10-slim`, `docker pull python:3.10-slim` succeeds.

Phase 2 log excerpt:
```
+ pip install tidyconf
Successfully installed tidyconf-1.4.0
EXIT=0
+ tidyconf check example.yaml
Error: example.yaml: No such file or directory
EXIT=1
```
Report: row 1 exit 0 match, row 2 exit 1 mismatch.

Phase 3: class "Quickstart uses a file the reader never created". Fix adds before the check command:
```
printf 'name: demo\nport: 8080\n' > example.yaml
```
Rerun in a new container: both rows exit 0, output `example.yaml: OK` matches the expected block.

---

## Exit Criteria

DONE when every Install and Quickstart command exits 0 in a fresh container of the oldest supported runtime and every expected output block matches, with each README change recorded in `quickstart_fixes`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Docker not available | **Stop**: report that clean-machine verification needs Docker or Podman (`podman run` accepts the same flags used here); do not run on the host and call it clean. |
| Phase 1 | Project needs a GPU or OS not available as an image | **Return**: report the commands as `not-run` with the reason; do not claim verification. |
| Phase 2 | Network blocked in the container | **Retry**: once with default bridge networking; if it still fails, **Stop** and report the network requirement. |
| Phase 3 | Same failure persists after three README fixes | **Stop**: the defect is in the code or packaging, not the README; report it to the user with the log. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
