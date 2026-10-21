# bats-core Test Harness Setup

**One-line description:** Installs bats-core plus the bats-support, bats-assert and bats-file helper libraries as pinned git submodules under `test/`, writes a shared `test/test_helper/common-setup.bash` that loads them and puts the script on `PATH`, and proves the harness with one smoke test run through `test/bats/bin/bats`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Repository root.
- `script_path` (string, required): Script under test, relative to `repo_dir`.

---

## Outputs

- `bats_harness` (object): bats-core version, helper library paths and pinned commits, the common setup file path, the run command, and the smoke test result.

---

## Phase 1: Install bats-core and Helpers

### Entry Criteria
- `repo_dir` is a git repository.
- `test/bats` does not already exist; if it does, record its version with `test/bats/bin/bats --version` and skip to Phase 2.

### Actions
1. Choose the install method with this rule:
   - Repository uses git and CI can fetch submodules: submodules (default, pins exact versions in the repo).
   - Repository is a Node project that already uses npm devDependencies: `npm install --save-dev bats bats-support bats-assert` and run with `npx bats`.
   - Otherwise: system package (`brew install bats-core`, `apt-get install bats`) and record the version; distribution packages can be old.
2. Submodule commands, run from `repo_dir`:

```
git submodule add https://github.com/bats-core/bats-core.git test/bats
git submodule add https://github.com/bats-core/bats-support.git test/test_helper/bats-support
git submodule add https://github.com/bats-core/bats-assert.git test/test_helper/bats-assert
git submodule add https://github.com/bats-core/bats-file.git test/test_helper/bats-file
```

3. Pin each to a release tag: `git -C test/bats checkout v<tag>` with a tag from `git -C test/bats tag --sort=-v:refname | head -n 5`. Do not invent a tag; pick one from that list.
4. Record `test/bats/bin/bats --version`.

### Output
bats and helpers present.

### Quality Gate
- `test/bats/bin/bats --version` prints a version.
- `git submodule status` lists all four paths with commits.

---

## Phase 2: Write the Common Setup

### Entry Criteria
- Phase 1 complete.

### Actions
1. Create `test/test_helper/common-setup.bash`:

```bash
_common_setup() {
  load 'test_helper/bats-support/load'
  load 'test_helper/bats-assert/load'
  load 'test_helper/bats-file/load'
  PROJECT_ROOT="$( cd "$( dirname "$BATS_TEST_FILENAME" )/.." >/dev/null 2>&1 && pwd )"
  PATH="$PROJECT_ROOT/bin:$PATH"     # directory that holds script_path
}
```

   `load` paths are relative to the directory of the current `.bats` file. Adjust `bin` to the directory of `script_path`.
2. Create `test/smoke.bats`:

```bash
#!/usr/bin/env bats
bats_require_minimum_version 1.5.0

setup() {
  load 'test_helper/common-setup'
  _common_setup
}

@test "script prints usage with -h" {
  run -0 <script-name> -h
  assert_output --partial 'Usage:'
}
```

   `bats_require_minimum_version 1.5.0` enables `run -N` exit-code checks and `run --separate-stderr`.
3. Add `.bats` files to `.gitattributes` with `eol=lf` if `shs-line-endings-exec-bit` has not already.

### Output
Common setup and smoke test files.

### Quality Gate
- Both files exist.
- `test/bats/bin/bats --count test/smoke.bats` prints `1`.

---

## Phase 3: Run the Smoke Test

### Entry Criteria
- Files written.

### Actions
1. Run `test/bats/bin/bats test/smoke.bats; echo "rc=$?"`.
2. Read the output: `ok 1 ...` and `rc=0` is a pass; `not ok 1` prints the failing assertion with expected and actual output below it.
3. Run once more with `--tap` to confirm machine-readable output for CI: `test/bats/bin/bats --tap test/`.
4. Record the run command in `bats_harness`: `test/bats/bin/bats -r test/` (`-r` recurses into subdirectories).

### Output
`bats_harness`.

### Quality Gate
- Smoke run prints `ok 1` and `rc=0`.

---

## Worked Example

Illustrative only.

```
$ git submodule add https://github.com/bats-core/bats-core.git test/bats
$ git -C test/bats tag --sort=-v:refname | head -n 3
v1.11.0
v1.10.0
v1.9.0
$ git -C test/bats checkout -q v1.11.0
$ test/bats/bin/bats --version
Bats 1.11.0
$ test/bats/bin/bats test/smoke.bats; echo "rc=$?"
smoke.bats
 ✓ script prints usage with -h

1 test, 0 failures
rc=0
```

---

## Exit Criteria

DONE when bats-core and helpers are pinned in the repository, the common setup loads them, and the smoke test passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No network to clone submodules | **Adjust**: use a system package and record its version; note the CI must install the same. |
| Phase 2 | `load: ... does not exist` | **Adjust**: the path is relative to the `.bats` file directory; fix the relative path. |
| Phase 3 | `command not found` for the script | **Adjust**: the `PATH` line points to the wrong directory, or the script lacks the executable bit. |
| Phase 3 | `bats_require_minimum_version: command not found` | **Adjust**: the installed bats is older than 1.5.0; pin a newer tag. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
