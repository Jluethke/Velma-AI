# Purge Secrets From Git History With git filter-repo

**One-line description:** Removes already-rotated secrets from every commit with `git filter-repo` (`--replace-text` for values inside kept files, `--invert-paths --path` for whole files) in a fresh mirror clone, force-pushes all refs, handles what a rewrite cannot reach (GitHub pull request refs and cached views, forks, other clones, CI caches), and verifies with a fresh gitleaks scan.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `confirmed_leaks` (object[], required): Output of `cfg-triage-secret-findings`.
- `rotation_log` (object[], required): Output of `cfg-rotate-leaked-secret`. Every leak to purge must show its old credential revoked.
- `repo_path` (string, required): Absolute path to the existing working clone (used for reference only; the rewrite happens in a new clone).

---

## Outputs

- `purge_report` (object): Remote URL, commands run, refs rewritten, old and new HEAD SHAs, gitleaks rerun result, list of out-of-reach copies (forks, PR refs, other clones) with the action taken for each.

---

## Phase 1: Gate On Rotation And Plan The Rewrite

### Entry Criteria
- `git filter-repo --version` prints a version. Install with `pip install git-filter-repo` or the OS package (`brew install git-filter-repo`, `apt install git-filter-repo`). It is a separate tool, not built into git. BFG Repo-Cleaner is an alternative; this flow uses filter-repo, which the Git project's own `git filter-branch` documentation recommends instead of `filter-branch`.

### Actions
1. For every leak in `confirmed_leaks`, find its `rotation_log` row and confirm the old credential was revoked and observed failing. If any leak is not revoked, stop for that leak. Purging history does not make a secret safe: every existing clone, fork, CI cache, backup and scraper copy keeps the old commits. Rotation is the fix; the purge only stops future exposure.
2. Decide whether a rewrite is worth its cost:

| Situation | Decision |
|---|---|
| Leak is in a public repository or will be open-sourced | Rewrite |
| Repository is private, all leaked credentials are revoked, and rewriting would disrupt many active branches | Optional; record the decision and its reason |
| Policy or regulation requires removal (personal data, customer data) | Rewrite, and contact the hosting provider for cached data |

3. Choose the method per leak:

| Leak shape | filter-repo option |
|---|---|
| Whole file should never have been committed (`.env`, `credentials.json`, `id_rsa`) | `--invert-paths --path <file>` (repeat `--path` per file; `--path-glob '*.pem'` for patterns) |
| Value inside a file that must stay (`src/stripe.ts`) | `--replace-text <expressions file>` |

4. Write the expressions file outside any repository, for example `/tmp/purge-expressions.txt`, one rule per line:
```
sk_live_51Hx...full value...==>REMOVED-STRIPE-KEY
regex:AKIA[0-9A-Z]{16}==>REMOVED-AWS-KEY-ID
```
   A line without `==>` replaces the text with `***REMOVED***`. Prefix `regex:` for regular expressions, `glob:` for globs; plain lines are literals. Delete this file at the end: it holds the secrets.
5. Announce a freeze: everyone pushes their work, then stops pushing until Phase 3 is done. Rewritten history is incompatible with old clones.

### Output
Rotation gate passed, method per leak, expressions file.

### Quality Gate
- Every leak to purge has a `rotation_log` entry with revocation evidence.
- Each path or expression maps to at least one leak ID.

---

## Phase 2: Rewrite In A Fresh Mirror Clone

### Entry Criteria
- Freeze announced; Phase 1 gate passed.

### Actions
1. Make a backup mirror first: `git clone --mirror <remote-url> /tmp/backup-<repo>.git`. Store it encrypted or delete it after the purge is verified; it contains the secrets.
2. Make the working mirror: `git clone --mirror <remote-url> /tmp/purge-<repo>.git` and `cd /tmp/purge-<repo>.git`. filter-repo expects a fresh clone and refuses to run on one that is not, which protects against rewriting a clone with unpushed work. Do not use `--force` to get past that check on your daily working clone.
3. Run the rewrite (both options can go in one run):
```
git filter-repo --invert-paths --path .env --path config/credentials.json --replace-text /tmp/purge-expressions.txt
```
4. Read the output: `Parsed N commits`, `New history written`, `Completely finished after ... seconds`. filter-repo removes the `origin` remote to prevent accidental pushes; re-add it: `git remote add origin <remote-url>`.
5. Verify locally before pushing:
   - `git log --all --oneline -- .env` prints nothing.
   - `git grep -I -c 'sk_live_51Hx' $(git rev-list --all) | head` prints nothing (use a prefix of the value, not the whole value, and clear the shell history line afterwards).
   - Run `gitleaks git --log-opts="--all" --redact -v .` (or `gitleaks detect --source . --log-opts="--all" --redact -v` on older v8) and confirm the purged findings are gone.

