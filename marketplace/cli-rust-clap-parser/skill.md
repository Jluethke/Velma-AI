# Rust clap Parser

**One-line description:** Implements the spec's commands and flags with clap 4 derive (`Parser`, `Subcommand`, `ValueEnum`, `ArgAction::Count`, `env` feature, `value_parser!` ranges, conflicts and groups), uses `try_parse` to keep exit 2 for usage errors and 0 for help, and locks the definition with `Command::debug_assert`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cli_spec` (object, required): Interface contract from `cli-spec-commands-flags-exits`.
- `exit_code_table` (object[], required): Exit codes from the same flow.
- `project_dir` (string, required): Root of the Cargo package (contains `Cargo.toml`).

---

## Outputs

- `parser_module` (string): Path of the module that defines the `Cli` struct, for example `src/cli.rs`.
- `parser_check_log` (string): Captured `cargo test` output and manual checks.

---

## Phase 1: Derive the Interface

### Entry Criteria
- `stack` == `rust`.
- `cargo --version` prints a toolchain.

### Actions
1. Run `cargo add clap --features derive`. Add `,env` to the features (`cargo add clap --features derive,env`) only if `cli_spec` binds any flag to an environment variable; `#[arg(env = ...)]` does not compile without it.
2. Create `src/cli.rs` only:
```rust
use clap::{ArgAction, Parser, Subcommand, ValueEnum};
use std::path::PathBuf;

#[derive(Parser, Debug)]
#[command(name = "logtrim", version, about = "Trim old log lines and report counts")]
pub struct Cli {
    /// More detail on stderr (repeat for more)
    #[arg(short, long, action = ArgAction::Count, global = true)]
    pub verbose: u8,
    #[arg(long, value_enum, default_value_t = ColorWhen::Auto, env = "LOGTRIM_COLOR", global = true)]
    pub color: ColorWhen,
    #[command(subcommand)]
    pub command: Command,
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, ValueEnum)]
pub enum ColorWhen { Auto, Always, Never }

#[derive(Subcommand, Debug)]
pub enum Command {
    /// Drop lines older than DURATION
    Trim {
        #[arg(long, value_name = "DURATION", env = "LOGTRIM_OLDER_THAN")]
        older_than: String,
        #[arg(short, long)]
        in_place: bool,
        #[arg(long, value_parser = clap::value_parser!(u32).range(1..))]
        max_files: Option<u32>,
        #[arg(value_name = "FILE")]
        files: Vec<PathBuf>,
    },
    /// Count lines per level
    Stats {
        #[arg(long, conflicts_with = "format")]
        json: bool,
        #[arg(long, value_enum)]
        format: Option<Format>,
        files: Vec<PathBuf>,
    },
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, ValueEnum)]
pub enum Format { Table, Csv }
```
3. Map spec types:

| Spec type | clap derive |
|---|---|
| bool | `bool` field with `#[arg(short, long)]` (`ArgAction::SetTrue`) |
| count | `u8` with `action = ArgAction::Count` |
| repeatable | `Vec<T>` with `#[arg(long)]` (`--tag a --tag b`) |
| enum | `#[derive(ValueEnum)]` type with `value_enum` |
| optional value | `Option<T>` |
| required flag | non-`Option` field with `#[arg(long)]` and no default |
| zero or more operands | `Vec<PathBuf>` positional |
| bounded int | `value_parser = clap::value_parser!(u32).range(1..)` |
| conflict | `conflicts_with = "other"`; groups via `#[group(...)]` |
| global flag | `global = true` |

4. Use `PathBuf` for paths, never `String`, so non-UTF-8 paths on Unix still parse.
5. Doc comments (`///`) become help text; the first line is the short help.

### Output
`src/cli.rs` with `Cli`.

### Quality Gate
- `cargo build` prints no errors and no warnings from `src/cli.rs`.
- `cargo run -q -- --help` exits 0 and lists every command in `cli_spec`.

---

## Phase 2: Parse and Exit Codes

### Entry Criteria
- `Cli` compiles.

