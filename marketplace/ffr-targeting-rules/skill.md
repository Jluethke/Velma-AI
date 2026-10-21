# Flag Targeting Rules and Sticky Percentage Bucketing

**One-line description:** Writes the targeting rules for one flag in the chosen provider's own syntax (flagd JsonLogic with `fractional`, Unleash strategies and constraints, or LaunchDarkly rules and percentage rollouts), with a stable bucketing key, correct rule order, and a sampled check that raising the percentage never moves users out of the new variant.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flag_spec` (object, required): Output of `ffr-flag-type-classify`.
- `provider_choice` (object, required): Output of `ffr-provider-select`.
- `audience_definition` (object, required): Who should get the new variant first (internal users, a tenant list, a country, a plan), the bucketing unit (user, account, device, request), and which attributes the application can send.

---

## Outputs

- `targeting_rules` (object): The rule definition in provider syntax, the bucketing key, the attribute list with privacy notes, rule order, and the stickiness check results.

---

## Phase 1: Choose the Bucketing Key and Attributes

### Entry Criteria
- `audience_definition` names a bucketing unit.

### Actions
1. Pick the targeting key from the bucketing unit:

| Bucketing unit | Targeting key | Use when |
|---|---|---|
| user | stable user ID | behavior is per person, user is logged in |
| account or tenant | account ID | all users in one company must see the same thing (B2B, shared data) |
| device | a persisted anonymous ID (cookie or app install ID) | logged-out traffic |
| request | none | never for rollouts; a per-request key gives a different answer each request |

2. If both anonymous and logged-in traffic hit the flag, record an open question on identity handoff: the anonymous ID and user ID hash to different buckets, so a user can switch variants at login.
3. List only attributes the rules need. Do not send email, full name, or other personal data to a SaaS provider unless policy allows; LaunchDarkly supports private attributes (`privateAttributes` in the SDK config or `_meta.privateAttributes` in the context) that are used for targeting but not stored.
4. Check that the application actually sends each attribute: find it in the evaluation context at every call site from earlier flows.

### Output
Targeting key and attribute list.

### Quality Gate
- The targeting key is a stable identifier, not a request or session-per-request value.
- Every attribute used in rules appears in the call-site context code (file and line listed).

---

## Phase 2: Write the Rules in Provider Syntax

### Entry Criteria
- Key and attributes chosen.

### Actions
1. Order rules from most specific to least: explicit allow lists (internal users, named tenants), then attribute rules, then the percentage rollout, then the default. Know how each provider combines rules:

| Provider | How rules combine |
|---|---|
| flagd | JsonLogic `if` is evaluated top to bottom; the first true branch returns its variant |
| Unleash | multiple strategies on one environment are OR: the flag is on if any strategy matches; constraints inside one strategy are AND |
| LaunchDarkly | individual targets first, then rules top to bottom (first match wins), then the default (fallthrough) rule |

