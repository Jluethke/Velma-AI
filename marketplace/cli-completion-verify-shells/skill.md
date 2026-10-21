# CLI Shell Completion Verification

**One-line description:** Proves generated completion scripts work in each real shell without a human pressing Tab: bash by calling the registered completion function with `COMP_WORDS`/`COMP_CWORD`, zsh by checking `$_comps` after `compinit`, fish with `complete -C`, and PowerShell with `TabExpansion2`, in clean containers or CI runners.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `completion_scripts` (string[], required): Generated files from `cli-completion-generate`.
- `completion_install_paths` (object, required): Install directories per shell.
- `tool_name` (string, required): Executable name; must be on `PATH` for runtime protocols.

---

## Outputs

- `completion_verification` (object[]): Per shell: the command run, the candidates printed, expected candidates, and pass or fail.

---

## Phase 1: Prepare Clean Shells

### Entry Criteria
- The tool is installed on `PATH` (`command -v logtrim` prints a path).
- Shells available: check `bash --version`, `zsh --version`, `fish --version`, `pwsh --version`. A missing shell is recorded as not verified, never as passed.

### Actions
1. Run each shell without user rc files so local setup does not mask failures: `bash --norc --noprofile`, `zsh -f`, `fish --no-config`, `pwsh -NoProfile`.
2. For bash, check bash-completion is present when the script relies on its helpers (`_init_completion`, `__ltrim_colon_completions`): `ls /usr/share/bash-completion/bash_completion`. Source it first in tests if present.
3. Pick 3 probes for every shell, from `cli_spec`: subcommand names after `logtrim `, a flag prefix after `logtrim trim --ol`, and enum values after `logtrim --color `.

### Output
Shell list and probes.

### Quality Gate
- Each available shell has 3 probes with expected candidate lists written down before running anything.

---

## Phase 2: Run the Probes

### Entry Criteria
- Probes written.

### Actions
1. bash:
```
bash --norc --noprofile -c '
  source /usr/share/bash-completion/bash_completion 2>/dev/null
  source completions/logtrim.bash
  complete -p logtrim                     # shows e.g. complete -o default -F __start_logtrim logtrim
  fn=$(complete -p logtrim | sed -n "s/.*-F \([^ ]*\).*/\1/p")
  COMP_WORDS=(logtrim trim --ol); COMP_CWORD=2
  COMP_LINE="logtrim trim --ol"; COMP_POINT=${#COMP_LINE}
  "$fn" logtrim --ol trim
  printf "%s\n" "${COMPREPLY[@]}"'
```
   The function name comes from `complete -p`; do not guess it. If `complete -p` prints `-C` instead of `-F`, the script uses a command completer; run that command with `COMP_LINE` and `COMP_POINT` exported instead.
2. zsh:
```
zsh -f -c 'fpath=(completions $fpath); autoload -U compinit; compinit -u; print -r -- ${_comps[logtrim]}'
```
   A printed function name (for example `_logtrim`) means registration works. Candidate listing in zsh needs an interactive line editor; use the protocol call from `cli-completion-generate` (cobra `__complete`, click `_LOGTRIM_COMPLETE=zsh_complete` with `COMP_WORDS`/`COMP_CWORD`) to check values. Check the click docs for the exact variables it reads.
3. fish:
```
fish --no-config -c 'source completions/logtrim.fish; complete -C "logtrim trim --ol"'
```
   `complete -C` prints candidates with descriptions, one per line.
4. PowerShell:
```
pwsh -NoProfile -Command '. ./completions/logtrim.ps1; (TabExpansion2 -inputScript "logtrim --color " -cursorColumn 16).CompletionMatches.CompletionText'
```
5. Compare printed candidates with the expected lists. Record each in `completion_verification`.

### Output
Probe results per shell.

### Quality Gate
- Every probe has the printed output pasted in `completion_verification`, not a summary.

---

## Phase 3: Lock It in CI

### Entry Criteria
- All probes run.

### Actions
1. Put the Phase 2 commands in a script `scripts/check-completions.sh` that exits non-zero when any candidate list differs from the expected one (`[ "$got" = "$want" ] || { echo "bash: got $got"; exit 1; }`).
2. Run it in CI on Linux (bash, zsh, fish via the package manager) and on macOS. Run the PowerShell probe on `windows-latest` with `shell: pwsh`.
3. Fix failures in the generator flow, regenerate, rerun; never hand-edit the generated script.

### Output
`completion_verification`.

### Quality Gate
- `sh scripts/check-completions.sh; echo $?` prints `0`.
- Every shell in `completion_scripts` is marked pass, or not verified with the reason (shell unavailable).

---

## Do Not

- Do not mark a shell verified because the file exists or sources without error; a registered function can still return nothing.
- Do not test inside your own configured shell; use the no-rc flags.
- Do not guess the bash function name.

---

## Worked Example

Illustrative. cobra `logtrim`:
```
$ bash --norc --noprofile -c '... complete -p logtrim; ...; printf "%s\n" "${COMPREPLY[@]}"'
complete -o default -F __start_logtrim logtrim
--older-than
$ fish --no-config -c 'source completions/logtrim.fish; complete -C "logtrim --color "'
always
auto
never
$ zsh -f -c 'fpath=(completions $fpath); autoload -U compinit; compinit -u; print -r -- ${_comps[logtrim]}'
_logtrim
```
All three pass; PowerShell probe on the Windows runner returns `auto always never`.

---

## Exit Criteria

DONE when every available shell returns the expected candidates for all 3 probes and the check script runs in CI.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Shell not installed | **Adjust**: install it in CI (`apt-get install zsh fish`) or record it as not verified. |
| Phase 2 | bash `COMPREPLY` empty | **Retry**: source bash-completion first; confirm `COMP_CWORD` points at the last word. |
| Phase 2 | zsh `_comps` empty | **Adjust**: the file must be named `_logtrim` and be in `fpath` before `compinit`. |
| Phase 3 | CI candidates differ from local | **Return**: the installed tool version differs; reinstall from the current source. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
