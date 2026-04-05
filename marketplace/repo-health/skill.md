# Repository Health & Project Maintenance

Scan a repository's state, score its health across multiple dimensions, prioritize issues by severity, and generate actionable remediation plans with cleanup commands.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Scan repository (git status, branches, uncommitted changes, structure)
REASON  --> Score health (0-1), identify issues by severity
PLAN    --> Prioritize fixes (critical -> high -> medium -> low)
ACT     --> Generate health report, cleanup commands, maintenance schedule
         \                                                              /
          +--- Act may reveal new issues --- loop back to OBSERVE -----+
```

## Inputs

- **repo_path**: string -- Path to the git repository to analyze
- **scan_scope**: string (optional) -- Which dimensions to scan: "git", "filesystem", "cron", "symlinks", "all" (default: "all")
- **governance_integration**: boolean (optional) -- Whether to map health score to governance phases

## Outputs

- **health_report**: object -- Overall score (0-1), per-dimension scores, threshold classification (HEALTHY/NEEDS_ATTENTION/CRITICAL)
- **issues**: list[object] -- Identified issues with severity, description, and remediation commands
- **maintenance_schedule**: object -- Recommended cleanup cadence and priority order

## Execution

### OBSERVE: Scan Repository
**Entry criteria:** A valid git repository path exists and is accessible.
**Actions:**
1. Run git status checks:
   - `git rev-parse --abbrev-ref HEAD` -- detect detached HEAD (CRITICAL)
   - `git status --porcelain` -- find modified, deleted, and untracked files
   - `git branch -a -v --format="%(refname:short)|%(committerdate:iso8601)"` -- find stale branches (>30 days)
   - `git branch --no-merged` -- find unmerged branches
   - `git log -1 --format="%aI|%s"` -- check last commit age
2. Run filesystem checks (if scope includes filesystem):
   - Scan for empty folders with hierarchical risk classification
   - Check symlink integrity (valid/total ratio)
   - Detect created, deleted, and modified files against baseline
3. Run cron health checks (if scope includes cron):
   - Detect overdue jobs, conflicts, and timeline scoring
**Output:** Raw scan data: git state, branch list with ages, file change list, filesystem anomalies, cron status.
**Quality gate:** All requested scan commands executed without errors. Git repo confirmed valid.

### REASON: Score Health
**Entry criteria:** Raw scan data collected from all requested dimensions.
**Actions:**
1. Compute health score using the deduction formula:
   ```
   Base Score = 1.0
   Deductions:
     - Detached HEAD:           -0.30 (CRITICAL)
     - Modified/Deleted files:  -0.20 (HIGH)
     - Untracked files:         -0.10 (LOW)
     - Per stale branch (>30d): -0.20 (HIGH)
     - 3+ unmerged branches:    -0.10 (LOW)
   Final = max(0.0, 1.0 - sum(deductions))
   ```
2. Classify overall health:
   - 0.85+ = HEALTHY
   - 0.65-0.84 = NEEDS_ATTENTION
   - <0.65 = CRITICAL
3. Classify each issue by severity (CRITICAL/HIGH/MEDIUM/LOW)
4. For filesystem: apply hierarchical risk classification to empty folders
5. For symlinks: compute health score as valid/total ratio
6. If governance integration enabled, map to governance phase:
   - score < 0.65 = FROZEN
   - score < 0.80 = CONSTRAINED
   - score >= 0.80 = NOMINAL
**Output:** Scored health assessment with per-dimension breakdowns and issue severity classifications.
**Quality gate:** Score is between 0.0 and 1.0. All issues have a severity classification. Governance phase mapped if requested.

### PLAN: Prioritize Fixes
**Entry criteria:** Health score computed, issues classified by severity.
**Actions:**
1. Sort issues by severity: CRITICAL first, then HIGH, MEDIUM, LOW
2. For each issue, determine the appropriate remediation:
   - Detached HEAD: checkout a named branch or create one
   - Modified/deleted files: commit, stash, or restore
   - Stale branches: delete after merge verification
   - Unmerged branches: merge or archive
   - Empty folders: phased cleanup (CRITICAL risk first)
   - Broken symlinks: relink or remove
   - Overdue crons: reschedule or disable
3. Generate specific cleanup commands for each remediation
4. Create a maintenance schedule based on issue frequency
**Output:** Prioritized fix list with remediation commands and a maintenance schedule.
**Quality gate:** Every identified issue has a remediation action. Commands are executable (valid git/shell syntax).

### ACT: Generate Report
**Entry criteria:** Prioritized fix list and maintenance schedule ready.
**Actions:**
1. Compile the health report with:
   - Overall score and classification
   - Per-dimension breakdown (git, filesystem, cron, symlinks)
   - Issue list sorted by severity with remediation commands
   - Governance phase mapping (if enabled)
2. Generate a daily git changelog if recent commits exist (24h parse for task types, domain distribution, author activity)
3. Output maintenance schedule with recommended cadence
4. If CRITICAL issues found, flag for immediate action
5. If new issues surfaced during report generation, loop back to OBSERVE
**Output:** Complete health report ready for consumption.
**Quality gate:** Report includes all dimensions scanned. No CRITICAL issues left without immediate remediation recommendations.

## Exit Criteria

- All requested dimensions scanned and scored
- Overall health score computed with classification (HEALTHY/NEEDS_ATTENTION/CRITICAL)
- Every identified issue has severity + remediation action
- Governance phase mapped (if governance integration enabled)
- Report is self-contained and actionable

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Path is not a git repository | **Abort** -- report "not a git repo" with the path |
| OBSERVE | Git commands fail (permissions, corrupt repo) | **Adjust** -- skip failing dimension, report partial results |
| REASON | No issues found (perfect health) | **Skip** -- report score 1.0 HEALTHY, no remediation needed |
| PLAN | Remediation command would be destructive (force delete) | **Escalate** -- flag for human review before execution |
| ACT | Report generation fails mid-compilation | **Retry** -- regenerate from cached scan data (max 2 retries) |

## State Persistence

- Previous health scores (for trend tracking across scans)
- Baseline filesystem snapshot (for change detection between scans)
- Stale branch history (to detect branches that keep reappearing)

## Reference

### Health Score Formula

```
Base Score = 1.0
Deductions:
  - Detached HEAD:           -0.30 (CRITICAL)
  - Modified/Deleted files:  -0.20 (HIGH)
  - Untracked files:         -0.10 (LOW)
  - Per stale branch (>30d): -0.20 (HIGH)
  - 3+ unmerged branches:    -0.10 (LOW)