### Output
Rewritten mirror, verified locally.

### Quality Gate
- `git log --all -- <purged path>` prints nothing for every purged path.
- gitleaks rerun on the mirror reports none of the purged findings (compare rule and file against `confirmed_leaks`).

---

## Phase 3: Push And Clean Up Copies

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Temporarily allow force pushes on protected branches if branch protection blocks them (GitHub: Settings > Branches or Rulesets). Re-enable right after.
2. Push all rewritten refs: `git push origin --force --mirror`. A mirror push also deletes remote refs that no longer exist locally. On GitHub, refs under `refs/pull/` are read-only and the push reports them as rejected; that is expected.
3. Handle what the push cannot reach:

| Copy | Action |
|---|---|
| GitHub pull request refs and cached commit views | Contact GitHub Support with the repository and the affected commit SHAs and ask them to remove cached views and dereference sensitive data in pull requests (per GitHub's "Removing sensitive data from a repository" guide). GitLab: use the project's "Remove blobs" setting (check your version's docs) |
| Forks | Forks keep the old history. List them (`gh api repos/<org>/<repo>/forks --paginate --jq '.[].full_name'`); ask owners to delete and re-fork, and record who did not |
| Teammate clones | Everyone deletes their clone and clones again. Pulling or rebasing onto the new history reintroduces old commits on the next push |
| CI caches, artifacts, container images built from the old tree | Delete caches (`gh cache delete --all --repo <org>/<repo>`), expire artifacts, and rebuild images that copied the secret file |
| Backup mirror from step 1 of Phase 2 | Delete after the purge is verified: `rm -rf /tmp/backup-<repo>.git` |

4. Add the purged paths to `.gitignore` and install the pre-commit hook (`cfg-precommit-gitleaks-hook`) so the leak does not return.
5. Delete `/tmp/purge-expressions.txt` and the mirror directories. Record old and new HEAD SHAs in `purge_report`.

### Output
`purge_report`.

### Quality Gate
- A new plain clone (`git clone <remote-url> /tmp/verify && gitleaks git --log-opts="--all" --redact -v /tmp/verify`) shows none of the purged findings.
- Every row in the copies table has an action recorded, including "not possible" with a reason.

---

## Common Mistakes To Avoid

- Do not purge before rotating. Purging gives a false sense of safety; the secret is already copied.
- Do not use `git filter-branch`; it is slow and error-prone, and its own documentation recommends filter-repo.
- Do not rewrite your daily working clone with `--force`.
- Do not merge an old branch from a pre-rewrite clone; it brings the secret back.
- Do not put full secret values in commit messages, the PR describing the purge, or the support request; give SHAs and paths.

---

## Worked Example

Illustrative. L01 (Stripe key in `src/stripe.ts`) and a committed `.env.staging`, both rotated per `rotation_log`.

```
$ git clone --mirror git@github.com:acme/billing.git /tmp/purge-billing.git && cd /tmp/purge-billing.git
$ git filter-repo --invert-paths --path .env.staging --replace-text /tmp/purge-expressions.txt
Parsed 1842 commits
New history written in 3.41 seconds; now repacking/cleaning...
Completely finished after 5.02 seconds.
$ git log --all --oneline -- .env.staging
$ gitleaks git --log-opts="--all" --redact -v .
INF no leaks found
$ git remote add origin git@github.com:acme/billing.git && git push origin --force --mirror
 ! [remote rejected] refs/pull/12/head -> refs/pull/12/head (deny updating a hidden ref)
```
PR ref rejection expected; GitHub Support ticket filed with SHAs `41aa07c3d9`, `9f3c1a2b7e`. 6 forks listed; 4 owners re-forked.

---

## Exit Criteria

DONE when only revoked secrets were purged, a fresh clone scans clean for them, all refs are force-pushed, and every out-of-reach copy has a recorded action.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A leak is not yet revoked | **Stop**: return it to `cfg-rotate-leaked-secret`. |
| Phase 2 | `Aborting: Refusing to destructively overwrite repo history since this does not look like a fresh clone` | **Retry**: make a new `--mirror` clone; do not add `--force`. |
| Phase 2 | gitleaks still finds the value | **Adjust**: the literal differs (whitespace, quoting, another encoding); add a `regex:` rule and rerun on a new mirror. |
| Phase 3 | Push rejected for protected branch | **Adjust**: lift protection briefly, push, restore protection, record both times. |
| Phase 3 | A fork owner does not respond | **Return**: record it; the credential is already revoked, which is why rotation came first. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
