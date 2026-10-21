# Node CLI End-to-End Tests

**One-line description:** Tests the Node CLI as a real child process with `node:test` and `child_process.spawnSync`/`spawn` (run through `process.execPath` to avoid the Windows `.cmd` spawn restriction), and tests the packed tarball installed into a temporary prefix, asserting exit codes, separate streams, help snapshots, EPIPE and SIGINT.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cli_spec` (object, required): Commands and flags to cover.
- `exit_code_table` (object[], required): Codes to assert.
- `help_text_snapshot` (string[], required): Snapshot files.
- `stream_contract` (object, required): Stream rules and broken-pipe status.
- `signal_policy` (object, required): SIGINT and SIGTERM statuses.
- `project_dir` (string, required): Root of the Node project.

---

## Outputs

- `e2e_test_files` (string[]): Paths of the test files created.
- `e2e_run_log` (string): Full output of the final `node --test` run.

---

## Phase 1: Harness

### Entry Criteria
- `stack` == `node`; `package.json` has a `bin` entry; `npm ci` succeeded.

### Actions
1. Create `test/e2e/helpers.js`:
```js
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export const BIN = resolve('bin/logtrim.js');

export function run(args, { input, env = {} } = {}) {
  const home = mkdtempSync(join(tmpdir(), 'logtrim-'));
  const clean = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('LOGTRIM_')));
  return spawnSync(process.execPath, [BIN, ...args], {
    input, encoding: 'utf8', cwd: home,
    env: { ...clean, HOME: home, USERPROFILE: home, XDG_CONFIG_HOME: join(home, '.config'),
           APPDATA: join(home, 'AppData'), NO_COLOR: '1', COLUMNS: '100', ...env },
  });
}
```
2. Spawn `process.execPath` with the script path. Spawning `logtrim` or `logtrim.cmd` directly fails on Windows without `shell: true` in Node versions patched for CVE-2024-27980 (spawning `.cmd`/`.bat` throws `EINVAL`), and `shell: true` brings quoting bugs.
3. `spawnSync` returns `status` (exit code, `null` if killed by a signal) and `signal` (name, `null` otherwise). Assert both where it matters.

### Output
`helpers.js`.

### Quality Gate
- `node --test test/e2e/` runs (even with no tests yet) without import errors.

---

## Phase 2: Contract Tests

### Entry Criteria
- Harness exists.

### Actions
1. Create `test/e2e/contract.test.js` covering:

| Test | Assertion |
|---|---|
| help per command | `status === 0`, `stdout === readFileSync(snapshot, 'utf8')`, `stderr === ''` |
| version | `status === 0`, stdout contains `package.json` version |
| usage error per command | `status === <usage code>`, `stdout === ''`, stderr contains `--help` |
| missing file | runtime code, stderr names the file |
| stdin with `-` and piped | `run(['stats','-'], { input })` equals the file run |
| env var applies | `env: { LOGTRIM_COLOR: 'always' }` changes output as specified |
| no stack trace | stderr never matches `/at .+\(.+:\d+:\d+\)/` |

2. Loop over the command list from `cli_spec` to generate the usage-error tests with one `test()` per command.

### Output
Contract tests.

### Quality Gate
- Every command in `cli_spec` produces a test name in the `node --test` output.

---

## Phase 3: Pipes, Signals and the Packed Tarball

### Entry Criteria
- Contract tests pass.

### Actions
1. EPIPE test (POSIX): spawn with `spawn`, read the first `data` chunk from `child.stdout`, call `child.stdout.destroy()`, then await `exit` and assert the `stream_contract` status and that stderr has no `EPIPE` stack.
2. SIGINT test (POSIX): spawn, wait for the ready marker on stderr, `child.kill('SIGINT')`, assert `code === 130` in the `exit` event (`(code, signal)`). If the tool did not handle SIGINT, `code` is `null` and `signal` is `'SIGINT'`: that is a failure.
3. Packed tarball test, run as a separate script `test/e2e/pack.sh` or a CI step:
```
npm pack --pack-destination "$TMP"
npm install --global --prefix "$TMP/prefix" "$TMP"/logtrim-*.tgz
"$TMP/prefix/bin/logtrim" --version      # POSIX layout
# Windows layout: "$TMP/prefix/logtrim.cmd" --version
```
   This catches a `files` allowlist that omits `src/`, a missing shebang, and CRLF in the bin file.
4. Run `node --test test/e2e/ > e2e.txt 2>&1; echo "exit=$?"` and the pack script; save both outputs as `e2e_run_log`.

### Output
`e2e_test_files`, `e2e_run_log`.

### Quality Gate
- `e2e_run_log` contains `# fail 0` and `exit=0`.
- The packed install prints the `package.json` version.

---

## Do Not

- Do not use `execSync` with a command string; argument quoting differs per shell.
- Do not test only `src/` imports; the e2e run must start a process.
- Do not raise the test timeout to hide a hang; find why the process does not exit (open handles, unclosed stdin).

---

## Worked Example

Illustrative.
```
$ node --test test/e2e/
✔ help: trim (48ms)
✔ usage error: trim (41ms)
✖ SIGINT exits 130 (512ms)
  AssertionError: Expected values to be strictly equal: null !== 130
```
Finding: no SIGINT listener, so Node died by the signal. After adding the handler from `cli-signal-sigint-handling`:
```
# tests 14
# pass 14
# fail 0
$ sh test/e2e/pack.sh
1.4.0
```

---

## Exit Criteria

DONE when the CLI passes contract, pipe and signal tests as a child process and the packed tarball installs and runs from a temporary prefix.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `spawnSync` returns `error.code === 'EINVAL'` on Windows | **Adjust**: spawn `process.execPath` with the script path. |
| Phase 2 | Help snapshot differs by trailing newline | **Adjust**: regenerate the snapshot from the tool; do not trim in the test. |
| Phase 3 | Packed install lacks files | **Adjust**: fix `files` in `package.json`; verify with `npm pack --dry-run`. |
| Phase 3 | Test runner hangs after tests | **Retry**: close child stdin and await `exit` in every test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
