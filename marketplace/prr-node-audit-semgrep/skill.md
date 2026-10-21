# Node PR Security Scan with npm audit, Lockfile Review and Semgrep

**One-line description:** Compares `npm audit` (or the pnpm and Yarn equivalents) between merge base and PR head to find vulnerabilities the PR introduces, reads the lockfile diff for new packages with install scripts or non-registry sources, and runs Semgrep's JavaScript, TypeScript and OWASP rulesets with a baseline.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Local clone with the PR head checked out.
- `base_branch` (string, required): PR target branch.
- `changed_files` (object[], required): Rename-aware file list.
- `findings_dir` (string, required): Findings directory.

---

## Outputs

- `node_sast_findings` (object[]): New dependency, lockfile and code findings, written to `<findings_dir>/prr-node-audit-semgrep.json`.

---

## Phase 1: Dependency Audit Diff

### Entry Criteria
- `package.json` or a lockfile changed, or JS/TS source changed (then skip to Phase 3 if no manifest changed).

### Actions
1. Pick the commands for the package manager in use (the lockfile tells you):

| Lockfile | Audit command (production dependencies only) |
|---|---|
| `package-lock.json` | `npm audit --omit=dev --json > ../audit-head.json` |
| `pnpm-lock.yaml` | `pnpm audit --prod --json > ../audit-head.json` |
| `yarn.lock` (Yarn 1) | `yarn audit --groups dependencies --json > ../audit-head.json` |
| `yarn.lock` (Yarn 2+) | `yarn npm audit --environment production --json > ../audit-head.json` |

   Check the installed tool's `--help` before running; flags changed across major versions. Run the full audit (without the production-only flag) too if the PR changes build tooling.
2. Run the same command in a merge-base worktree to produce `../audit-base.json`.
3. For npm, the JSON has a `vulnerabilities` object keyed by package name with `severity`, `via`, `range`, `fixAvailable`. Keep packages present in head but not in base, or with a higher severity in head.
4. `npm audit` exits non-zero when any vulnerability exists; that is expected. Read the JSON, not the exit code.

### Output
New vulnerabilities list.

### Quality Gate
- Both audit JSON files exist and parse with `python -m json.tool`.
- Each kept vulnerability lists package, severity and whether a fix is available.

---

## Phase 2: Read the Lockfile Diff

### Entry Criteria
- A lockfile changed.

### Actions
1. List added packages in `package-lock.json` (lockfile v2 and v3 key packages by path):
   `git diff origin/<base_branch>...HEAD -- package-lock.json | grep -nE '^\+\s+"node_modules/[^"]+": \{'`
2. For each added package, read its lockfile entry in the head version and check these fields:

| Field or value | Label |
|---|---|
| `"hasInstallScript": true` on a newly added package | question: name the package and ask why it needs an install script |
| `"resolved"` not starting with the project's registry (for example a `git+`, `github:` or plain `http:` URL) | blocking |
| Package name one character off a popular name (typosquatting) | blocking until the author confirms |
| `"integrity"` missing on a registry package | question |

3. Confirm a direct dependency added to `package.json` is used: `rg -n "from '<pkg>'|require\('<pkg>'\)" src/`. An unused new dependency is a nit.
4. For pnpm or Yarn lockfiles, read the added package blocks the same way; field names differ (`resolution`, `requiresBuild` in pnpm). Do not guess field names; read an existing block in the same file first.

### Output
Lockfile findings.

### Quality Gate
- Every added package was checked against all four rows.

---

## Phase 3: Semgrep with Baseline and Findings File

### Entry Criteria
- `semgrep --version` succeeds.

### Actions
1. Run: `semgrep scan --config p/javascript --config p/typescript --config p/owasp-top-ten --baseline-commit $(git merge-base origin/<base_branch> HEAD) --json --output ../semgrep.json`. Add the repository's own rules if present.
2. Check framework sinks by hand on added lines: `dangerouslySetInnerHTML`, `innerHTML =`, `eval(`, `new Function(`, `child_process.exec(` with template strings, `res.redirect(req.query...)` (open redirect), Express `cors({ origin: true, credentials: true })`, `jwt.verify` without an `algorithms` option.
3. Find added suppressions: `git diff -U0 origin/<base_branch>...HEAD | grep -nE '^\+.*(nosemgrep|eslint-disable.*security)'`. Bare suppressions are a suggestion; suppressions on a traced untrusted path are blocking.
4. Label: new critical or high advisory with a fix available: blocking; moderate or low: question; Semgrep ERROR on a reachable path: blocking; WARNING: question; INFO: nit.
5. Write `<findings_dir>/prr-node-audit-semgrep.json` (fields `flow`, `category`="sast", `file`, `line`, `evidence` = advisory ID or check ID, `proposed_label`, `fix`) and validate with `python -m json.tool`.

### Output
`node_sast_findings`.

### Quality Gate
- Every finding has an advisory URL, GHSA ID, or Semgrep `check_id` in `evidence`.
- The findings file passes `python -m json.tool`.

---

## Worked Example

Illustrative. PR adds `left-pads` to `package.json` and changes `src/routes/login.ts`.

- Phase 1: `npm audit --omit=dev --json` head vs base: no new advisories.
- Phase 2: added entry `"node_modules/left-pads": { "version": "1.0.2", "resolved": "https://registry.npmjs.org/left-pads/-/left-pads-1.0.2.tgz", "hasInstallScript": true }`. Name differs by one character from `left-pad` and has an install script: blocking.
- Phase 3: Semgrep reports `javascript.express.security.audit.express-open-redirect` at `login.ts:44` (`res.redirect(req.query.next)`): blocking, fix "accept only relative paths that start with a single `/`, or match against an allowlist".

---

## Exit Criteria

DONE when audit results are compared base to head, every added lockfile package is checked for install scripts, source and name, Semgrep ran with a baseline, and each finding carries an advisory or rule ID.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Audit endpoint unreachable | **Retry** once; then record "dependency audit not run" and continue with Phase 2. |
| Phase 1 | Private registry rejects audit requests | **Adjust**: use the organization's scanner if documented; else record "not run". |
| Phase 2 | Lockfile changed but `package.json` did not | **Adjust**: add a question asking which command regenerated the lockfile. |
| Phase 3 | Semgrep cannot parse a file (new syntax) | **Adjust**: record the parse error from the `errors` array and review that file by hand. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
