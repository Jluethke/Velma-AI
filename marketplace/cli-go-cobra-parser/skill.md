# Go cobra Parser

**One-line description:** Implements the spec's commands and flags with `spf13/cobra` and `pflag` (constructor-built command tree, `RunE`, persistent flags, positional-arg validators, mutually exclusive and required flags), silences cobra's usage dump on runtime errors, and maps flag and argument errors to exit 2 with a typed error.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cli_spec` (object, required): Interface contract from `cli-spec-commands-flags-exits`.
- `exit_code_table` (object[], required): Exit codes from the same flow.
- `project_dir` (string, required): Root of the Go module (contains `go.mod`).

---

## Outputs

- `parser_module` (string): Path of the package that builds the command tree, for example `internal/cli/root.go`.
- `parser_check_log` (string): Captured `go test` output and manual checks.

---

## Phase 1: Command Tree

### Entry Criteria
- `cli_spec.parser_library` is empty or `cobra` and `stack` == `go`.
- `go version` prints a toolchain; `go.mod` exists (`go mod init github.com/ORG/logtrim` if not).

### Actions
1. Run `go get github.com/spf13/cobra@latest`. Do not use the `cobra-cli` generator here: it writes package-level globals that break repeated test runs.
2. Create `internal/cli/root.go` with a constructor, never package-level command variables:
```go
package cli

import (
    "fmt"
    "github.com/spf13/cobra"
)

type usageError struct{ err error }
func (u usageError) Error() string { return u.err.Error() }
func (u usageError) Unwrap() error { return u.err }

func usageArgs(v cobra.PositionalArgs) cobra.PositionalArgs {
    return func(cmd *cobra.Command, args []string) error {
        if err := v(cmd, args); err != nil { return usageError{err} }
        return nil
    }
}

type options struct{ verbose int; color string }

func NewRootCmd(version string) *cobra.Command {
    o := &options{}
    root := &cobra.Command{
        Use:           "logtrim",
        Short:         "Trim old log lines and report counts",
        Version:       version,
        SilenceUsage:  true,
        SilenceErrors: true,
    }
    root.PersistentFlags().CountVarP(&o.verbose, "verbose", "v", "more detail on stderr")
    root.PersistentFlags().StringVar(&o.color, "color", "auto", "auto, always or never")
    root.SetFlagErrorFunc(func(c *cobra.Command, err error) error { return usageError{err} })
    root.AddCommand(newTrimCmd(o))
    return root
}

func newTrimCmd(o *options) *cobra.Command {
    var olderThan string
    var inPlace bool
    cmd := &cobra.Command{
        Use:   "trim [FILE...]",
        Short: "Drop lines older than DURATION",
        Args:  usageArgs(cobra.ArbitraryArgs),
        RunE: func(cmd *cobra.Command, args []string) error {
            fmt.Fprintln(cmd.ErrOrStderr(), "trimming", len(args), "files")
            return nil
        },
    }
    cmd.Flags().StringVar(&olderThan, "older-than", "", "DURATION, for example 24h")
    cmd.Flags().BoolVarP(&inPlace, "in-place", "i", false, "rewrite files in place")
    _ = cmd.MarkFlagRequired("older-than")
    return cmd
}
```
3. Map spec types:

| Spec type | pflag call |
|---|---|
| bool | `BoolVarP` (user writes `--in-place` or `--in-place=false`) |
| count | `CountVarP` |
| repeatable string | `StringSliceVar` (splits on commas) or `StringArrayVar` (no comma splitting) |
| duration | `DurationVar` (accepts `24h`, `90m`) |
| int | `IntVar` |
| global flag | `PersistentFlags()` on the root |
| required | `MarkFlagRequired` |
| mutually exclusive | `MarkFlagsMutuallyExclusive("json", "format")` (cobra 1.5 and later) |
| positional arity | `cobra.ExactArgs(n)`, `cobra.MinimumNArgs(n)`, `cobra.MaximumNArgs(n)`, `cobra.NoArgs`, combined with `cobra.MatchAll` |

4. Use `StringArrayVar` when values may contain commas (file paths, expressions).
5. Use `RunE` (returns error), never `Run` with `os.Exit` inside: `os.Exit` skips deferred cleanup.

### Output
`internal/cli/root.go` with `NewRootCmd`.

### Quality Gate
- `go vet ./...` prints nothing.
- `go run ./cmd/logtrim --help` exits 0 and lists every command in `cli_spec`.

---

## Phase 2: Exit Codes in main

### Entry Criteria
- Command tree builds.

### Actions
1. Create `cmd/logtrim/main.go`:
```go
package main

