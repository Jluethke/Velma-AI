# Flag Expiry and Hygiene CI Gate

**One-line description:** Adds a CI job that fails a pull request when it references a temporary flag past its expiry date, introduces a flag key not registered with an owner and expiry, or builds a flag key dynamically, using a checked-in flag registry, ripgrep, and jq, plus LaunchDarkly's code references action where that provider is used.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `provider_choice` (object, required): Output of `ffr-provider-select`.
- `stale_flags` (object[], required): Output of `ffr-stale-flag-detect`; seeds the registry with current flags.

---

## Outputs

- `ci_gate_config` (object): Path of the registry file, the gate script path, the CI workflow file and job name, and the transcript of three test runs (clean pass, expired-flag failure, unregistered-key failure).

---

## Phase 1: Create the Flag Registry

### Entry Criteria
- `stale_flags` lists current flags with types and owners.

### Actions
1. Create `flags/registry.json` with one entry per flag, seeded from `stale_flags`:
```json
{
  "flags": [
    {"key": "checkout-new-tax-engine", "type": "release", "owner": "@payments-core", "expires": "2026-11-29", "constant": "CHECKOUT_NEW_TAX_ENGINE"},
    {"key": "payments-provider-kill", "type": "kill_switch", "owner": "@payments-oncall", "expires": null, "constant": "PAYMENTS_PROVIDER_KILL"}
  ]
}
```
2. `expires` is required for `release` and `experiment`, and must be null for `kill_switch` and `permission`. Take dates from each flag's spec; do not invent dates. A flag with no known expiry gets an open question and is added with the date the owner gives.
3. Add a CODEOWNERS line so changes to the registry need the platform or flag owners' review: `flags/registry.json @platform-team` (use your real team handle).

### Output
Registry file.

### Quality Gate
- `jq -e '.flags | all(.type as $t | (($t=="release" or $t=="experiment") and .expires != null) or (($t=="kill_switch" or $t=="permission") and .expires == null))' flags/registry.json` prints `true`.

---

## Phase 2: Write the Gate Script

### Entry Criteria
- Registry exists.

### Actions
1. Create `scripts/flag-gate.sh` (POSIX shell, using `rg` and `jq`, both preinstalled on GitHub-hosted Ubuntu runners; check your runner image and install them if missing). The script does three checks and exits 1 if any fails:
   - **Expired**: for each registry entry with `expires` earlier than today (`date -u +%F`), run `rg -q --fixed-strings "<key>" --glob '!flags/registry.json' .` and fail if found, printing key, owner, and expiry.
   - **Unregistered**: extract keys from the language's flag constants module (for example `rg -o --no-filename '"[a-z0-9][a-z0-9-]*"' app/flags.py`) and fail for any key not in the registry.
   - **Dynamic keys**: fail on evaluation calls whose first argument is not a constant, using a stack-specific pattern such as `rg -n 'get_boolean_value\(f"|get_boolean_value\([a-z_]+ \+' app` (Python), or a pattern matching `getBooleanValue(` followed by a backtick template literal or a `+` concatenation (TypeScript). List the patterns in the script header.
2. Print a clear failure line per problem, for example `EXPIRED checkout-new-tax-engine owner=@payments-core expired=2026-11-29 refs=4`.
3. Run `shellcheck scripts/flag-gate.sh` and fix every warning.

### Output
Gate script.

### Quality Gate
- `shellcheck scripts/flag-gate.sh` prints nothing and exits 0.
- `sh scripts/flag-gate.sh` on the current default branch exits 0, or lists only real problems recorded as open questions with owners.

---

## Phase 3: Add the CI Job and Test It

### Entry Criteria
- Gate script passes shellcheck.

### Actions
1. GitHub Actions example, `.github/workflows/flag-gate.yml`:
```yaml
name: flag-gate
on: [pull_request]
jobs:
  flag-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: sh scripts/flag-gate.sh
```
For GitLab CI or another system, add one job running the same command.
2. If the provider is LaunchDarkly, also add the official `launchdarkly/find-code-references` action on pushes to the default branch so LaunchDarkly shows code references per flag; read the action's README for its required inputs (access token secret and project key) and pin it to a release tag.
3. Test three cases on a throwaway branch and record each CI result:
   - unchanged branch: job passes;
   - set one referenced flag's `expires` to yesterday: job fails with an `EXPIRED` line;
   - add a new key to the constants module without a registry entry: job fails with an `UNREGISTERED` line.
4. Revert the test changes. Mark the job as a required status check in branch protection only after the owner agrees; record the decision.

### Output
`ci_gate_config`.

### Quality Gate
- Three CI runs recorded: one pass and two failures with the expected failure lines (links or log excerpts).
- `actionlint .github/workflows/flag-gate.yml` (if available) reports no errors.

---

## Worked Example

Illustrative only.

```
$ shellcheck scripts/flag-gate.sh
$ sh scripts/flag-gate.sh; echo "exit $?"
flag-gate: 14 registered flags, 0 expired with references, 0 unregistered, 0 dynamic keys
exit 0
# test case 2
$ sh scripts/flag-gate.sh; echo "exit $?"
EXPIRED checkout-new-tax-engine owner=@payments-core expired=2026-10-19 refs=4
exit 1
# test case 3
UNREGISTERED search-boost-v3 found in app/flags.py
exit 1
```

---

## Exit Criteria

DONE when a registry with owners and type-consistent expiry exists, the gate script passes shellcheck and checks expiry, registration, and dynamic keys, and CI showed one pass and two expected failures.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Owner unknown for a flag | **Return**: add with an open question; do not assign someone. |
| Phase 2 | `rg` or `jq` missing on the runner | **Adjust**: add an install step for the runner image. |
| Phase 3 | Gate fails on the default branch for existing expired flags | **Adjust**: run `ffr-flag-removal-pr` for them, or record owner-approved new expiry dates in the registry; never disable the check. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