2. flagd example (internal users on, then a fractional split, otherwise off):
```json
"targeting": {
  "if": [
    { "ends_with": [{ "var": "email_domain" }, "example.com"] }, "on",
    { "fractional": [ ["on", 5], ["off", 95] ] },
    null
  ]
}
```
`fractional` hashes the bucketing value to a variant by weight. With no explicit bucketing expression, the flagd docs state it buckets on the flag key combined with `targetingKey`, so two flags do not put the same users in the same bucket. If you pass your own bucketing expression, combine the flag key and the ID (`{"cat": [{"var": "$flagd.flagKey"}, {"var": "accountId"}]}`); bucketing on the bare ID makes every flag at 5 percent hit the same 5 percent of users. Returning `null` falls back to `defaultVariant`. Check the flagd docs for whether `fractional` returns a variant for every key (if it always does, the trailing `null` is unreachable, which is fine).
3. Unleash: add a `flexibleRollout` strategy. Use the exact parameter names from the Unleash docs: `rollout` (percent, as a string), `stickiness` (`default`, `userId`, `sessionId`, or a custom context field), `groupId` (set it to the flag name so different flags bucket independently):
```
curl -s -X POST "$UNLEASH_URL/api/admin/projects/default/features/checkout-new-tax-engine/environments/production/strategies" \
  -H "Authorization: $UNLEASH_ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"flexibleRollout","parameters":{"rollout":"5","stickiness":"userId","groupId":"checkout-new-tax-engine"},"constraints":[]}'
```
Remember OR semantics: a second strategy targeting internal users adds to the 5 percent; it does not narrow it.
4. LaunchDarkly: use a percentage rollout on the default rule with the bucketing context kind and attribute set to your targeting key (default is the context `key`). For account-level bucketing use a multi-context with an `organization` kind and bucket by it. Set it in the UI or with a semantic patch; check the API reference for the instruction names before sending.
5. The percentage values themselves come from `ffr-rollout-stage-plan`. Put the first stage value here only if it is already decided; otherwise leave the rollout at 0.

### Output
Rules in provider syntax.

### Quality Gate
- The rule definition is saved and read back from the provider (flagd file passes `check-jsonschema`; Unleash and LaunchDarkly read back via their API) and matches what was written.
- Rule order matches the most-specific-first order, with the provider's combine rule written next to it.

---

## Phase 3: Verify Distribution and Stickiness

### Entry Criteria
- Rules saved.

### Actions
1. Generate a sample of synthetic targeting keys (for example `user-0` to `user-9999`) and evaluate each against the provider at the current percentage. For flagd, loop over the OFREP endpoint with curl; for Unleash and LaunchDarkly, a short script using the server SDK and the same evaluation context shape.
2. Count variants. The observed share should be near the configured weight; report the count and the configured value. Do not declare pass or fail on a tolerance you made up; report both numbers and the binomial standard error `sqrt(p*(1-p)/n)` so the reader can judge.
3. Raise the percentage in a test environment (for example from 5 to 10), evaluate the same keys again, and count keys that were `on` before and are `off` now. That count must be 0. Any nonzero count means bucketing is not monotonic and users would flip back during rollout.
4. Evaluate one internal user and one key that should match an attribute rule; confirm each gets the variant its rule names.
5. Restore the test environment percentage.

### Output
`targeting_rules`.

### Quality Gate
- Variant counts and the standard error are recorded for the sample.
- Keys moving from on to off when the percentage increases: 0 (exact count shown).
- Each named rule returns its expected variant for one sample context, with the response pasted.

---

## Worked Example

Illustrative only. flagd, bucketing by user ID, 10000 synthetic keys.

```
$ for i in $(seq 0 9999); do curl -s -X POST localhost:8016/ofrep/v1/evaluate/flags/checkout-new-tax-engine -H 'Content-Type: application/json' -d "{\"context\":{\"targetingKey\":\"user-$i\"}}" | jq -r .variant; done | sort | uniq -c
    512 on
   9488 off
```
Configured 5 percent; observed 5.12 percent; standard error sqrt(0.05*0.95/10000) = 0.0022. After raising to 10 percent: 1003 on, and 0 of the earlier 512 moved to off.

---

## Exit Criteria

DONE when rules are stored in the provider in most-specific-first order with a stable bucketing key, attributes are confirmed sent by the code, the sample distribution is reported with its standard error, and raising the percentage moved zero users out of the new variant.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No stable identifier available | **Return**: record an open question; do not roll out by percentage until one exists. |
| Phase 2 | Unleash flag on for more users than expected | **Adjust**: a second strategy is OR'd in; move the audience into constraints of one strategy. |
| Phase 3 | Users move from on to off when raising the percentage | **Stop**: check the bucketing value and `groupId` or salt did not change; do not proceed with rollout. |
| Phase 3 | Attribute rule does not match | **Adjust**: compare attribute names and casing between code and rule. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
