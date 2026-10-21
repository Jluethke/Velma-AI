# PowerShell Strict Script Skeleton With param Block

**One-line description:** Writes the Windows branch of a script as a PowerShell 7 `.ps1` with `#Requires -Version`, `[CmdletBinding(SupportsShouldProcess)]`, a typed and validated `param()` block (`[Parameter(Mandatory)]`, `[ValidateSet()]`, `[ValidateScript()]`), `Set-StrictMode -Version Latest` and `$ErrorActionPreference = 'Stop'`, so argument errors, typos and failed cmdlets stop the script the way `set -euo pipefail` does in bash.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_path` (string, required): Path of the `.ps1` to create, for example `scripts/Archive-Logs.ps1`.
- `script_requirements` (object, required): Output of `shs-script-requirements-intake`.

---

## Outputs

- `pwsh_skeleton_report` (object): File path, target PowerShell version, parameters with their validation attributes, and the results of `-?`, `-WhatIf` and a bad-argument run.

---

## Phase 1: Choose the Target Version

### Entry Criteria
- `script_requirements.windows_native` is true, or the user asked for a PowerShell branch.

### Actions
1. Check what runs on the targets: `$PSVersionTable.PSVersion` in each. `powershell.exe` is Windows PowerShell 5.1 (built into Windows); `pwsh` is PowerShell 7.x (separate install, also on Linux and macOS).
2. Decide:

| Situation | Target |
|---|---|
| `pwsh` 7.x can be installed or is present on every target | PowerShell 7: `#Requires -Version 7.0` (raise it to the minor version whose features you use) |
| Must run on stock Windows with no installs | Windows PowerShell 5.1: `#Requires -Version 5.1`; avoid 7-only syntax (`??`, `?.`, ternary `a ? b : c`, `&&`/`\|\|` pipeline chains, `ForEach-Object -Parallel`) |

3. Record the target in `pwsh_skeleton_report`.

### Output
Target version.

### Quality Gate
- `$PSVersionTable.PSVersion` output is recorded for each target, or listed as an open question.

---

## Phase 2: Write the Skeleton

### Entry Criteria
- Target chosen; `script_path` does not exist or the user approved a rebuild.

### Actions
1. Write this structure (names in Verb-Noun form with an approved verb from `Get-Verb`):

```powershell
#Requires -Version 7.0
<#
.SYNOPSIS
  One line: what the script does.
.PARAMETER SourcePath
  Directory to read.
.EXAMPLE
  ./Archive-Logs.ps1 -SourcePath C:\logs -Days 7 -WhatIf
#>
[CmdletBinding(SupportsShouldProcess)]
param(
  [Parameter(Mandatory)]
  [ValidateScript({ Test-Path -LiteralPath $_ -PathType Container })]
  [string] $SourcePath,

  [Parameter(Mandatory)]
  [ValidateRange(1, [int]::MaxValue)]
  [int] $Days,

  [ValidateSet('zip', 'none')]
  [string] $Compression = 'zip'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-Main {
  [CmdletBinding(SupportsShouldProcess)]
  param()
  # one function call per step in script_requirements
}

Invoke-Main
```

2. Map each bash concept: `set -e` becomes `$ErrorActionPreference = 'Stop'` (cmdlet errors become terminating); `set -u` becomes `Set-StrictMode -Version Latest` (reading an unset variable or a missing property throws); getopts becomes the `param()` block with validation; `-n` dry run becomes `-WhatIf` from `SupportsShouldProcess`.
3. Wrap every state-changing call in `if ($PSCmdlet.ShouldProcess($target, 'Action')) { ... }` so `-WhatIf` and `-Confirm` work.
4. Use `-LiteralPath` instead of `-Path` for any user-supplied path, because `-Path` treats `[` and `]` as wildcards (the PowerShell equivalent of the quoting problem).
5. Save the file as UTF-8. For Windows PowerShell 5.1 targets, save as UTF-8 with BOM if the file contains non-ASCII characters; 5.1 reads BOM-less files in the system code page.

### Output
`.ps1` file.

### Quality Gate
- In a PowerShell session, `$errs = $null; [void][System.Management.Automation.Language.Parser]::ParseFile((Resolve-Path $script_path).Path, [ref]$null, [ref]$errs); $errs.Count` prints `0`.
- `Get-Help $script_path` shows the synopsis.

---

## Phase 3: Exercise the Parameter Contract

### Entry Criteria
- Skeleton parses.

### Actions
1. Run each and record output and `$LASTEXITCODE` (via `pwsh -NoProfile -File`):
   - `pwsh -NoProfile -File $script_path -?` shows help.
   - Missing mandatory parameter in non-interactive mode: `pwsh -NoProfile -NonInteractive -File $script_path` fails with "Cannot process command because of one or more missing mandatory parameters" and a nonzero exit code.
   - Bad value: `-Days 0` fails `ValidateRange`; `-Compression rar` fails `ValidateSet` and lists the allowed values.
   - `-WhatIf` prints "What if:" lines and changes nothing.
2. Do NOT test with `-Command` instead of `-File`; exit code propagation differs, and the chain's contract is `-File`.

### Output
`pwsh_skeleton_report`.

### Quality Gate
- Each bad-argument run exits nonzero; the help and `-WhatIf` runs exit 0.

---

## Worked Example

Illustrative only.

```
PS> pwsh -NoProfile -NonInteractive -File ./Archive-Logs.ps1 -SourcePath C:\logs -Days 0; $LASTEXITCODE
Archive-Logs.ps1: Cannot validate argument on parameter 'Days'. The 0 argument is less than the minimum allowed range of 1. ...
1
PS> pwsh -NoProfile -File ./Archive-Logs.ps1 -SourcePath C:\logs -Days 7 -WhatIf; $LASTEXITCODE
What if: Performing the operation "Archive" on target "C:\logs\app-2026-10-01.log".
0
```

---

## Exit Criteria

DONE when the `.ps1` parses, enforces strict mode and stop-on-error, validates every parameter, and supports `-WhatIf`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Target version unknown | **Return**: ask for `$PSVersionTable` output; do not assume 7.x is installed. |
| Phase 2 | Script blocked by execution policy on Windows | **Adjust**: run with `pwsh -ExecutionPolicy Bypass -File` for testing and record the policy found by `Get-ExecutionPolicy -List`; do not change machine policy unasked. |
| Phase 3 | `Set-StrictMode` breaks code reading optional properties | **Adjust**: test with `$obj.PSObject.Properties['Name']` before reading; do not lower the strict mode version. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
