# Stale Flag Detection

**One-line description:** Builds a list of stale flags by joining three sources (code references from ripgrep or `ld-find-code-refs`, provider metadata such as Unleash `stale` and last-seen data or LaunchDarkly flag statuses, and each flag's type and expiry) and classifies every temporary flag as remove-now, dead config, orphan code, or active with a fixed table.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root (or a list of repositories that share the flag project).
- `provider_choice` (object, required): Output of `ffr-provider-select`.
- `flag_inventory_export` (object, optional): An export of all flags with type, created date, and expiry, if the team keeps one outside the provider (for example a `flags.yaml` registry).

---

## Outputs

- `stale_flags` (object[]): One row per flag: key, type, owner, created, expiry, code reference count with locations, last evaluation time, variants served in the recent window, classification, and the variant to keep for removal.

---

## Phase 1: Collect Code References

### Entry Criteria
- `repo_path` is a Git checkout on the default branch, up to date (`git pull` done).

### Actions
1. If the provider is LaunchDarkly, run the official scanner (it ignores files listed in `.gitignore` and `.ldignore`):
```
ld-find-code-refs --accessToken "$LD_API_TOKEN" --projKey shop --repoName checkout --dir . --dryRun
```
Check `ld-find-code-refs --help` for the flags your version supports; `--dryRun` prints references without uploading them.
2. For other providers, list every flag key from the provider, then count references per key:
```
rg -n --fixed-strings -c "checkout-new-tax-engine" .
```
Loop over all keys and record the count and file list for each. Search constants files too: a key defined once in a constants module and referenced by constant name has one string hit; follow the constant name (`rg -n "CHECKOUT_NEW_TAX_ENGINE"`) to count real call sites.
3. Record keys found in code that do not exist in the provider. These are orphan code references: the code always gets the default.

### Output
Reference counts per key.

### Quality Gate
- Every provider key has a reference count (0 is a valid count).
- Constant-name references were followed for keys defined in a constants module (show one example).

---

## Phase 2: Collect Provider Metadata

### Entry Criteria
- Reference counts collected.

### Actions
1. Pull type, creation date, and usage from the provider:

| Provider | Command | Fields to read |
|---|---|---|
| Unleash | `curl -s -H "Authorization: $UNLEASH_ADMIN_TOKEN" "$UNLEASH_URL/api/admin/projects/default/features"` (check the API reference for paging on large projects) | `name`, `type`, `createdAt`, `stale`, `lastSeenAt`, per-environment `enabled` |
| LaunchDarkly | `curl -s -H "Authorization: $LD_API_TOKEN" "https://app.launchdarkly.com/api/v2/flags/shop?summary=true"` and `.../api/v2/flag-statuses/shop/production` | `key`, `temporary`, `tags`, `creationDate`, status (`new`, `active`, `launched`, `inactive`) and `lastRequested` |
| flagd | the flag files in Git; `git log --format=%ad --diff-filter=A -- flags/flags.flagd.json` for creation; usage from flagd metrics on port 8014 if scraped | `state`, `defaultVariant`, `targeting` presence |

2. Know what the provider statuses mean (confirm in current docs): Unleash marks a flag "potentially stale" when it outlives its type's expected lifetime; LaunchDarkly "launched" means one variation has been served to everyone for a period and "inactive" means no evaluations for a period.
3. From `flag_inventory_export` (if present) add expiry and owner.
4. For each flag, record which variants were served in the last window you can query (provider insights or your `feature_flag` metrics). One variant served to 100 percent means the flag no longer changes behavior.

### Output
Metadata per key.

### Quality Gate
- Every key has type, created date, and either a last evaluation time or "no usage data" written explicitly.

---

## Phase 3: Classify

### Entry Criteria
- Code and provider data joined by key.

### Actions
1. Skip permanent types (`kill_switch`, `permission`, Unleash `kill-switch` and `permission`, LaunchDarkly flags with `temporary: false`). List them separately for a yearly review only.
2. Classify each temporary flag with the first matching row:

| Row | Code refs | Evaluated recently | Variants served | Classification | Next step |
|---|---|---|---|---|---|
| 1 | 0 | no | any | dead config | archive in provider (`ffr-flag-archive-in-service`) |
| 2 | 0 | yes | any | hidden reference | search other repositories, scripts, and mobile apps before anything else |
| 3 | > 0 | any | flag missing in provider | orphan code | remove from code keeping the code default path |
| 4 | > 0 | yes | one variant to 100 percent, or past expiry | remove now | `ffr-flag-removal-pr` keeping the served variant |
| 5 | > 0 | no | any | remove now, verify default | the code is getting the default; removal keeps the default path |
| 6 | > 0 | yes | split | active | if past expiry, notify the owner with the expiry date |

3. For each remove-now flag, write `keep_variant`: the variant served to everyone (row 4), the code default (rows 3 and 5), or the experiment decision's winner.
4. Sort the output by expiry date, oldest first.

### Output
`stale_flags`.

### Quality Gate
- Every temporary flag has exactly one classification row number.
- Every remove-now flag has a `keep_variant` with its source.

---

## Worked Example

Illustrative only. Unleash, one repository.

```
$ rg -n --fixed-strings -c "checkout-new-tax-engine" .
app/flags.py:1
$ rg -n "CHECKOUT_NEW_TAX_ENGINE\b" app | wc -l
4
$ curl -s -H "Authorization: $UNLEASH_ADMIN_TOKEN" "$UNLEASH_URL/api/admin/projects/default/features" | jq -c '.features[] | {name,type,stale,lastSeenAt}'
{"name":"checkout-new-tax-engine","type":"release","stale":true,"lastSeenAt":"2026-10-20T09:12:03Z"}
{"name":"search-legacy-ranker","type":"release","stale":true,"lastSeenAt":null}
```
| Key | Refs | Recent eval | Served | Row | Class | keep_variant |
|---|---|---|---|---|---|---|
| checkout-new-tax-engine | 4 | yes | `on` to 100 percent for 3 weeks | 4 | remove now | `on` |
| search-legacy-ranker | 0 | no | n/a | 1 | dead config | n/a |

---

## Exit Criteria

DONE when every flag key has code reference counts and provider metadata joined, permanent flags are set aside, and every temporary flag has one classification row and, if removable, a sourced `keep_variant`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Keys built dynamically in code | **Adjust**: list the dynamic sites; those flags cannot be classified as zero-reference until the code uses constants. |
| Phase 2 | No usage data from the provider | **Adjust**: mark "no usage data"; rows needing recency cannot be used; never treat missing data as "not evaluated". |
| Phase 3 | Row 2 (no code refs, still evaluated) | **Stop**: find the consumer before archiving; archiving would flip it to its default. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
