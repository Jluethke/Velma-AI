# TDD Filesystem and Environment Boundary

**One-line description:** Test-drives code that reads or writes files, the working directory or environment variables by giving each test an isolated temporary directory and scoped environment through the stack's own fixtures, so tests never touch real user files and never leak state into each other.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `double_plan` (object[], required): From `tdd-test-double-choice`; rows with role filesystem or environment and the `boundaries` list.
- `stack` (string, required): `python`, `node`, `go`, `rust` or `java`.

---

## Outputs

- `fs_env_tests` (object): Seams added (path or config parameters), tests written, and output of the suite run in random order showing no leaks.

---

## Phase 1: Make Paths and Config Parameters

### Entry Criteria
- `double_plan.boundaries` contains `filesystem` or `environment`.

### Actions
1. Search the unit for hard-coded locations and env reads: `open("`, `Path.home()`, `os.getcwd`, `os.environ`, `os.getenv` (Python); `fs.`, `process.cwd()`, `process.env`, `os.homedir()` (Node); `os.Open`, `os.Getenv`, `os.Getwd` (Go); `std::fs::`, `std::env::var` (Rust); `new File(`, `Files.`, `System.getenv`, `System.getProperty("user.home")` (Java).
2. For each hit, change the unit so the caller passes the path or the value in (a function parameter or a config object built once at program start). Only `main` or the composition root reads real environment variables.
3. One change per step; run the full suite after each; it must stay green.

### Output
Unit takes paths and config as parameters.

### Quality Gate
- Rerunning the Phase 1 search on the unit (not on `main`) finds no env reads and no hard-coded absolute paths.
- Full suite exit code 0.

---

## Phase 2: Isolated Temp Dirs and Scoped Env in Tests

### Entry Criteria
- Seams in place.

### Actions
1. Use the stack's own isolation tools:

| stack | Temporary directory | Scoped environment variable |
|---|---|---|
| python (pytest) | `tmp_path` fixture (a `pathlib.Path`, unique per test) | `monkeypatch.setenv("KEY", "v")`, `monkeypatch.delenv("KEY", raising=False)`; `monkeypatch.chdir(tmp_path)` for cwd. All undone after the test |
| python (unittest) | `d = tempfile.TemporaryDirectory(); self.addCleanup(d.cleanup)` | `with unittest.mock.patch.dict(os.environ, {"KEY": "v"}, clear=False):` |
| node | `const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'app-'))` in `beforeEach`; `fs.rmSync(dir, { recursive: true, force: true })` in `afterEach` | Vitest `vi.stubEnv('KEY', 'v')` + `vi.unstubAllEnvs()` in `afterEach`; Jest: copy `process.env` in `beforeEach`, restore in `afterEach` |
| go | `dir := t.TempDir()` (removed automatically) | `t.Setenv("KEY", "v")` (restored automatically; panics if the test or an ancestor called `t.Parallel()`) |
| rust | `let dir = tempfile::tempdir()?;` (add `tempfile` to `[dev-dependencies]`; deleted on drop) | avoid: `std::env::set_var` affects all test threads and is `unsafe` in the 2024 edition. Pass config values instead |
| java | `@TempDir Path tempDir` field or parameter (JUnit 5) | the JVM cannot set env vars for itself; pass config objects, or use `System.setProperty` with restore in `@AfterEach` for properties |

2. For code that only reads a tree of files, prefer an in-memory filesystem when the stack has a standard one: Go `testing/fstest.MapFS` with the unit accepting `fs.FS`; Python `io.StringIO` for file-like objects; Node `memfs` only if the project already uses it.
3. Never write under the home directory, the repo root or `/tmp` with a fixed name. Fixed names collide when tests run in parallel.

### Output
Tests using isolated directories and scoped env.

### Quality Gate
- Searching new tests for absolute paths (`"/home`, `"C:\\`, `"/tmp/`, `Path.home()`) returns nothing.
- `git status --porcelain` after a full test run shows no new untracked files.

---

## Phase 3: Drive File and Env Behaviors, Then Check for Leaks

### Entry Criteria
- Isolation tools in place.

### Actions
1. Write one failing test at a time for the applicable cases: file missing, file empty, file present with valid content, file with invalid content, directory not writable (skip on Windows if permissions cannot be set; record it), env var unset, env var set to empty string, env var set to an invalid value.
2. Assert on the outcome the requirement names (error type, default value, message), not on the exact OS error string, which differs by platform.
3. Run the suite in random order to catch leaks: pytest with `pytest-randomly` installed (`python -m pytest -p randomly`), Jest `npx jest --randomize`, Vitest `npx vitest run --sequence.shuffle`, Go `go test -shuffle=on ./...`, cargo default parallel threads (run twice), JUnit `-Djunit.jupiter.testmethod.order.default=org.junit.jupiter.api.MethodOrderer$Random`. Check each flag with `--help` for the installed version.

### Output
`fs_env_tests`.

### Quality Gate
- Two random-order runs both exit 0.
- Each case listed in step 1 that applies has a test name in `fs_env_tests`.

---

## Worked Example

Illustrative only. `stack` = `go`. `LoadConfig()` reads `os.Getenv("APP_PORT")` and `~/.app/config.yaml`.

Phase 1: change to `LoadConfig(fsys fs.FS, getenv func(string) string)`; `main` passes `os.DirFS(home)` and `os.Getenv`.

Phase 2/3:

```go
func TestLoadConfig_MissingPortUsesDefaultFromFile(t *testing.T) {
	fsys := fstest.MapFS{"config.yaml": {Data: []byte("port: 8080\n")}}
	cfg, err := LoadConfig(fsys, func(string) string { return "" })
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.Port != 8080 {
		t.Errorf("got %d, want %d", cfg.Port, 8080)
	}
}
```

`go test -shuffle=on -count=1 ./config` prints `-test.shuffle 1718034411` and `ok`.

---

## Exit Criteria

DONE when the unit takes paths and config as inputs, tests use per-test temp dirs or in-memory filesystems with scoped env, and random-order runs leave no files and no failures.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Env read is deep in a library the project does not own | **Adjust**: read it once in `main` and pass the value; do not patch the library. |
| Phase 2 | `t.Setenv` panics with `t.Parallel` | **Adjust**: pass the value as a parameter, or remove `t.Parallel()` from that test only. |
| Phase 3 | Random order fails | **Return**: send to `tdd-test-isolation-audit` with the seed or order printed. |
| Phase 3 | Permission test cannot run on this OS | **Adjust**: skip it with the runner's skip marker and a reason naming the OS. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
