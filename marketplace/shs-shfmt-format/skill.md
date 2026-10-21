# Format With shfmt

**One-line description:** Formats shell scripts with `shfmt` using settings committed in `.editorconfig` (`indent_size`, `switch_case_indent`, `binary_next_line`, `shell_variant`), runs it in diff mode (`shfmt -d`) as a check that fails on unformatted files, and confirms formatting did not change behavior with `bash -n`/`sh -n` and a test run.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_path` (string, required): Script or directory to format.
- `shell_dialect` (string, required): `bash` or `posix`.

---

## Outputs

- `format_report` (object): shfmt version, the `.editorconfig` block used, files changed, final `shfmt -d` exit code.

---

## Phase 1: Configure

### Entry Criteria
- `shfmt --version` runs. Install with `go install mvdan.cc/sh/v3/cmd/shfmt@latest`, `brew install shfmt`, `apt-get install shfmt` (newer distributions), or the release binary from `github.com/mvdan/sh/releases`.

### Actions
1. Record `shfmt --version`.
2. Add a block to `.editorconfig` at the repository root (append; do not remove existing sections):

```
[*.{sh,bash}]
indent_style = space
indent_size = 2
switch_case_indent = true
binary_next_line = true
```

   For POSIX scripts add `shell_variant = posix` in a matching section; for `.bats` files add a `[*.bats]` section with `shell_variant = bats`. shfmt reads `.editorconfig` only when no formatting flags are given on the command line; passing `-i` or `-ci` overrides it.
3. Use `indent_size` from the project's existing style if one is evident (look at existing scripts); 2 is the Google Shell Style Guide indent.

### Output
`.editorconfig` block.

### Quality Gate
- `.editorconfig` contains a section matching the script's extension.
- `shfmt -f .` lists the script (shfmt finds shell files by extension and shebang).

---

## Phase 2: Format and Verify Behavior

### Entry Criteria
- Configured.

### Actions
1. Preview: `shfmt -d "$script_path"`; exit 0 means already formatted, nonzero means a diff was printed.
2. Apply: `shfmt -w "$script_path"`.
3. Prove nothing semantic changed:
   - `bash -n "$script_path"` (or `sh -n`) exits 0.
   - Run the script's tests (`bats test/` if present) or its `-h` path and compare output to before.
4. Do NOT combine formatting with logic edits in the same change; reviewers cannot see a logic change hidden in a reformat diff.
5. `shfmt -s` (simplify) rewrites some constructs; use it only if the user agrees, and run tests after.

### Output
Formatted script.

### Quality Gate
- `shfmt -d "$script_path"; echo "rc=$?"` prints `rc=0`.
- Syntax check exits 0 and tests give the same result as before formatting.

---

## Worked Example

Illustrative only.

```
$ shfmt --version
v3.8.0
$ shfmt -d bin/rotate
--- bin/rotate.orig
+++ bin/rotate
@@ -10,7 +10,7 @@
 case $1 in
-a) mode=all ;;
+  a) mode=all ;;
$ shfmt -w bin/rotate && shfmt -d bin/rotate; echo "rc=$?"
rc=0
$ bats test/rotate.bats
1..6
ok 1 prints usage with -h
...
```

---

## Exit Criteria

DONE when `shfmt -d` exits 0 under committed `.editorconfig` settings and behavior is unchanged.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Repository already uses different indent | **Adjust**: match the existing style in `.editorconfig`; do not reformat the whole repository unasked. |
| Phase 2 | shfmt reports a parse error | **Adjust**: shfmt parses stricter than bash in a few places; check the reported line with `bash -n` and fix the syntax. |
| Phase 2 | Tests fail after formatting | **Stop**: revert with version control and report; formatting must not change behavior. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
