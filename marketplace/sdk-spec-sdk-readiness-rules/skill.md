# SDK Spec Readiness Rules

**One-line description:** Writes a custom Spectral ruleset that fails a spec which would produce a bad client SDK (missing or non-camelCase operationIds, untyped success responses, undeclared error responses, inline anonymous schemas), proves each rule fires with a mutation check, and reports the violations.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `validated_spec` (string, required): Path to a spec that already passes `sdk-spec-spectral-lint` with zero errors.
- `lint_report` (object, required): Report from `sdk-spec-spectral-lint`; used to confirm the base lint passed and to read the Spectral version.

---

## Outputs

- `readiness_ruleset` (string): Path to `.spectral-sdk.yaml`, the SDK readiness ruleset.
- `readiness_report` (object): Per rule: violation count, each violation's JSON path, and whether the mutation check proved the rule fires.

---

## Phase 1: Write the Ruleset

### Entry Criteria
- `lint_report` shows zero severity 0 results.

### Actions
1. Create `.spectral-sdk.yaml` next to the spec. Write these rules exactly; each targets a defect that breaks or degrades generated clients:
   ```yaml
   extends: ["spectral:oas"]
   rules:
     operation-operationId: error
     sdk-operationid-camel-case:
       description: operationId becomes the method name; it must be camelCase.
       severity: error
       given: "$.paths[*][get,put,post,delete,patch,head,options,trace].operationId"
       then:
         function: casing
         functionOptions:
           type: camel
     sdk-success-response-has-schema:
       description: A 2xx JSON response without a schema generates an untyped return value.
       severity: error
       given: "$.paths[*][get,put,post,delete,patch].responses[?(@property.match(/^2\\d\\d$/) && @property != '204')].content['application/json']"
       then:
         field: schema
         function: truthy
     sdk-error-response-declared:
       description: Each operation must declare a 4XX, a specific 4xx, or a default response so the SDK can type errors.
       severity: warn
       given: "$.paths[*][get,put,post,delete,patch].responses"
       then:
         function: schema
         functionOptions:
           schema:
             anyOf:
               - required: ["default"]
               - required: ["4XX"]
               - required: ["400"]
               - required: ["401"]
               - required: ["403"]
               - required: ["404"]
               - required: ["409"]
               - required: ["422"]
               - required: ["429"]
     sdk-no-inline-response-object:
       description: Inline object schemas get generated names like InlineResponse200; use a named component.
       severity: warn
       resolved: false
       given: "$.paths[*][*].responses[*].content[*].schema"
       then:
         function: schema
         functionOptions:
           schema:
             not:
               required: ["properties"]
   ```
2. Note `resolved: false` on the inline-schema rule. Spectral resolves `$ref` before evaluating rules by default, so without it every referenced schema would look inline.
3. Do NOT invent Spectral function names. The core functions are `alphabetical`, `casing`, `defined`, `enumeration`, `falsy`, `length`, `pattern`, `schema`, `truthy`, `undefined`, `unreferencedReusableObject`, `xor` (plus others listed in the Spectral core functions documentation). Check that page before using any other name.
4. If the API documents another 4xx code (for example `412`) as its only error response, add a `required: ["412"]` branch to `sdk-error-response-declared` instead of disabling the rule.

### Output
`readiness_ruleset` written.

### Quality Gate
- `npx spectral lint <validated_spec> --ruleset .spectral-sdk.yaml` runs without a ruleset load error (no output line containing `Could not parse` or `Invalid ruleset`).
- Each of the four custom rule names appears in the file (`grep -c "^  sdk-" .spectral-sdk.yaml` prints 4).

---

## Phase 2: Mutation-Check Every Rule

### Entry Criteria
- Ruleset loads.

### Actions
1. Copy the spec to a scratch path outside the repository, for example `$TMPDIR/mutant.yaml`. Never mutate the real spec.
2. For each custom rule, make ONE mutation in the copy that must trigger it, run Spectral, and record whether the rule code appears:

| Rule | Mutation | Expected |
|---|---|---|
| `sdk-operationid-camel-case` | Change one operationId to `List_Users` | 1 result with that code |
| `sdk-success-response-has-schema` | Delete `schema` under one `200` `application/json` | 1 result |
| `sdk-error-response-declared` | Delete all 4xx and `default` responses of one operation | 1 result |
| `sdk-no-inline-response-object` | Replace one response `$ref` with an inline `type: object` plus `properties` | 1 result |

3. Command per mutation: `npx spectral lint $TMPDIR/mutant.yaml --ruleset .spectral-sdk.yaml --format json | node -e "const r=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(r.filter(x=>x.code==='RULE').length)"` with `RULE` replaced.
4. Restore the copy from the real spec between mutations.
5. A rule whose mutation produces 0 results is NOT live. Fix its `given` path and repeat. A zero count is a failure, never a pass.

### Output
Mutation result per rule.

### Quality Gate
- Every custom rule shows a count of 1 or more for its mutation.
- The real `validated_spec` file is byte-identical to before (`git diff --exit-code -- <validated_spec>` exits 0, or the checksum matches).

---

## Phase 3: Run on the Real Spec and Report

### Entry Criteria
- All rules proven live.

### Actions
1. Run `npx spectral lint <validated_spec> --ruleset .spectral-sdk.yaml --format json --output spectral-sdk-report.json`.
2. Group results by rule code and fill `readiness_report`.
3. Apply this rule to decide what blocks generation:

| Result | Action |
|---|---|
| Any `error` (operationId missing, not camelCase, untyped 2xx) | Block generation until fixed in the spec or in the SDK copy of the spec |
| `warn` only | Generation may proceed; list each warning as an SDK ergonomics defect |
| No results | Proceed |

4. If you fix the spec copy, rerun Phase 3 Action 1 after each fix.

### Output
`readiness_report`.

### Quality Gate
- `spectral-sdk-report.json` exists and contains zero entries with `"severity": 0`, or `readiness_report` marks generation as blocked with each blocking path listed.

---

## Worked Example

Illustrative only. `validated_spec = api/openapi.yaml`.

Phase 2 mutation of `operationId: listUsers` to `List_Users`:
```
$ npx spectral lint /tmp/mutant.yaml --ruleset api/.spectral-sdk.yaml --format json | node -e "..."
1
```
All four rules print 1.

Phase 3 on the real spec:
```
 88:23  error    sdk-success-response-has-schema  A 2xx JSON response without a schema ...  paths./v1/reports/{id}.get.responses[200].content.application/json
 301:19 warning  sdk-no-inline-response-object    Inline object schemas get generated names ...
✖ 2 problems (1 error, 1 warning, 0 infos, 0 hints)
```
`readiness_report` marks generation blocked by `GET /v1/reports/{id}`. Adding `schema: {$ref: '#/components/schemas/Report'}` and rerunning gives 0 errors, 1 warning.

---

## Exit Criteria

DONE when every custom rule is proven live by mutation and the real spec has zero readiness errors, or the blocking paths are reported.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Ruleset fails to load | **Adjust**: read the Spectral error line; fix YAML indentation or the function name; rerun. |
| Phase 2 | A mutation produces 0 results | **Adjust**: the `given` path does not match; test it on a smaller spec and fix it. Never mark the rule live. |
| Phase 2 | Filter expressions in `given` are rejected | **Adjust**: check the Spectral JSONPath documentation for the supported filter syntax and rewrite the path. |
| Phase 3 | Spec owner refuses a fix | **Return**: keep the fix in the SDK spec copy and record it as a carried patch. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
