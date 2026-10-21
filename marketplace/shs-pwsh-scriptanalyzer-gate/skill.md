# PSScriptAnalyzer Gate

**One-line description:** Runs PSScriptAnalyzer (the PowerShell counterpart of ShellCheck) with a committed `PSScriptAnalyzerSettings.psd1`, fixes findings rule by rule (`PSAvoidUsingWriteHost`, `PSAvoidUsingCmdletAliases`, `PSUseShouldProcessForStateChangingFunctions`, `PSAvoidUsingInvokeExpression` and others), allows suppressions only with a `SuppressMessageAttribute` and justification, and ends with zero findings at Warning and Error severity.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_path` (string, required): The `.ps1` (or folder) to analyze.

---

## Outputs

- `analyzer_report` (object): PSScriptAnalyzer version, settings file contents, findings by rule before and after, every suppression with justification, and the final finding count.

---

## Phase 1: Install, Configure and Baseline

### Entry Criteria
- PowerShell 5.1 or 7.x available.

### Actions
1. Install if missing: `Install-Module PSScriptAnalyzer -Scope CurrentUser -Force`. Record `(Get-Module PSScriptAnalyzer -ListAvailable).Version`.
2. Create `PSScriptAnalyzerSettings.psd1` in the repository root (if one exists, extend it; never delete existing entries):

```powershell
@{
  Severity     = @('Error', 'Warning')
  ExcludeRules = @()
}
```

3. Baseline: `Invoke-ScriptAnalyzer -Path $script_path -Settings ./PSScriptAnalyzerSettings.psd1 | Tee-Object -Variable before | Format-Table RuleName, Severity, Line, Message -AutoSize`.
4. Count by rule: `$before | Group-Object RuleName | Sort-Object Count -Descending | Format-Table Count, Name`.

### Output
Baseline counts.

### Quality Gate
- Settings file exists.
- Baseline count table saved in `analyzer_report`.

---

## Phase 2: Fix Rule by Rule

### Entry Criteria
- Baseline exists.

### Actions
1. Fix all findings of one rule, rerun the analyzer, then move to the next rule:

| Rule | Fix |
|---|---|
| `PSAvoidUsingCmdletAliases` | Replace aliases with full names (`gci` to `Get-ChildItem`, `%` to `ForEach-Object`, `?` to `Where-Object`); `Invoke-Formatter` does not do this, edit by hand |
| `PSAvoidUsingWriteHost` | Use `Write-Output` for data, `Write-Verbose`/`Write-Information` for status (`shs-pwsh-tempfile-finally-cleanup`) |
| `PSUseShouldProcessForStateChangingFunctions` | Add `[CmdletBinding(SupportsShouldProcess)]` and `$PSCmdlet.ShouldProcess()` to functions named with `New-`, `Set-`, `Remove-`, `Start-`, `Stop-` |
| `PSAvoidUsingInvokeExpression` | Call the command directly with the call operator and splatted arguments: `& $exe @args` |
| `PSAvoidUsingPositionalParameters` | Name the parameters: `Join-Path -Path $a -ChildPath $b` |
| `PSUseDeclaredVarsMoreThanAssignments` | Remove the unused variable or use it |
| `PSUseApprovedVerbs` | Rename to a verb from `Get-Verb` |
| `PSAvoidUsingPlainTextForPassword` / `PSAvoidUsingConvertToSecureStringWithPlainText` | Accept `[securestring]` or `[pscredential]` parameters; never a `[string]` password |
| `PSAvoidUsingEmptyCatchBlock` | Log and rethrow, or handle explicitly |

2. For a rule not listed, read `Get-ScriptAnalyzerRule -Name <rule> | Format-List` and the PSScriptAnalyzer docs.
3. Suppress only a confirmed false positive, on the function or script `param` block, with a justification:

```powershell
[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidUsingWriteHost', '', Justification = 'Interactive menu must write to host')]
```

4. Do NOT add a rule to `ExcludeRules` to reach zero; that disables it for the whole repository.
5. Optionally format with `Invoke-Formatter -ScriptDefinition (Get-Content -Raw $script_path) | Set-Content $script_path`, then rerun tests. Keep formatting in a separate change from fixes.

### Output
Edited script.

### Quality Gate
- Finding count drops after each rule.
- Every `SuppressMessageAttribute` has a non-empty `Justification`.

---

## Phase 3: Final Gate

### Entry Criteria
- Fixes done.

### Actions
1. `$after = Invoke-ScriptAnalyzer -Path $script_path -Settings ./PSScriptAnalyzerSettings.psd1; $after.Count`.
2. Make it a failing check for CI: `if ($after.Count -gt 0) { $after | Format-Table; exit 1 }`.
3. Optionally also run with `-Severity Information` and record (not gate) the count.

### Output
`analyzer_report`.

### Quality Gate
- `$after.Count` prints `0`.
- `ExcludeRules` in the settings file is unchanged from Phase 1 (compare with version control: `git diff -- PSScriptAnalyzerSettings.psd1`).

---

## Worked Example

Illustrative only.

```
PS> $before | Group-Object RuleName | Format-Table Count, Name
Count Name
----- ----
    4 PSAvoidUsingCmdletAliases
    2 PSAvoidUsingWriteHost
    1 PSUseShouldProcessForStateChangingFunctions
```
Fixes: four aliases expanded; two `Write-Host` calls become `Write-Verbose`; `Remove-OldArchive` gets `SupportsShouldProcess`.
```
PS> (Invoke-ScriptAnalyzer -Path .\Archive-Logs.ps1 -Settings .\PSScriptAnalyzerSettings.psd1).Count
0
```

---

## Exit Criteria

DONE when the analyzer reports zero Warning and Error findings under the committed settings and every suppression is justified.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Install-Module` blocked (no PSGallery access) | **Adjust**: use an internal repository or `Save-Module` on a connected machine; record the version used. |
| Phase 2 | Fix changes behavior (renamed function breaks callers) | **Adjust**: keep an alias for the old name with `Set-Alias` inside the script and record it. |
| Phase 3 | Tempted to exclude a rule to finish | **Stop**: that weakens the gate; fix or justify each finding. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