import (
    "fmt"
    "os"
    "example.com/logtrim/internal/cli"
)

var version = "dev"

func main() { os.Exit(run()) }

func run() int {
    err := cli.NewRootCmd(version).Execute()
    if err == nil { return 0 }
    fmt.Fprintf(os.Stderr, "logtrim: %v\n", err)
    if cli.IsUsage(err) {
        fmt.Fprintln(os.Stderr, "Run 'logtrim --help' for usage.")
        return 2
    }
    return 1
}
```
   and in package `cli` (add `"errors"` to its imports): `func IsUsage(err error) bool { var u usageError; return errors.As(err, &u) }`. Keep `main` this small: `os.Exit` runs after `run` returns, so every `defer` inside `run` and the commands has already executed.
2. Required-flag and mutual-exclusion errors are produced by cobra's flag validation and are not passed through `SetFlagErrorFunc`. Detect them by message in `IsUsage` only if `exit_code_table` requires 2 for them, and confirm the exact text by running the command, for example `required flag(s) "older-than" not set`. Record this choice in `parser_check_log`.
3. Unknown subcommands return `unknown command "x" for "logtrim"`; treat it as a usage error the same way (match by running it and reading the text).
4. `SilenceUsage: true` stops cobra from printing the full usage block for runtime errors such as a missing file. `SilenceErrors: true` stops cobra printing the error so `main` prints it once.

### Output
`cmd/logtrim/main.go` mapping errors to codes.

### Quality Gate
- `go run ./cmd/logtrim trim --older-than 1h --bogus; echo $?` prints `unknown flag: --bogus` and `2`.
- `go run ./cmd/logtrim trim missing.log --older-than 1h; echo $?` prints one error line, no usage block, and `1`.

---

## Phase 3: Tests

### Entry Criteria
- `run` logic exists.

### Actions
1. Create `internal/cli/root_test.go`:
```go
func TestUnknownFlagIsUsage(t *testing.T) {
    cmd := NewRootCmd("test")
    cmd.SetArgs([]string{"trim", "--older-than", "1h", "--bogus"})
    cmd.SetOut(io.Discard); cmd.SetErr(io.Discard)
    if err := cmd.Execute(); !IsUsage(err) {
        t.Fatalf("want usage error, got %v", err)
    }
}
```
2. Build a new root with `NewRootCmd` in every test. Reusing one instance keeps flag values from the previous `Execute`.
3. Send output through `cmd.OutOrStdout()` and `cmd.ErrOrStderr()` in `RunE` so `SetOut`/`SetErr` capture it.
4. Run `go test ./internal/cli/... -v`; save output as `parser_check_log`.

### Output
`parser_module`, `parser_check_log`.

### Quality Gate
- `go test` output ends with `ok` for the package and contains no `FAIL`.
- One test asserts `IsUsage` for a bad flag and one for a bad positional count.

---

## Do Not

- Do not declare flags in `init()` on package-level `var rootCmd`; tests then share state.
- Do not use single-dash long flags (`-older-than`): pflag is GNU-style and parses that as short flags.
- Do not remove `MarkFlagRequired` to silence a failing test.

---

## Worked Example

Illustrative. `logtrim` spec, cobra 1.8:
```
$ go run ./cmd/logtrim trim --older-than 1h --bogus
logtrim: unknown flag: --bogus
Run 'logtrim --help' for usage.
$ echo $?
2
$ go test ./internal/cli/... -v
=== RUN   TestUnknownFlagIsUsage
--- PASS: TestUnknownFlagIsUsage (0.00s)
ok   example.com/logtrim/internal/cli  0.012s
```

---

## Exit Criteria

DONE when the command tree matches `cli_spec`, flag and argument errors exit 2 without a usage dump on runtime errors, runtime failures exit 1, and the tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `MarkFlagsMutuallyExclusive` undefined | **Adjust**: upgrade cobra to 1.5 or later, or validate in `PreRunE` returning `usageError`. |
| Phase 2 | Required-flag error exits 1 | **Adjust**: extend `IsUsage` with the observed message, or validate in `PreRunE` and return `usageError`. |
| Phase 3 | Second test sees first test's flags | **Adjust**: build a new command per test. |
| Phase 3 | Test fails | **Retry**: fix the code; never weaken the assertion. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
