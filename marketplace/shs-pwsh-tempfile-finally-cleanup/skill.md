# PowerShell Temp Directory and try/finally Cleanup

**One-line description:** Gives a PowerShell script the equivalent of `mktemp -d` plus `trap cleanup EXIT`: one random temp directory under `[System.IO.Path]::GetTempPath()`, all scratch files inside it, removal in a `finally` block that runs on success, error and Ctrl+C, idempotent file operations with `-Force` and `Test-Path`, and logging through the right streams.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_path` (string, required): The `.ps1` to fix.

---

## Outputs

- `pwsh_cleanup_contract` (object): Temp path pattern, the try/finally structure, stream usage for each message type, and leftover-directory check results for success, failure and interrupt runs.

---

## Phase 1: Create One Temp Directory

### Entry Criteria
- The script parses with strict mode and stop-on-error.

### Actions
1. Find hard-coded temp paths: `Select-String -Path $script_path -Pattern 'C:\\Temp|\$env:TEMP\\[A-Za-z]|/tmp/'`.
2. Create one directory per run inside `Invoke-Main`:

```powershell
$tmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ("archive-logs-" + [System.IO.Path]::GetRandomFileName())
New-Item -ItemType Directory -Path $tmpDir | Out-Null
```

   `GetTempPath()` works on Windows, Linux and macOS (it honors `TEMP`/`TMP` on Windows and `TMPDIR` on Unix). `New-TemporaryFile` creates a single file only.
3. Put every scratch file inside `$tmpDir` with `Join-Path`.

### Output
Script using `$tmpDir`.

### Quality Gate
- The Phase 1 search finds no hard-coded temp paths.

---

## Phase 2: Wrap in try/finally and Route Streams

### Entry Criteria
- `$tmpDir` in use.

### Actions
1. Structure `Invoke-Main`:

```powershell
$tmpDir = $null
try {
  $tmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ("archive-logs-" + [System.IO.Path]::GetRandomFileName())
  New-Item -ItemType Directory -Path $tmpDir | Out-Null
  # work
}
finally {
  if ($tmpDir -and (Test-Path -LiteralPath $tmpDir)) {
    Remove-Item -LiteralPath $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}
```

   A `finally` block runs when the `try` completes, when it throws, and when the user presses Ctrl+C. It does not run if the process is killed outright (`Stop-Process -Force`, `kill -9`).
2. Idempotent equivalents of the bash forms: `New-Item -ItemType Directory -Force` (no error if it exists), `Test-Path -LiteralPath` before create-only actions, `Set-Content` to a temp file then `Move-Item -Force` over the destination for atomic replacement on the same volume.
3. Streams, matching "data on stdout, logs on stderr":

| Message | Use | Never |
|---|---|---|
| Result data a caller captures | `Write-Output` (or emit the object) | `Write-Host` |
| Progress and status | `Write-Verbose` (shown with `-Verbose`) or `Write-Information -InformationAction Continue` | `Write-Output` |
| Warnings | `Write-Warning` | |
| Errors | `throw` or `Write-Error` | `Write-Host` in red |

   `Write-Host` writes to the information stream (5.0 and later) and is caught by PSScriptAnalyzer rule `PSAvoidUsingWriteHost`.

### Output
Edited script.

### Quality Gate
- `Select-String -Path $script_path -Pattern 'finally'` finds the block.
- `Select-String -Path $script_path -Pattern 'Write-Host'` finds nothing, or each hit is justified in `pwsh_cleanup_contract`.

---

## Phase 3: Prove Cleanup

### Entry Criteria
- Edits complete.

### Actions
1. Point temp at a fresh directory for counting: on Windows `$env:TEMP = (New-Item -ItemType Directory -Path (Join-Path $HOME 'tmptest')).FullName`; on Unix set `TMPDIR` the same way.
2. Success run: exit 0, `(Get-ChildItem $env:TEMP).Count` is 0.
3. Failure run (bad input that throws): nonzero exit, count 0.
4. Interrupt run: start it in a console on a slow input, press Ctrl+C, then count: 0.
5. Pipe check: `pwsh -NoProfile -File $script_path ... 6>$null 4>$null 3>$null | Measure-Object` counts only data objects.

### Output
`pwsh_cleanup_contract`.

### Quality Gate
- Leftover count is 0 after each of the three runs.
- Expected exit codes recorded for each run.

---

## Worked Example

Illustrative only.

```
PS> $env:TEMP = (New-Item -ItemType Directory -Path "$HOME\tmptest" -Force).FullName
PS> pwsh -NoProfile -File .\Archive-Logs.ps1 -SourcePath C:\logs -Days 7; $LASTEXITCODE; (Get-ChildItem $env:TEMP).Count
C:\archive\logs-2026-10-20.zip
0
0
PS> pwsh -NoProfile -File .\Archive-Logs.ps1 -SourcePath C:\locked -Days 7; $LASTEXITCODE; (Get-ChildItem $env:TEMP).Count
Archive-Logs.ps1: Access to the path 'C:\locked\a.log' is denied.
1
0
```

---

## Exit Criteria

DONE when all scratch data lives in one random temp directory removed by `finally` on success, failure and Ctrl+C, and streams separate data from logs.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `Remove-Item` fails because a file is still open | **Adjust**: close or dispose the handle (`$stream.Dispose()`) before `finally` removal; do not ignore the leak. |
| Phase 3 | Leftover directory after Ctrl+C | **Retry**: confirm the directory is created inside `try`, not before it. |
| Phase 3 | Data count includes log text | **Adjust**: a status message still uses `Write-Output`; switch it to `Write-Verbose`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
