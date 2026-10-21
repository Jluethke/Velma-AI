# PowerShell Native Command Exit Codes

**One-line description:** Closes the gap where `$ErrorActionPreference = 'Stop'` does not stop on a failing native program (`git`, `robocopy`, `msiexec`, `curl.exe`): turns on `$PSNativeCommandUseErrorActionPreference` in PowerShell 7.4 and later, otherwise checks `$LASTEXITCODE` after every native call through one helper, handles programs whose nonzero codes mean success (robocopy 0 to 7), and sets the script's own exit code with `exit`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_path` (string, required): The `.ps1` to fix.

---

## Outputs

- `native_call_fixes` (object[]): Per native call: line, program, success codes, the handling applied, and the test result.

---

## Phase 1: Find Native Calls

### Entry Criteria
- The script parses and has `$ErrorActionPreference = 'Stop'`.

### Actions
1. List external programs called: search for `.exe`, the call operator `&`, and known names: `Select-String -Path $script_path -Pattern '\b(git|robocopy|msiexec|curl\.exe|tar|choco|winget|dotnet|npm|docker|ssh|icacls|sc\.exe|netsh)\b|&\s*\$|\.exe\b'`.
2. For each, find its documented success codes. Examples:

| Program | Success exit codes | Source |
|---|---|---|
| Most CLI tools | 0 | Convention |
| `robocopy` | 0 to 7 (8 and above are failures) | Microsoft robocopy documentation |
| `msiexec` | 0, and 3010 (success, reboot required) | Windows Installer error codes |
| `choco` | 0; others listed in its docs | Chocolatey documentation |

3. For a program not in the table, read its documentation; if none, treat only 0 as success and record it as an assumption.

### Output
Native call list with success codes.

### Quality Gate
- Every native call has a success code set and a source or recorded assumption.

---

## Phase 2: Enforce Exit Codes

### Entry Criteria
- List complete.

### Actions
1. If the target is PowerShell 7.4 or later, add after `$ErrorActionPreference = 'Stop'`:

```powershell
$PSNativeCommandUseErrorActionPreference = $true
```

   With this, a native program that exits nonzero throws a terminating error. (It was experimental in 7.3 and is a standard feature from 7.4.) For calls whose nonzero codes mean success, wrap them so the throw is avoided:

```powershell
& { $PSNativeCommandUseErrorActionPreference = $false; robocopy $src $dst /MIR }
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit code $LASTEXITCODE" }
```

2. If the target is 5.1 or 7.0 to 7.3, add one helper and route every native call through it:

```powershell
function Invoke-Native {
  param(
    [Parameter(Mandatory)][string] $FilePath,
    [string[]] $ArgumentList = @(),
    [int[]] $SuccessCodes = @(0)
  )
  & $FilePath @ArgumentList
  if ($SuccessCodes -notcontains $LASTEXITCODE) {
    throw "$FilePath exited $LASTEXITCODE"
  }
}
# Invoke-Native git @('fetch', '--prune')
# Invoke-Native robocopy @($src, $dst, '/MIR') -SuccessCodes (0..7)
```

3. Windows PowerShell 5.1 pitfall: redirecting a native command's stderr (`2>&1` or `2>$null`) while `$ErrorActionPreference = 'Stop'` turns the first stderr line into a terminating `NativeCommandError`, even when the program succeeds. In 5.1, temporarily set `$ErrorActionPreference = 'Continue'` around such a call and rely on `$LASTEXITCODE`.
4. Set the script's own exit code at the end of error handling: in a top-level `try { Invoke-Main } catch { Write-Error $_ -ErrorAction Continue; exit 1 }`. An uncaught terminating error under `pwsh -File` already exits 1; explicit `exit` lets you map codes from the exit code table.
5. Do NOT pipe native output to `Out-Null` to hide failures, and do NOT check `$?` alone; `$LASTEXITCODE` is the program's real code.

### Output
Edited script.

### Quality Gate
- Every native call from Phase 1 is either covered by the 7.4 preference or goes through `Invoke-Native`.
- The script parses.

---

## Phase 3: Prove Failure Stops the Script

### Entry Criteria
- Edits complete.

### Actions
1. Force a native failure (for example point `git` at a nonexistent repository via a test parameter) and run `pwsh -NoProfile -File $script_path ...; $LASTEXITCODE`. Expect nonzero and no later steps executed (check a step's output file is absent).
2. Force a success-but-nonzero case (robocopy copying new files returns 1) and expect the script to continue and exit 0.
3. Record both in `native_call_fixes`.

### Output
`native_call_fixes`.

### Quality Gate
- The forced failure exits nonzero and stops before later steps.
- The success-but-nonzero case exits 0.

---

## Worked Example

Illustrative only.

Target PowerShell 7.4. Native calls: `git pull` (success 0) and `robocopy` (success 0 to 7).

```
PS> pwsh -NoProfile -File ./Sync-Site.ps1 -Repo C:\nope -Dest D:\site; $LASTEXITCODE
Sync-Site.ps1: Program "git.exe" ended with non-zero exit code: 128.
1
PS> pwsh -NoProfile -File ./Sync-Site.ps1 -Repo C:\src\site -Dest D:\site; $LASTEXITCODE
robocopy copied 14 files (exit 1, success)
0
```

---

## Exit Criteria

DONE when every native call's failure stops the script with a nonzero exit code and documented success codes are honored.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Program's success codes undocumented | **Adjust**: treat 0 as the only success and record the assumption in `native_call_fixes`. |
| Phase 2 | Target version mixes 5.1 and 7.4 hosts | **Adjust**: use the `Invoke-Native` helper everywhere; it works on both. |
| Phase 3 | Script continues after forced failure | **Retry**: find the call not routed through the helper or the preference; a pipeline into another cmdlet can hide `$LASTEXITCODE` checks. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