### Actions
1. In `src/main.rs`:
```rust
mod cli;
use clap::Parser;
use std::process::ExitCode;

fn main() -> ExitCode {
    let cli = match cli::Cli::try_parse() {
        Ok(c) => c,
        Err(e) => {
            let _ = e.print();          // help/version go to stdout, errors to stderr
            return ExitCode::from(e.exit_code() as u8);
        }
    };
    match run(cli) {
        Ok(()) => ExitCode::SUCCESS,
        Err(err) => { eprintln!("logtrim: {err:#}"); ExitCode::from(1) }
    }
}
```
2. `e.exit_code()` returns 0 for `--help` and `--version` and 2 for usage errors, which matches the spec scheme. `Cli::parse()` does the same and calls `std::process::exit` directly; prefer `try_parse` so destructors run and tests can inspect the error kind (`e.kind() == clap::error::ErrorKind::DisplayHelp`).
3. Return `ExitCode` from `main` rather than calling `std::process::exit`, which skips `Drop` (temp files, buffered writers).
4. Add other codes from `exit_code_table` by returning `ExitCode::from(N)` from `run` error variants.

### Output
`src/main.rs` with exit code mapping.

### Quality Gate
- `cargo run -q -- trim --older-than 1d --bogus; echo $?` prints `error: unexpected argument '--bogus' found` and `2`.
- `cargo run -q -- --version; echo $?` prints `logtrim` with the `Cargo.toml` version and `0`.

---

## Phase 3: Tests

### Entry Criteria
- `main.rs` compiles.

### Actions
1. Append to `src/cli.rs`:
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use clap::CommandFactory;

    #[test]
    fn verify_cli() { Cli::command().debug_assert(); }

    #[test]
    fn json_conflicts_with_format() {
        let e = Cli::try_parse_from(["logtrim", "stats", "--json", "--format", "csv"]).unwrap_err();
        assert_eq!(e.kind(), clap::error::ErrorKind::ArgumentConflict);
        assert_eq!(e.exit_code(), 2);
    }

    #[test]
    fn max_files_rejects_zero() {
        assert!(Cli::try_parse_from(["logtrim", "trim", "--older-than", "1d", "--max-files", "0"]).is_err());
    }
}
```
2. `debug_assert()` catches definition bugs (duplicate short flags, conflicts naming a missing arg) at test time instead of at a user's first run.
3. When a test reads an `env` flag, set and remove the variable inside the test and run those tests with `cargo test -- --test-threads=1`, because environment variables are process-wide.
4. Run `cargo test`; save output as `parser_check_log`.

### Output
`parser_module`, `parser_check_log`.

### Quality Gate
- `cargo test` prints `test result: ok` with `0 failed`.
- `verify_cli` is present and passing.

---

## Do Not

- Do not use clap 3 attribute names (`#[clap(...)]`, `#[structopt(...)]`) in clap 4 code; use `#[command]` and `#[arg]`.
- Do not call `std::process::exit` in library code.
- Do not delete `verify_cli` when it fails; it is reporting a real definition bug.

---

## Worked Example

Illustrative. clap 4 project:
```
$ cargo run -q -- trim --older-than 1d --bogus
error: unexpected argument '--bogus' found

Usage: logtrim trim [OPTIONS] --older-than <DURATION> [FILE]...

For more information, try '--help'.
$ echo $?
2
$ cargo test -q
running 3 tests
...
test result: ok. 3 passed; 0 failed; 0 ignored
```

---

## Exit Criteria

DONE when `Cli` matches `cli_spec`, `debug_assert` passes, usage errors exit 2, help and version exit 0, and the tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `no method named env` or attribute error on `env` | **Adjust**: enable the `env` feature on clap. |
| Phase 1 | Two args share a short flag | **Adjust**: `debug_assert` names them; change one per `cli_spec`. |
| Phase 2 | Help printed to stderr | **Adjust**: use `e.print()` (it routes by kind), not `eprintln!("{e}")`. |
| Phase 3 | Test fails | **Retry**: fix `Cli`; never weaken the assertion. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
