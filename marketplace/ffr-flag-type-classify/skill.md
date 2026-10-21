# Feature Flag Type Classification

**One-line description:** Classifies one proposed feature flag as a release flag, ops kill switch, experiment, or permission flag using a fixed decision table, then records its key, owner, safe default, lifetime, and expiry in a single flag spec that every later flow reads.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `change_description` (string, required): What the flag will guard: the code change, the user-facing behavior, who asked for it, and why it needs a flag instead of a plain deploy.
- `team_conventions` (object, optional): Existing flag naming rules, required metadata fields, and maximum lifetime policy, if the team has written any down. When absent, this flow uses the defaults stated below and marks them as proposed.

---

## Outputs

- `flag_spec` (object): One record with `key`, `type` (release | kill_switch | experiment | permission), `owner` (a person or team handle), `value_type` (boolean | string | number | object), `variants`, `safe_default`, `temporary` (true | false), `expiry_date` (ISO date or null for permanent types), `removal_condition`, and `open_questions`.

---

## Phase 1: Pick the Flag Type

### Entry Criteria
- `change_description` names the code path or behavior that will be switched.

### Actions
1. Read `change_description` once and write down, in one sentence, what changes when the flag flips. If you cannot write that sentence, stop and ask for it.
2. Answer the four questions below in order. The first "yes" decides the type. Do not keep going after the first yes.

| Order | Question | If yes, type is | Temporary? |
|---|---|---|---|
| 1 | Does the flag decide which customers, plans, roles, or tenants are allowed to use a capability, with no plan to remove it? | `permission` | No |
| 2 | Is the flag meant to turn off a feature or a dependency call during an incident, and stay in the code afterward? | `kill_switch` | No |
| 3 | Will two or more variants be compared on a metric to decide which one ships? | `experiment` | Yes |
| 4 | Does the flag hide new or changed code until it is rolled out to everyone? | `release` | Yes |

3. If none of the four is "yes", record the case in `open_questions` and stop. A flag with no type has no removal plan.
4. If two questions both look true (for example, a new feature that also needs a kill switch), split it into two flags with two keys. One flag guards one decision. Never reuse one key for two purposes.
5. For `permission`: add an open question asking whether the capability belongs in the entitlement or authorization system instead of the flag system. A flag evaluated on the client is never an authorization check; the server must enforce access.

### Output
The chosen type and the one-sentence description of what flips.

### Quality Gate
- Exactly one type is recorded, and the table row number that produced it is written next to it.
- If the change needed two decisions, two separate flag records exist.

---

## Phase 2: Name and Describe the Flag

### Entry Criteria
- Type chosen.

### Actions
1. If `team_conventions` defines a key format, use it exactly. Otherwise use lowercase kebab-case: `<area>-<thing>` such as `checkout-new-tax-engine`. Keys must match the regex `^[a-z0-9][a-z0-9-]*$` so they work in flagd, Unleash, and LaunchDarkly keys without escaping.
2. Search the repository for the key before using it, so you never collide with an old flag: `rg -n --fixed-strings "checkout-new-tax-engine" .` must return zero lines. Also search the flag service UI or API for archived flags with the same key. Never reuse an archived key; old SDK caches or old code can still hold it.
3. Pick `value_type` with this rule: `release`, `kill_switch`, and `permission` are `boolean`. `experiment` is `string` with one variant per arm (for example `control`, `treatment`), unless the arms are just on and off, in which case it may be `boolean`.
4. Write the `variants` map. Boolean flags: `{"on": true, "off": false}`. String flags: one entry per arm.
5. Set `owner` to a named person or team handle from `change_description`. If no owner is named, add an open question. Do not invent a name.

### Output
Key, value type, variants, and owner.

### Quality Gate
- `rg -n --fixed-strings "<key>" .` output was run and is empty (paste the command and the empty result).
- The key matches `^[a-z0-9][a-z0-9-]*$`.
- `owner` is copied from an input, or an open question says it is missing.

---

## Phase 3: Safe Default, Lifetime, and Expiry

### Entry Criteria
- Key and variants recorded.

### Actions
1. Set `safe_default` from this table. The safe default is the value the code passes to the SDK as its fallback, served whenever the flag service is unreachable, the flag is missing, or the type does not match.

| Type | Safe default | Reason |
|---|---|---|
| release | the variant that runs the old code path (usually `false`) | the new code is the unproven part |
| kill_switch | the variant that means "feature runs normally" | an outage of the flag service must not switch off a healthy feature; record an open question if the feature itself is the hazard |
| experiment | `control` | users who cannot be assigned see the existing experience and are excluded from analysis |
| permission | the variant that denies access | fail closed |

2. Set `temporary`: true for `release` and `experiment`, false for `kill_switch` and `permission`.
3. Set `expiry_date` for temporary flags. Use the first source that exists:
   - a maximum lifetime in `team_conventions`;
   - the documented expected lifetime of the flag service you already run (Unleash documents 40 days for release and experiment flag types);
   - otherwise leave the date empty and add an open question "maximum flag lifetime not set". Do not make up a number of days.
4. Write `removal_condition` as an observable event, for example "flag served `on` to 100 percent of production for one full release cycle and no rollback in that window" or "experiment decision recorded". Permanent flags get "review yearly: still needed?" only if the team has a review cadence; otherwise an open question.

### Output
`flag_spec`.

### Quality Gate
- `safe_default` matches the table row for the chosen type.
- Every temporary flag has either an `expiry_date` with its source named, or an open question.
- `flag_spec` is valid JSON: `python -c "import json,sys; json.load(open('flag_spec.json'))"` exits 0.

---

## Worked Example

Illustrative only.

Input `change_description`: "Payments team rewrote tax calculation (`tax/engine_v2.py`). Want to ship dark and turn on gradually. Owner @payments-core." No `team_conventions`; the team already runs Unleash.

Phase 1: Question 4 is the first yes, so type is `release` (row 4). No kill switch is requested, so one flag.

Phase 2:
```
$ rg -n --fixed-strings "checkout-new-tax-engine" .
$ echo $?
1
```
Exit code 1 with no output means no match. Key `checkout-new-tax-engine`, boolean, owner `@payments-core`.

Phase 3:
```json
{
  "key": "checkout-new-tax-engine",
  "type": "release",
  "owner": "@payments-core",
  "value_type": "boolean",
  "variants": {"on": true, "off": false},
  "safe_default": false,
  "temporary": true,
  "expiry_date": "2026-11-29",
  "expiry_source": "Unleash documented expected lifetime for release flags (40 days)",
  "removal_condition": "served on to 100 percent of production for one release cycle with no rollback",
  "open_questions": []
}
```

---

## Exit Criteria

DONE when `flag_spec` exists as valid JSON, names exactly one type with its table row, has a collision-free key, a safe default taken from the table, and either an expiry with a named source or an open question.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No table question is answered "yes" | **Stop**: return the case to the requester; a flag without a type has no removal plan. |
| Phase 1 | Change needs two decisions | **Adjust**: create two flag specs with two keys. |
| Phase 2 | Key already exists in code or as an archived flag | **Adjust**: choose a new key; never reuse. |
| Phase 2 | No owner named | **Return**: record an open question and ask the requester. |
| Phase 3 | No lifetime policy and no provider default | **Return**: leave `expiry_date` empty with an open question; do not invent days. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
