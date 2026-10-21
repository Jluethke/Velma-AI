# Flag Archive in the Provider After Removal

**One-line description:** Archives a removed flag in Unleash or LaunchDarkly (or confirms its deletion from flagd files) only after the removal change is deployed everywhere and the provider shows zero evaluations for the key across a full observation window, so no running consumer can fall back to a stale default.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `removal_pr` (object, required): Output of `ffr-flag-removal-pr`; must be merged.
- `provider_choice` (object, required): Output of `ffr-provider-select`.

---

## Outputs

- `archive_record` (object): Deployment evidence per environment, the zero-evaluation evidence with its window, the archive API call and response, and the final provider state.

---

## Phase 1: Confirm the Removal Is Deployed Everywhere

### Entry Criteria
- `removal_pr` is merged to the default branch.

### Actions
1. For each environment and each service that referenced the flag, confirm the running version contains the merge commit. Example checks: `kubectl get deploy checkout -n prod -o jsonpath='{.spec.template.spec.containers[0].image}'` and compare the image tag to the build of the merge commit; or the service's `/version` endpoint.
2. Include every consumer type: services, workers, scheduled jobs, browser bundles (CDN cache), and mobile apps. Mobile apps keep old versions in the field for a long time; if a mobile app evaluated this flag, archiving waits until the app versions that read it fall below the owner's support policy. Record that as an open question with the version numbers.

### Output
Deployment evidence per consumer.

### Quality Gate
- Every consumer listed in the removal PR has a running version containing the merge commit (command and output shown), or an open question explaining why not.

---

## Phase 2: Confirm Zero Evaluations

### Entry Criteria
- All consumers deployed.

### Actions
1. Read the provider's usage for the key:

| Provider | Where |
|---|---|
| LaunchDarkly | flag status API `GET /api/v2/flag-statuses/<project>/<env>/<flag>` (`lastRequested`) for each environment; the flag's Insights or evaluations graph |
| Unleash | `lastSeenAt` on the flag and per environment in the Admin API; the flag's metrics view |
| flagd | your `feature_flag` metrics filtered by key, if exported; otherwise only the code search |

2. The last evaluation time must be before the last deployment time from Phase 1, in every environment. Wait one full observation window after deployment before trusting a zero (for example, the provider's documented metrics reporting interval plus your slowest consumer's cycle, such as a weekly job). Write the window and its reason.
3. If evaluations continue after deployment, something still reads the flag. Find it before archiving (search other repositories, check the provider's connected applications list).

### Output
Zero-evaluation evidence.

### Quality Gate
- For each environment, `lastRequested` or `lastSeenAt` is earlier than the deployment time (both timestamps shown).
- The observation window is written with its reason.

---

## Phase 3: Archive

### Entry Criteria
- Zero evaluations confirmed.

### Actions
1. Archive (not hard delete) so the key stays reserved and the audit history remains:
   - Unleash: `curl -s -X DELETE -H "Authorization: $UNLEASH_ADMIN_TOKEN" "$UNLEASH_URL/api/admin/projects/default/features/checkout-new-tax-engine"` archives the flag (Unleash archives on delete from a project; confirm in the API reference for your version).
   - LaunchDarkly: `curl -s -X PATCH -H "Authorization: $LD_API_TOKEN" -H "Content-Type: application/json" "https://app.launchdarkly.com/api/v2/flags/shop/checkout-new-tax-engine" -d '[{"op":"replace","path":"/archived","value":true}]'`.
   - flagd: confirm the key is absent from all flag files on the default branch: `rg -n --fixed-strings "checkout-new-tax-engine" flags/` returns nothing.
2. Read the flag back and confirm its archived state.
3. Remove the flag from `flag_inventory_export` or any registry file in a small separate commit.
4. Do not reuse the key for a new flag.

### Output
`archive_record`.

### Quality Gate
- The read-back shows the flag archived (`"archived": true` in LaunchDarkly; the flag listed under the archive endpoint in Unleash), or the flagd search returns nothing.

---

## Worked Example

Illustrative only. Unleash, two services.

```
$ kubectl get deploy checkout -n prod -o jsonpath='{.spec.template.spec.containers[0].image}'
registry.example.com/checkout:2026.10.27-4f1c2ab
$ git merge-base --is-ancestor 9e8d7c1 4f1c2ab && echo contains
contains
$ curl -s -H "Authorization: $UNLEASH_ADMIN_TOKEN" "$UNLEASH_URL/api/admin/projects/default/features/checkout-new-tax-engine" | jq '{lastSeenAt}'
{"lastSeenAt": "2026-10-27T10:02:44Z"}
```
Deployed 2026-10-27T10:15Z; last seen 10:02Z; waited until 2026-11-03 (weekly reconciliation job cycle). Archived:
```
$ curl -s -o /dev/null -w "%{http_code}\n" -X DELETE -H "Authorization: $UNLEASH_ADMIN_TOKEN" "$UNLEASH_URL/api/admin/projects/default/features/checkout-new-tax-engine"
202
```

---

## Exit Criteria

DONE when every consumer runs the removal, the provider shows no evaluations after deployment across a stated window, and the flag is archived and read back as archived.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A consumer still runs an old version | **Return**: wait for deployment; do not archive. |
| Phase 2 | Evaluations after deployment | **Stop**: find the remaining consumer; archiving now would flip it to its code default. |
| Phase 3 | Archive call returns 409 or a dependency error | **Adjust**: another flag uses this one as a prerequisite or dependency; remove that link first. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