Final = max(0.0, 1.0 - sum(deductions))

Thresholds:
  0.85+ -> HEALTHY
  0.65-0.84 -> NEEDS_ATTENTION
  <0.65 -> CRITICAL
```

### Detection Commands

```bash
# Detached HEAD (CRITICAL if true)
git rev-parse --abbrev-ref HEAD

# Uncommitted changes
git status --porcelain

# Stale branches (>30 days since last commit)
git branch -a -v --format="%(refname:short)|%(committerdate:iso8601)"

# Unmerged branches
git branch --no-merged

# Last commit age
git log -1 --format="%aI|%s"
```

### Governance Integration Pattern

```python
score = report["health_assessment"]["overall_score"]
if score < 0.65:
    governance_phase = "FROZEN"
elif score < 0.80:
    governance_phase = "CONSTRAINED"
else:
    governance_phase = "NOMINAL"
```

### Additional Capabilities

- **Empty Folder Analysis**: Hierarchical risk classification (CRITICAL/REVIEW/MEDIUM/LOW) with phased cleanup checklists
- **Folder Change Monitoring**: Baseline-snapshot-compare pattern for detecting created, deleted, and modified files
- **Symlink Integrity Checking**: Health score based on valid/total symlinks with auto-remediation
- **Cron Job Health Monitoring**: Overdue detection, conflict analysis, and timeline scoring
- **Daily Git Changelog**: Parse 24h of commits for task types, domain distribution, and author activity
