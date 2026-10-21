# Flag Provider Selection Behind OpenFeature

**One-line description:** Chooses the flag backend (flagd with a file or Kubernetes source, self-hosted Unleash, or LaunchDarkly) from a fixed decision table, always accessed through the OpenFeature API so application code never imports a vendor SDK directly.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flag_spec` (object, required): Output of `ffr-flag-type-classify`.
- `platform_constraints` (object, required): Languages in use, where services run (Kubernetes, VMs, serverless, browser, mobile), data residency or self-hosting requirements, whether a paid SaaS vendor is allowed, and whether flag changes must go through Git review.
- `existing_flag_system` (string, optional): Name of a flag system already in production, if any.

---

## Outputs

- `provider_choice` (object): `provider` (flagd | unleash | launchdarkly), `mode` (for flagd: file | kubernetes | sync; for others: saas | self_hosted), the OpenFeature provider package per language, the decision table row used, and `open_questions`.

---

## Phase 1: Check What Already Exists

### Entry Criteria
- `platform_constraints` lists the languages.

### Actions
1. If `existing_flag_system` is set to flagd, Unleash, or LaunchDarkly, choose it and skip to Phase 3. Running two flag systems doubles the places a flag can be stale. Record "existing system reused" as the reason.
2. If `existing_flag_system` is another product (for example Flagsmith, ConfigCat, GrowthBook, Split), record it, and check the OpenFeature ecosystem page (https://openfeature.dev/ecosystem) for a provider for every language in `platform_constraints`. If one exists for every language, record the product as the provider with an open question that the later setup flows in this chain cover only flagd, Unleash, and LaunchDarkly. Stop this flow.
3. If a homegrown config file or environment-variable switch already exists, note it. It will be migrated to flagd file mode in the next phase, because flagd reads a JSON file with the same shape every OpenFeature SDK understands.

### Output
Either a reused provider or "no existing system".

### Quality Gate
- The reason for reuse or non-reuse is one sentence that names `existing_flag_system` or says it was empty.

---

## Phase 2: Apply the Decision Table

### Entry Criteria
- No existing system to reuse.

### Actions
1. Go down this table. Use the first row whose condition is true.

| Row | Condition from `platform_constraints` | Choose |
|---|---|---|
| 1 | Flags must change only through Git pull requests, and services run on Kubernetes | flagd, mode `kubernetes` (OpenFeature Operator `FeatureFlag` custom resources) |
| 2 | Flags must change only through Git pull requests, no Kubernetes | flagd, mode `file` (flags file shipped with the service or mounted) |
| 3 | Self-hosting is required (data residency, no SaaS allowed) and people outside engineering must toggle flags in a UI | Unleash, mode `self_hosted` |
| 4 | SaaS is allowed and the team needs built-in experiment analysis, metric-guarded rollouts, approvals, and audit history | LaunchDarkly, mode `saas` |
| 5 | SaaS is allowed but none of row 4's needs are present | Unleash, mode `self_hosted` or Unleash hosted, recorded as an open question about who runs it |

2. If the flag type is `experiment` and the choice is flagd, add an open question: flagd assigns variants (`fractional` targeting) but does not compute experiment statistics, so analysis must run in your analytics stack (see `ffr-experiment-readout`).
3. If any client runs in a browser or mobile app, record the client-side access path: flagd via OFREP (port 8016) or the flagd web provider; Unleash via Unleash Edge or the Frontend API with a frontend token; LaunchDarkly via the client-side ID or mobile key. Never ship a server SDK key, Unleash admin token, or LaunchDarkly server SDK key to a browser or app bundle.

### Output
Provider and mode with the row number.

### Quality Gate
- The row number used is recorded, and every row above it has a written reason why it was false.
- If any client is a browser or mobile app, the client-side path is named.

---

## Phase 3: Name the OpenFeature Provider Packages

### Entry Criteria
- Provider chosen.

### Actions
1. For each language in `platform_constraints`, write the OpenFeature SDK package and the provider package. Start from this list, then confirm each name exists in its registry before writing it down (run the listed command; a 404 or "not found" means you must look up the current name on openfeature.dev/ecosystem):

| Language | OpenFeature SDK | Confirm command |
|---|---|---|
| Python | `openfeature-sdk` | `pip index versions openfeature-sdk` |
| Node.js server | `@openfeature/server-sdk` | `npm view @openfeature/server-sdk version` |
| Browser / React | `@openfeature/web-sdk`, `@openfeature/react-sdk` | `npm view @openfeature/react-sdk version` |
| Go | `github.com/open-feature/go-sdk` | `go list -m -versions github.com/open-feature/go-sdk` |
| Java | `dev.openfeature:sdk` | search Maven Central for `dev.openfeature:sdk` |

| Provider | Known provider packages (confirm before use) |
|---|---|
| flagd | Python `openfeature-provider-flagd`; Node `@openfeature/flagd-provider`; Web `@openfeature/flagd-web-provider`; Go `github.com/open-feature/go-sdk-contrib/providers/flagd`; Java `dev.openfeature.contrib.providers:flagd` |
| LaunchDarkly | Node `@launchdarkly/openfeature-node-server`; Python `launchdarkly-openfeature-server`; Java `com.launchdarkly:launchdarkly-openfeature-serverprovider`; Go: check LaunchDarkly's OpenFeature provider repository |
| Unleash | check openfeature.dev/ecosystem per language; if a language has no Unleash OpenFeature provider, record it as an open question |

2. Do not write a package name you did not confirm. A guessed name can install a typosquatted package.

### Output
`provider_choice`.

### Quality Gate
- Every package listed has the confirm command and its output (a version number) pasted next to it, or an open question saying it was not found.

---

## Worked Example

Illustrative only.

`platform_constraints`: Python and Go services on Kubernetes, EU data residency, product managers must toggle flags in a UI, no Git-only rule. `existing_flag_system` empty.

Phase 2: Row 1 false (no Git-only rule). Row 2 false (same). Row 3 true: self-hosting required and non-engineers need a UI. Choose Unleash, self_hosted.

Phase 3:
```
$ pip index versions openfeature-sdk
openfeature-sdk (0.8.1)
...
$ go list -m -versions github.com/open-feature/go-sdk
github.com/open-feature/go-sdk v1.0.0 v1.1.0 ... 
```
Unleash OpenFeature provider for Python: looked up on openfeature.dev/ecosystem; result recorded with version, or an open question if missing.

---

## Exit Criteria

DONE when `provider_choice` names one provider and mode with the table row, lists confirmed package names per language, and records the client-side path for any browser or mobile client.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Existing system is not flagd, Unleash, or LaunchDarkly | **Return**: record it with an open question; the setup flows in this chain do not cover it. |
| Phase 2 | Constraints contradict (Git-only and a UI for non-engineers) | **Return**: ask which wins; do not pick for the user. |
| Phase 3 | Provider package not found for a language | **Adjust**: check openfeature.dev/ecosystem; if still missing, record an open question and keep the language on the SDK default until resolved. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
