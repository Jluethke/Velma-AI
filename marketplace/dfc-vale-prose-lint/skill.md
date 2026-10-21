# Prose Lint With Vale

**One-line description:** Sets up Vale with a published style package and a project vocabulary so product names are not flagged as spelling errors, runs it at error level in CI and at suggestion level for authors, and fixes prose findings without changing technical meaning.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `audience_profile` (object[], required): Personas from `dfc-audience-doctype-plan`; used to decide the reading-level and jargon rules.

---

## Outputs

- `vale_config` (string): Path to `.vale.ini` plus the vocabulary file path `styles/config/vocabularies/<Project>/accept.txt`.
- `vale_report` (object[]): Per rule: rule name, level, count before and after, and action (fixed, vocabulary term added, rule level changed with reason).

---

## Phase 1: Install and Configure

### Entry Criteria
- `vale --version` prints a version (install from the official release page, `brew install vale`, `choco install vale`, or another method listed on the official Vale installation page; do not guess a package name for other managers).
- The repository has Markdown, reStructuredText or AsciiDoc docs.

### Actions
1. Check the major version: `vale --version`. The vocabulary path in this flow is the Vale 3 layout (`<StylesPath>/config/vocabularies/<Name>/`). On Vale 2 the path is `<StylesPath>/Vocab/<Name>/`; use the path that matches the installed version.
2. Write `.vale.ini` at the repository root:
   ```ini
   StylesPath = styles
   MinAlertLevel = suggestion
   Packages = Google
   Vocab = Project

   [*.{md,mdx,rst}]
   BasedOnStyles = Vale, Google
   ```
3. Pick the package from this table:

   | Situation | `Packages` value |
   |---|---|
   | No house style chosen | `Google` (Google developer documentation style guide) |
   | Organization already follows Microsoft Writing Style Guide | `Microsoft` |
   | Only spelling and repeated words wanted | omit `Packages`; keep `BasedOnStyles = Vale` |

4. Download the package: `vale sync`. It writes into `styles/`. Commit `.vale.ini` and the vocabulary; add the downloaded package directory (for example `styles/Google/`) to `.gitignore` and run `vale sync` in CI, or commit it, but not both.
5. Create `styles/config/vocabularies/Project/accept.txt` (one term or regex per line) with the project's product names, package names and CLI names. Create `reject.txt` beside it for terms that must never appear (for example an old product name).

### Output
`vale_config` written; `vale sync` completed.

### Quality Gate
- `vale ls-config` prints the merged configuration with `BasedOnStyles` containing `Google` (or the chosen package) and no error.
- `ls styles/Google` (or the chosen package directory) lists `.yml` rule files.

---

## Phase 2: Baseline and Triage

### Entry Criteria
- Configuration valid.

### Actions
1. Run: `vale --output=line docs README.md`. Each line reads `<file>:<line>:<col>:<Style.Rule>:<message>`.
2. Count by rule: `vale --output=line docs README.md | cut -d: -f4 | sort | uniq -c | sort -rn`.
3. Triage each rule with this table:

   | Finding type | Action |
   |---|---|
   | `Vale.Spelling` on a product, package, or CLI name | Add the term to `accept.txt`; do not change the doc. |
   | `Vale.Spelling` on a real misspelling | Fix the doc. |
   | `Google.Passive`, `Google.Will`, `Google.We`, `Google.FirstPerson` | Rewrite the sentence on tutorial and how-to pages; on explanation pages, fix only when the rewrite keeps the meaning. |
   | `Google.Headings` (sentence case) | Fix unless the heading contains a proper noun that `accept.txt` lists. |
   | Any rule firing inside code identifiers | Wrap the identifier in backticks; Vale skips inline code and code blocks by default. |
   | Rule conflicts with a persona need from `audience_profile` (for example `Google.Acronyms` on an acronym every reader knows) | Set the rule level in `.vale.ini` under the `[*.md]` section, for example `Google.Acronyms = suggestion`, with a `#` comment naming the persona. |

4. Do NOT disable `Vale.Spelling` to clear spelling findings; use the vocabulary.

### Output
Triaged findings per rule.

### Quality Gate
- Every rule with a non-zero count has a triage action recorded.
- `wc -l styles/config/vocabularies/Project/accept.txt` is at least the number of product terms found in Phase 1 step 5.

---

## Phase 3: Fix and Gate

### Entry Criteria
- Triage complete.

### Actions
1. Fix errors first, then warnings. Edit one file at a time and rerun `vale <file>` after each edit.
2. When rewriting a sentence, keep every code identifier, number, flag and unit identical. Compare with `git diff --word-diff <file>`; if any backticked token changed, revert that hunk.
3. For an unavoidable exception, wrap the passage: `<!-- vale Google.Passive = NO -->` before and `<!-- vale Google.Passive = YES -->` after. Record it in `vale_report`.
4. Gate command for CI: `vale --minAlertLevel=error docs README.md`. Vale exits non-zero when it reports an error-level alert.

### Output
`vale_report`.

### Quality Gate
- `vale --minAlertLevel=error docs README.md; echo $?` prints `0` as its last line.
- `git diff --word-diff` shows no changed backticked tokens in edited files.

---

## Worked Example

Illustrative only. Baseline:
```
$ vale --output=line docs README.md | cut -d: -f4 | sort | uniq -c | sort -rn
  31 Vale.Spelling
   9 Google.Passive
   4 Google.Will
   2 Google.Headings
```
`Vale.Spelling` findings: 28 are `tidyconf`, `YAML`, `jsonschema`, added to `accept.txt`; 3 are real typos, fixed. `Google.Will` on the tutorial: "The command will print OK" becomes "The command prints OK". Final:
```
$ vale --minAlertLevel=error docs README.md; echo $?
✔ 0 errors, 6 warnings and 2 suggestions in 14 files.
0
```

---

## Exit Criteria

DONE when `.vale.ini` and the project vocabulary are committed, the error-level gate exits 0, and every inline exception is listed in `vale_report`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `vale sync` fails behind a proxy | **Retry**: once with `HTTPS_PROXY` set; then **Return** with instructions to vendor the package directory. |
| Phase 1 | Vocabulary terms ignored | **Adjust**: check the vocabulary path matches the installed major version (Phase 1 step 1) and that `Vocab = Project` matches the directory name exactly (case-sensitive). |
| Phase 2 | Thousands of findings | **Adjust**: gate only `error` level now; record warnings in `vale_report` for later passes; never raise `MinAlertLevel` to hide them from authors. |
| Phase 3 | A rewrite changes technical meaning | **Stop**: revert the hunk and add a scoped exception instead. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
