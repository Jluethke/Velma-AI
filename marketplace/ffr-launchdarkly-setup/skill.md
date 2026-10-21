# LaunchDarkly Flag Creation and Key Handling

**One-line description:** Creates one LaunchDarkly flag through the REST API v2 with the right temporary marker, variations, and on/off defaults, maps each consumer to the correct per-environment key (server SDK key, mobile key, or client-side ID), and proves the flag state with an API read.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flag_spec` (object, required): Output of `ffr-flag-type-classify`.
- `provider_choice` (object, required): Output of `ffr-provider-select`; `provider` must be `launchdarkly`.
- `repo_path` (string, required): Repository root; used only to check that no key is committed.

---

## Outputs

- `launchdarkly_config` (object): Project key, environment keys, flag key, variation indexes for on and off, the key type per consumer with environment variable names, and the API transcript.

---

## Phase 1: Prepare API Access

### Entry Criteria
- `provider_choice.provider` == "launchdarkly".

### Actions
1. Create an API access token in LaunchDarkly (Account settings, Authorization) with a role that can create flags in one project only. Export it: `export LD_API_TOKEN=api-...`. Do not use an SDK key for the REST API; they are different credentials.
2. List projects and environments to get exact keys:
```
curl -s -H "Authorization: $LD_API_TOKEN" https://app.launchdarkly.com/api/v2/projects/<projectKey>?expand=environments
```
3. Record the environment keys (for example `production`, `test`). Every flag exists in every environment of a project, with separate targeting per environment.
4. If you prefer the official CLI, `ldcli` covers the same API. Run `ldcli --help` and `ldcli flags --help` and use only subcommands and flags shown there.

### Output
Project and environment keys.

### Quality Gate
- The projects API call returned HTTP 200 and the environment keys are copied from its response, not typed from memory.

---

## Phase 2: Create the Flag

### Entry Criteria
- Project key known.

### Actions
1. Build the body. Set `temporary` to `flag_spec.temporary`. For boolean flags the variation order below makes index 0 `true` and index 1 `false`.
```
curl -s -X POST "https://app.launchdarkly.com/api/v2/flags/<projectKey>" \
  -H "Authorization: $LD_API_TOKEN" -H "Content-Type: application/json" \
  -d '{
    "name": "Checkout new tax engine",
    "key": "checkout-new-tax-engine",
    "description": "Gates tax engine v2. Owner @payments-core.",
    "temporary": true,
    "tags": ["release", "payments-core"],
    "variations": [{"value": true, "name": "on"}, {"value": false, "name": "off"}],
    "defaults": {"onVariation": 1, "offVariation": 1}
  }'
```
2. Understand the two defaults. `offVariation` is served when targeting is turned off in an environment. `onVariation` is the fallthrough served when targeting is on and no rule matches. Start with both pointing at the safe variant (index 1 here). Rollout and rules are added in `ffr-targeting-rules`.
3. Put the flag type and owner in `tags` so cleanup tooling can filter on them; LaunchDarkly also has a maintainer field you can set to the owner's member ID.
4. For `experiment` flags, add one variation per arm and keep `offVariation` on `control`.

### Output
Flag created.

### Quality Gate
- `curl -s -H "Authorization: $LD_API_TOKEN" https://app.launchdarkly.com/api/v2/flags/<projectKey>/checkout-new-tax-engine` returns `"temporary": true` (for temporary types) and, for each environment under `environments`, `"on": false` with `offVariation` equal to the safe variant index.

---

## Phase 3: Map Keys to Consumers

### Entry Criteria
- Flag exists.

### Actions
1. Use one key type per consumer, per environment:

| Consumer | LaunchDarkly credential | Secret? |
|---|---|---|
| Backend service | SDK key (starts with `sdk-`) | Yes |
| Mobile app | Mobile key (starts with `mob-`) | Treat as sensitive; it ships in the app |
| Browser app | Client-side ID | No; also turn on "SDKs using Client-side ID" for this flag only if the browser needs it |

2. Record the environment variable names (`LD_SDK_KEY`, and so on). Never record values.
3. Check the repository for committed keys: `git -C <repo_path> grep -nE "sdk-[0-9a-f]{8}-|mob-[0-9a-f]{8}-|api-[0-9a-f]{8}-"`. It must return nothing.
4. If the browser needs the flag, enable client-side availability for it (the flag's `clientSideAvailability` setting, `usingEnvironmentId: true`). Without it the client SDK silently gets the code default.
5. Record the evaluation path: server SDKs keep a streaming connection and evaluate locally; if the network blocks streaming, the LaunchDarkly Relay Proxy is the documented option. This affects kill-switch speed, measured in `ffr-kill-switch-drill`.

### Output
`launchdarkly_config`.

### Quality Gate
- The secret scan command returns no lines.
- Every consumer has one credential type and one variable name.
- If a browser consumes the flag, the flag read shows client-side availability enabled.

---

## Worked Example

Illustrative only.

```
$ curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: $LD_API_TOKEN" "https://app.launchdarkly.com/api/v2/projects/shop?expand=environments"
200
$ curl -s -H "Authorization: $LD_API_TOKEN" https://app.launchdarkly.com/api/v2/flags/shop/checkout-new-tax-engine | jq '{temporary, prod: .environments.production | {on, offVariation}}'
{ "temporary": true, "prod": { "on": false, "offVariation": 1 } }
$ git grep -nE "sdk-[0-9a-f]{8}-|mob-[0-9a-f]{8}-|api-[0-9a-f]{8}-"
$
```

---

## Exit Criteria

DONE when the flag exists with the correct temporary marker, every environment is off and serving the safe variant, each consumer has the right credential type recorded by variable name, and no key is in the repository.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | 401 from the API | **Adjust**: the token is an SDK key or expired; create an API access token. |
| Phase 2 | 409 conflict | **Stop**: the key exists (possibly archived); return to `ffr-flag-type-classify` for a new key. |
| Phase 2 | 400 on create | **Adjust**: read the `message` field; usually a variation index in `defaults` out of range. |
| Phase 3 | A key is found in the repository | **Stop**: rotate the key in LaunchDarkly first, then remove it from code and history per your secret-leak procedure. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
