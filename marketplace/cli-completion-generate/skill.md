# CLI Shell Completion Generation

**One-line description:** Generates bash, zsh, fish and PowerShell completion scripts with each parser's own mechanism (`argcomplete` or `shtab`, click's `_PROG_COMPLETE` variable, Typer's `--show-completion`, yargs `.completion()`, cobra's `completion` command, `clap_complete`), adds dynamic value completion where the spec needs it, and records where each script installs.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cli_spec` (object, required): Commands, flags and enum values to complete.
- `tool_name` (string, required): Executable name.
- `project_dir` (string, required): Root of the project.
- `stack` (string, required): `python`, `node`, `go` or `rust`.

---

## Outputs

- `completion_scripts` (string[]): Paths of generated completion files, one per shell, for example `completions/logtrim.bash`.
- `completion_install_paths` (object): Per shell and per install method (user, system, Homebrew), the directory and file name.

---

## Phase 1: Pick the Mechanism

### Entry Criteria
- The parser flow for the stack is done.

### Actions
1. Find the parser library in `cli_spec.parser_library` and use exactly this mechanism:

| Library | Mechanism | Shells |
|---|---|---|
| argparse | `shtab` (static scripts: `shtab --shell=bash logtrim.cli.build_parser`) or `argcomplete` (runtime: `# PYTHON_ARGCOMPLETE_OK` near the top of the entry script and `argcomplete.autocomplete(parser)` before `parse_args`) | shtab: bash, zsh, tcsh; argcomplete: bash, zsh, others per its docs |
| click | env var protocol: `_LOGTRIM_COMPLETE=bash_source logtrim` (`zsh_source`, `fish_source`); variable is `_` + uppercased program name with dashes as underscores + `_COMPLETE` | bash (4.4+), zsh, fish |
| typer | `logtrim --show-completion SHELL` prints the script; `--install-completion` installs it | bash, zsh, fish, PowerShell |
| commander | none built in; write static scripts from the spec, or use a completion package and check its maintenance status | as written |
| yargs | `.completion('completion')` adds a `completion` command printing a bash/zsh script | bash, zsh |
| cobra | built-in `completion` command: `logtrim completion bash|zsh|fish|powershell` | bash, zsh, fish, PowerShell |
| clap | `clap_complete::generate(Shell::Bash, &mut Cli::command(), "logtrim", &mut io::stdout())` behind a hidden `completions` subcommand, or in `build.rs` via `generate_to` | bash, zsh, fish, PowerShell, elvish |

2. Prefer static scripts generated at build or release time when the package manager will install them (Homebrew, distro packages). Prefer runtime protocols (argcomplete, click, cobra `__complete`) when values depend on runtime state.
3. Decide per argument whether it needs dynamic values (for example names read from a config file). Only those get custom completion code.

### Output
Mechanism chosen per shell.

### Quality Gate
- Each shell the user supports maps to one row of the table above.

---

## Phase 2: Generate and Add Dynamic Values

### Entry Criteria
- Mechanism chosen.

### Actions
1. Generate one file per shell into `completions/`:
```
# cobra
go run ./cmd/logtrim completion bash > completions/logtrim.bash
go run ./cmd/logtrim completion zsh  > completions/_logtrim
go run ./cmd/logtrim completion fish > completions/logtrim.fish
go run ./cmd/logtrim completion powershell > completions/logtrim.ps1
# click
_LOGTRIM_COMPLETE=bash_source logtrim > completions/logtrim.bash
# clap (hidden subcommand)
cargo run -q -- completions zsh > completions/_logtrim
```
2. File names matter: zsh needs `_logtrim` (leading underscore), fish needs `logtrim.fish`, bash-completion lazy loading needs the file named exactly `logtrim`.
3. Dynamic values per library:

