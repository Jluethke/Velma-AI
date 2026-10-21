# CLI Config File and Env Var Precedence

**One-line description:** Implements and tests one layered settings resolver (flag, then environment variable, then project config, then user config in the platform's config directory, then built-in default) using the stack's standard pieces (`platformdirs`/`tomllib`, `env-paths`/`cosmiconfig`, `os.UserConfigDir`/viper, `directories`/clap `env`), with a printable effective-config view.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cli_spec` (object, required): Flags and their env var names.
- `tool_name` (string, required): Used for directory and file names.
- `project_dir` (string, required): Root of the project.
- `stack` (string, required): `python`, `node`, `go` or `rust`.

---

## Outputs

- `precedence_table` (object): The ordered layers, file paths per OS, file format, env var names and the resolver's location.
- `config_findings` (object[]): Each precedence test result and each defect fixed.

---

## Phase 1: Define the Layers and Paths

### Entry Criteria
- `cli_spec` lists which flags are configurable by env or file.

### Actions
1. Fix the order (highest wins). Do not reorder it:

| Rank | Layer | Notes |
|---|---|---|
| 1 | Command-line flag | only when the user typed it, not the flag's default |
| 2 | Environment variable `TOOL_NAME` | uppercase prefix, dashes to underscores |
| 3 | File given by `--config PATH` or `TOOL_CONFIG` | when present, replaces layers 4 and 5 |
| 4 | Project file, found by walking up from the current directory, for example `.logtrim.toml` | optional; include only if `cli_spec` asks |
| 5 | User file `<config dir>/<tool>/config.toml` | |
| 6 | Built-in default | |

2. Resolve the user config directory with the platform convention:

| OS | Directory | Source |
|---|---|---|
| Linux / BSD | `$XDG_CONFIG_HOME`, else `~/.config` | XDG Base Directory Specification |
| macOS | `~/Library/Application Support` (platform API default) or `~/.config` (common for CLIs) | pick one and write it in `precedence_table`; ask the user if unsure |
| Windows | `%APPDATA%` (roaming) | Known Folders |

3. Choose the per-stack pieces:

| Stack | Config dir | Parse file | Notes |
|---|---|---|---|
| python | `platformdirs.user_config_dir("logtrim")` | `tomllib` (3.11+, read-only), `tomli` before 3.11 | open TOML in binary mode: `tomllib.load(open(p, "rb"))` |
| node | `env-paths` package `envPaths('logtrim', {suffix: ''}).config`, or `cosmiconfig` for project-file search | `smol-toml` or JSON | cosmiconfig searches `package.json` key and rc files |
| go | `os.UserConfigDir()` (XDG on Linux, `Library/Application Support` on macOS, `%AppData%` on Windows) | `viper` or `BurntSushi/toml` / `pelletier/go-toml/v2` | viper: `SetEnvPrefix`, `AutomaticEnv`, `SetEnvKeyReplacer(strings.NewReplacer("-", "_"))`, `BindPFlags` |
| rust | `directories::ProjectDirs::from("", "", "logtrim")?.config_dir()` | `toml` + `serde` | clap `#[arg(env = ...)]` covers layers 1 and 2 |

### Output
Draft `precedence_table`.

### Quality Gate
- `precedence_table` lists 6 ranks in the order above and one concrete path per OS.

---

## Phase 2: Implement One Resolver

### Entry Criteria
- `precedence_table` drafted.

### Actions
1. Create one module (for example `config.py`, `config.js`, `internal/config/config.go`, `src/config.rs`). Command code reads settings only from the resolver's result.
2. Merge layers from lowest to highest: start with defaults, overlay user file, project file, env, then flags the user actually set.
3. Detect "flag actually set" per library:

| Library | Was the flag typed? |
|---|---|
| argparse | use `default=None` and treat `None` as unset |
| click / typer | `ctx.get_parameter_source("name")` is `ParameterSource.COMMANDLINE` |
| commander | `cmd.getOptionValueSource('name') === 'cli'` |
| yargs | flags absent from `process.argv` are not set; with `.env()`, yargs already applies env under flags |
| cobra | `cmd.Flags().Changed("name")` |
| clap | `matches.value_source("name") == Some(ValueSource::CommandLine)` |

4. Parse env values with explicit rules: booleans accept `1/true/yes/on` and `0/false/no/off` (case-insensitive), anything else is a config error. An empty env var counts as unset unless `cli_spec` says otherwise.
5. A missing user or project file is normal. A file that exists but fails to parse is an error: print the path and parser message to stderr and exit with the config code from `exit_code_table` (78 EX_CONFIG if the sysexits scheme is used, else 1).
6. Add a read-only view, for example `logtrim config show`, printing each effective value and the layer it came from. Mask secrets (print `***`).

### Output
Resolver module and `config show`.

### Quality Gate
- `grep` for direct env reads outside the resolver returns nothing: `os.environ`, `process.env`, `os.Getenv`, `std::env::var` appear only in the config module.

---

## Phase 3: Precedence Matrix Test

### Entry Criteria
- Resolver exists.

### Actions
1. In the test harness, isolate the environment for every run: point `HOME`, `XDG_CONFIG_HOME` and `APPDATA` at a temporary directory, and clear every `TOOL_` variable. Never read the developer's real config in tests.
2. For one representative setting (for example `color`), run 5 cases and assert the source and value:

| Case | User file | Env | Flag | Expect |
|---|---|---|---|---|
| A | none | none | none | default, source `default` |
| B | `color = "never"` | none | none | `never`, source `user file` |
| C | `color = "never"` | `LOGTRIM_COLOR=always` | none | `always`, source `env` |
| D | `color = "never"` | `LOGTRIM_COLOR=always` | `--color=auto` | `auto`, source `flag` |
| E | file with a syntax error | none | none | config error, spec exit code, path in stderr |

3. Repeat case B with `--config other.toml` and confirm the user file is ignored.
4. Record results in `config_findings`.

### Output
`precedence_table`, `config_findings`.

### Quality Gate
- All 5 cases plus the `--config` case pass in the test run output.
- Case E's stderr contains the config file path.

---

## Do Not

- Do not let a flag's default override env or file values; only a typed flag wins.
- Do not write a default config file on first run without the user asking.
- Do not print secret values in `config show` or in errors.

---

## Worked Example

Illustrative. Go/cobra with viper, `logtrim`:
```
$ XDG_CONFIG_HOME=$PWD/tmpcfg LOGTRIM_COLOR=always go run ./cmd/logtrim config show
color      = always   (env LOGTRIM_COLOR)
older-than = 168h     (user file tmpcfg/logtrim/config.toml)
verbose    = 0        (default)
$ XDG_CONFIG_HOME=$PWD/tmpcfg LOGTRIM_COLOR=always go run ./cmd/logtrim --color=never config show | head -1
color      = never    (flag)
$ go test ./internal/config/... -run TestPrecedence -v
--- PASS: TestPrecedence/A (0.00s)
...
--- PASS: TestPrecedence/E (0.00s)
ok
```

---

## Exit Criteria

DONE when one resolver applies the 6 layers in order, only typed flags beat lower layers, malformed files fail with the spec code, and the 5-case matrix passes in isolated environments.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Team disagrees on macOS path | **Stop**: ask the user to pick; record the choice. |
| Phase 2 | viper returns the flag default over the file | **Adjust**: check `Changed` before binding, or read through viper only after `BindPFlags` and confirm with case B. |
| Phase 3 | Test passes locally, fails in CI | **Adjust**: a real config or env var leaked in; isolate `HOME`, `XDG_CONFIG_HOME`, `APPDATA`. |
| Phase 3 | Case E exits 0 | **Retry**: parse errors are being swallowed; surface them. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
