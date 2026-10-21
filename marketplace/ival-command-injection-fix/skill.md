# OS Command and Argument Injection Fix

**One-line description:** Removes shell interpretation from every process launch that carries user data (Python `subprocess` with an argument list and `shell=False`, Node `execFile` or `spawn` without `shell`, Go `exec.Command` with separate arguments), blocks argument injection with `--` and leading-dash checks, replaces shell-outs with library calls where one exists, and proves the fix with metacharacter payload tests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `sink_map` (object, required): Output of `ival-sink-class-map`; rows with `class` = `command`.

---

## Outputs

- `command_fixes` (object): `fixed` (file, line, before, after, method: `library`, `arg_list`, or `allowlist`), `scanner_before`, `scanner_after`, `test_file`, `test_run`.

---

## Phase 1: Baseline and Classify Each Launch

### Entry Criteria
- One or more `command` rows in `sink_map.sinks`.

### Actions
1. Baseline scanner run:

| `stack` | Command | Rule IDs to count |
|---|---|---|
| python | `bandit -r <src> -t B602,B603,B604,B605,B606,B607 -f json -o bandit-cmd.json` | B602 (`shell=True`), B605 (`os.system` and friends), B607 (partial executable path) |
| node | `semgrep scan --config p/javascript --json -o semgrep-cmd.json` | `check_id` containing `child-process` or `exec` |
| go | `gosec -include=G204 -fmt=json -out=gosec-cmd.json ./...` | G204 (subprocess launched with variable) |

   Record the count as `scanner_before`.
2. For each launch, decide the fix with the first matching row:

| Situation | Method |
|---|---|
| The command does something a library can do (copy files, make an archive, resize an image, call git, ping a host, DNS lookup) | `library`: Python `shutil`, `zipfile`, `Pillow`, `pygit2`/`dulwich`; Node `fs.cp`, `archiver`, `sharp`; Go `os`, `archive/zip`, `go-git` |
| The program is fixed and user data is an argument | `arg_list` |
| The user chooses which program or subcommand runs | `allowlist`: map user keys to fixed argument arrays |
| The command needs pipes, globbing or redirection | `arg_list` with the pipe done in code (two processes, connect stdout to stdin), not in a shell |

### Output
Launch table with method; `scanner_before`.

### Quality Gate
- `scanner_before` from a saved report file.
- Every launch has a method.

---

## Phase 2: Rewrite Each Launch

### Entry Criteria
- Launch table exists.

### Actions
1. Safe forms:

```python
# python: list of arguments, no shell, absolute or resolved program path
subprocess.run(["/usr/bin/convert", "--", src_path, dst_path], check=True, shell=False, timeout=TIMEOUT_S)
```
```js
// node: execFile or spawn, args array, shell stays false (the default for both)
const { execFile } = require("node:child_process");
execFile("/usr/bin/convert", ["--", srcPath, dstPath], { timeout: TIMEOUT_MS }, cb);
```
```go
// go: exec.Command never invokes a shell; each argument is separate
cmd := exec.CommandContext(ctx, "/usr/bin/convert", "--", srcPath, dstPath)
```
   `TIMEOUT_S` / `TIMEOUT_MS` come from the existing request timeout or a user input; do not make up a value.
2. Remove every one of these: `os.system`, `os.popen`, `subprocess.*(..., shell=True)`, `child_process.exec`, `execSync`, `spawn(..., { shell: true })`, `exec.Command("sh", "-c", ...)`, `exec.Command("bash", "-c", ...)`, `exec.Command("cmd", "/c", ...)`.
3. Argument injection: an argument list still lets a value like `--output=/etc/passwd` or `-oProxyCommand=...` be read as an option. Do both:
   - put `--` before user-supplied positional arguments when the program supports it (most GNU tools and `git` do; check `<program> --help`);
   - reject values starting with `-` for positional arguments in the validator.
   Known dangerous options to watch for: `git` `--upload-pack`, `-c`; `ssh` `-o`; `tar` `--checkpoint-action`; `curl` `-o`, `-K`; `find` `-exec`.
4. `shlex.quote` (Python) is acceptable only when a shell is unavoidable (for example a remote command string passed to `ssh`), and only for POSIX shells. It does not protect `cmd.exe`.
5. Windows: Node.js refuses to spawn `.bat` and `.cmd` files without `shell: true` since the April 2024 security releases (CVE-2024-27980). Do not add `shell: true` to make such a call work; call the underlying executable instead.
6. Environment: pass `env` explicitly when the child does not need the parent's secrets.
7. One file at a time; run its tests after each.

### Output
Rewritten launches.

### Quality Gate
- Rerun the Phase 1 scanner; `scanner_after` is lower and every remainder is a fixed-program `arg_list` call listed with its argument sources.
- `rg -n "shell\s*=\s*True|os\.system|os\.popen|execSync\(|shell:\s*true|\"(sh|bash)\",\s*\"-c\"" <src>` prints nothing.

---

## Phase 3: Payload Tests

### Entry Criteria
- Launches rewritten.

### Actions
1. For each fixed function, call it with each payload and assert a marker file was not created and the command received the payload as one literal argument:

```
;touch /tmp/ival_pwned
$(touch /tmp/ival_pwned)
`touch /tmp/ival_pwned`
| touch /tmp/ival_pwned
&& touch /tmp/ival_pwned
--output=/tmp/ival_pwned
-oProxyCommand=touch /tmp/ival_pwned
```
   Use the test framework's temp directory instead of `/tmp` when possible, and delete the marker before each case.
2. Where possible, replace the real program in the test with a stub script on `PATH` that writes its `argv` to a file, then assert the stub received exactly the expected arguments (proves `--` is present and the payload is one argument).
3. Assert that values starting with `-` are rejected by the validator with a 400.
4. Run the tests, record the summary. Mutation check: switch one call back to the shell form, rerun, confirm a failure, revert.

### Output
`command_fixes`.

### Quality Gate
- Test summary shows 0 failed; the marker file does not exist after the run (`test ! -e <marker>` exits 0).
- Mutation run fails; reverted run passes.

---

## Worked Example

Illustrative. `stack` = `node`. `src/thumbs.js:19`:

Before:
```js
exec(`convert ${req.body.file} -resize 200x200 out/${id}.png`)
```
Phase 1: method = `library` (resizing is a `sharp` job).

After:
```js
await sharp(uploadPath(id)).resize(200, 200).toFile(`out/${id}.png`);
```
`req.body.file` is gone; the path comes from the stored upload ID (see `ival-path-traversal-fix`).

Phase 3: `Tests  8 passed (8)`; `test ! -e $TMPDIR/ival_pwned` exits 0.

---

## Exit Criteria

DONE when no process launch on a request path uses a shell, user values reach programs only as separate arguments after `--` with leading dashes rejected, shell-outs with a library equivalent are replaced, and payload tests pass and fail under mutation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | The program does not accept `--` | **Adjust**: rely on the leading-dash rejection and prefix relative paths with `./`. |
| Phase 2 | Command uses shell features heavily (pipes of 4 tools) | **Adjust**: move the pipeline into a fixed script file in the repo that takes arguments via `"$1"`, and call it with an argument list. |
| Phase 2 | Program path differs between hosts | **Adjust**: resolve once at startup with `shutil.which` / `exec.LookPath` and fail startup if missing. |
| Phase 3 | Marker file appears | **Stop**: the fix is incomplete; find the remaining shell. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