| Library | Hook |
|---|---|
| argcomplete | `parser.add_argument(...).completer = fn` |
| click / typer | `shell_complete=fn` on the parameter (click 8) / `autocompletion=fn` in Typer (check Typer docs for your version) |
| cobra | `ValidArgsFunction` for positionals, `cmd.RegisterFlagCompletionFunc("name", fn)` for flags, returning `cobra.ShellCompDirectiveNoFileComp` when files are not valid |
| clap | `#[arg(value_hint = ValueHint::FilePath)]` for file hints; enum values from `ValueEnum` complete automatically |
| yargs | a completion function passed to `.completion('completion', fn)` |

4. Enum flags from `cli_spec` (`--color`) must complete to their listed values. Check by reading the generated script for the values or running the protocol in Phase 3 of `cli-completion-verify-shells`.
5. cobra debugging: `logtrim __complete trim --color ""` prints candidates and a directive line, without a shell.

### Output
Files in `completions/`.

### Quality Gate
- One non-empty file per supported shell exists (`ls -l completions/`).
- `logtrim __complete ...` (cobra) or the equivalent protocol call lists `auto always never` for `--color`.

---

## Phase 3: Record Install Locations

### Entry Criteria
- Scripts generated.

### Actions
1. Record these locations in `completion_install_paths`:

| Shell | User install | System / package install | Homebrew |
|---|---|---|---|
| bash (bash-completion 2) | `${XDG_DATA_HOME:-$HOME/.local/share}/bash-completion/completions/logtrim` | `/usr/share/bash-completion/completions/logtrim` | `$(brew --prefix)/etc/bash_completion.d/logtrim` |
| zsh | a directory in `$fpath` added before `compinit` runs, file `_logtrim` | `/usr/share/zsh/site-functions/_logtrim` (path varies by distro; check `echo $fpath`) | `$(brew --prefix)/share/zsh/site-functions/_logtrim` |
| fish | `~/.config/fish/completions/logtrim.fish` | `/usr/share/fish/vendor_completions.d/logtrim.fish` | `$(brew --prefix)/share/fish/vendor_completions.d/logtrim.fish` |
| PowerShell | dot-source the script from `$PROFILE` | same | n/a |

2. Add a short "Shell completion" section to the README with the one-line user install per shell.
3. Regenerate scripts in CI or the release step, so they never drift from the parser.

### Output
`completion_scripts`, `completion_install_paths`.

### Quality Gate
- `completion_install_paths` has a user path for every generated file.
- The release or CI config contains the regeneration command (grep for it).

---

## Do Not

- Do not hand-edit generated completion scripts; regenerate them.
- Do not invent a completion env var or subcommand; use the exact names in the Phase 1 table and confirm with `--help`.
- Do not print completion scripts from the root help unless the spec asks.

---

## Worked Example

Illustrative. Rust/clap `logtrim` with a hidden `completions` subcommand:
```
$ cargo run -q -- completions bash > completions/logtrim.bash
$ cargo run -q -- completions zsh  > completions/_logtrim
$ cargo run -q -- completions fish > completions/logtrim.fish
$ ls -l completions/
-rw-r--r-- 1 dev dev 6120 logtrim.bash
-rw-r--r-- 1 dev dev 3554 _logtrim
-rw-r--r-- 1 dev dev 1408 logtrim.fish
$ grep -c "always" completions/logtrim.fish
1
```

---

## Exit Criteria

DONE when every supported shell has a generated script with the correct file name, enum and dynamic values complete, install locations are recorded, and regeneration is part of the build.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Library has no completion support (commander) | **Adjust**: write static scripts from `cli_spec`, and add a test that compares their command list to the parser's. |
| Phase 2 | click script empty | **Adjust**: confirm the variable name: `_` + program name uppercased, dashes to underscores, + `_COMPLETE`. |
| Phase 2 | Completion suggests files where none are valid | **Adjust**: return the no-file directive (cobra) or set a value hint (clap). |
| Phase 3 | Path differs on the target distro | **Adjust**: read it from `pkg-config --variable=completionsdir bash-completion` and record that. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
