# Pester 5 Tests for a PowerShell Script

**One-line description:** Tests the PowerShell branch with Pester 5: end-to-end runs through `pwsh -NoProfile -File` asserting `$LASTEXITCODE` and output, function-level tests that dot-source the script with `Mock` and `Should -Invoke` to replace external commands, `$TestDrive` for files, and `Invoke-Pester -CI` for a failing exit code in CI.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_path` (string, required): The `.ps1` under test.
- `repo_dir` (string, required): Repository root; tests go in `tests/`.

---

## Outputs

- `pester_tests` (object): Pester version, test file path, test names mapped to behaviors, mutation-check result, and the final run summary.

---

## Phase 1: Install Pester 5 and Make the Script Testable

### Entry Criteria
- The script passes `shs-pwsh-scriptanalyzer-gate`.

### Actions
1. Windows ships Pester 3.4 with Windows PowerShell, which is incompatible with Pester 5 syntax. Install Pester 5 side by side: `Install-Module Pester -MinimumVersion 5.0 -Scope CurrentUser -Force -SkipPublisherCheck` (`-SkipPublisherCheck` is needed because the inbox 3.4 is signed by a different certificate). Record `(Get-Module Pester -ListAvailable | Sort-Object Version -Descending | Select-Object -First 1).Version`.
2. Make functions loadable without running the script: change the last line from `Invoke-Main` to

```powershell
if ($MyInvocation.InvocationName -ne '.') { Invoke-Main }
```

   Dot-sourcing (`. ./script.ps1`) sets `InvocationName` to `.`, so tests can load functions without side effects. A mandatory `param()` block will still prompt when dot-sourced; give tests a way around it by passing parameters on the dot-source line (`. $script -SourcePath $TestDrive -Days 1`).

### Output
Pester 5 installed; script dot-sourceable.

### Quality Gate
- The recorded Pester version starts with `5`.
- Dot-sourcing the script with parameters defines `Invoke-Main` without running it: `Get-Command Invoke-Main` succeeds and no output files appear.

---

## Phase 2: Write the Tests

### Entry Criteria
- Phase 1 complete.

### Actions
1. Create `tests/<ScriptName>.Tests.ps1`:

```powershell
BeforeAll {
  $script:Script = Join-Path $PSScriptRoot '..' 'scripts' 'Archive-Logs.ps1'
}

Describe 'Archive-Logs end to end' {
  It 'exits nonzero on an invalid -Days value' {
    pwsh -NoProfile -NonInteractive -File $Script -SourcePath $TestDrive -Days 0 2>$null
    $LASTEXITCODE | Should -Not -Be 0
  }

  It 'creates an archive for old files' {
    $old = New-Item -Path (Join-Path $TestDrive 'a.log') -ItemType File
    $old.LastWriteTime = (Get-Date).AddDays(-10)
    pwsh -NoProfile -File $Script -SourcePath $TestDrive -Days 7
    $LASTEXITCODE | Should -Be 0
    Join-Path $TestDrive 'archive.zip' | Should -Exist
  }
}

Describe 'Remove-OldArchive' {
  BeforeAll { . $Script -SourcePath $TestDrive -Days 1 }

  It 'calls Remove-Item once per expired archive' {
    Mock Remove-Item {}
    Mock Get-ChildItem { [pscustomobject]@{ FullName = 'x.zip'; LastWriteTime = (Get-Date).AddDays(-400) } }
    Remove-OldArchive -Path $TestDrive -KeepDays 30 -Confirm:$false
    Should -Invoke Remove-Item -Times 1 -Exactly
  }
}
```

   `Join-Path` with more than two path parts needs PowerShell 7; for 5.1 nest the calls. Adjust names (`Remove-OldArchive`, paths) to the real script; do NOT reference functions that do not exist in it.
2. Rules:
   - In Pester 5, all setup code goes in `BeforeAll`/`BeforeEach`; code placed directly in `Describe` runs during discovery, not during the test.
   - `Mock` replaces a command only for code in scope; native executables can be mocked by name (`Mock git {}`) when called by name.
   - Use `$TestDrive` (a per-container temporary folder Pester removes) for files; never write into the repository.
3. Add one `It` at a time and run it: `Invoke-Pester -Path tests -FullNameFilter '*invalid -Days*' -Output Detailed`.

### Output
Test file.

### Quality Gate
- Every test names a function or parameter that exists in `script_path` (check with `Select-String`).

---

## Phase 3: Run, Mutate, Gate

### Entry Criteria
- Tests written.

### Actions
1. Run: `Invoke-Pester -Path tests -Output Detailed -CI`. `-CI` makes Pester exit nonzero on failure and write `testResults.xml` (NUnit format).
2. Mutation check: temporarily change `ValidateRange(1, ...)` to `ValidateRange(0, ...)`, rerun, confirm the invalid-days test fails, revert, confirm `git diff -- $script_path` is empty.
3. If a test fails on the real script, fix the script when it violates the contract in `script_requirements`; do NOT loosen `Should -Be` to `Should -Not -BeNullOrEmpty` or add `-Skip` to get green.
4. Remove `testResults.xml` from the working tree unless CI collects it.

### Output
`pester_tests`.

### Quality Gate
- Summary line shows `Failed: 0`.
- The mutation run showed at least one failure, and the revert restored a clean diff.

---

## Worked Example

Illustrative only.

```
PS> Invoke-Pester -Path tests -Output Detailed -CI
Running tests from 'C:\repo\tests\Archive-Logs.Tests.ps1'
Describing Archive-Logs end to end
  [+] exits nonzero on an invalid -Days value 1.21s
  [+] creates an archive for old files 1.48s
Describing Remove-OldArchive
  [+] calls Remove-Item once per expired archive 40ms
Tests completed in 3.1s
Tests Passed: 3, Failed: 0, Skipped: 0, NotRun: 0
```

---

## Exit Criteria

DONE when Pester 5 tests cover the parameter contract, the main success path and each mocked external interaction, pass with `-CI`, and the mutation check proved they can fail.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Tests use Pester 3/4 syntax (`Should Be` without dash) | **Adjust**: convert to Pester 5 `Should -Be` and move setup into `BeforeAll`. |
| Phase 2 | Mock not applied | **Adjust**: the command runs in a child `pwsh` process (end-to-end test); mocks only work on dot-sourced code in the same session. |
| Phase 3 | Test passes on mutated script | **Adjust**: the assertion is too loose; assert the exact exit code or message. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
