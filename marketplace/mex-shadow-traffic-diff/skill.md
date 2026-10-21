# Shadow Traffic and Response Diff

**One-line description:** Proves the new path returns the same results as the old path on real inputs before any user sees it, by running both and comparing (an in-process experiment that returns the old result, or nginx `mirror` or recorded-request replay for a service), with volatile fields stripped by `jq`, every difference classified, and writes kept out of shadow traffic.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `routing_config` (object, optional): From `mex-strangler-proxy-routing`; absent when the decision is `in_process`.
- `characterization_suite` (object, required): From `mex-characterization-tests`; supplies the volatile field list.
- `baseline_outputs` (object, required): From `mex-characterization-tests`.
- `deployment_decision` (string, required): `in_process` or `service`.

---

## Outputs

- `parity_report` (object): Method used, sample size, the ignore list for volatile fields, match count, mismatch count by class (`bug_new`, `bug_old`, `expected_difference`, `volatile_missed`), example diffs, and the decision `parity_ok` true or false.

---

## Phase 1: Choose the Shadow Method

### Entry Criteria
- The characterization suite passes against the new path (in-process implementation or HTTP client).

### Actions
1. Pick from this table, first matching row:

   | Condition | Method |
   |---|---|
   | `deployment_decision` is `in_process` | Experiment in code: call old and new, compare, log differences, always return the old result |
   | `service` and only read endpoints are being compared | nginx `mirror` (or Envoy `request_mirror_policies`) to the new service, plus response logging on both |
   | `service` and write endpoints are involved | Replay recorded requests against an isolated copy of the new service with its own database; never mirror writes to a service sharing production data |

2. Writes are never executed twice against shared production data. A mirrored `POST /api/invoices` would create a second invoice.

### Output
Chosen method.

### Quality Gate
- If mirroring is chosen, the mirrored location's methods are limited to `GET` and `HEAD` (check the config).

---

## Phase 2: Run Both Paths

### Entry Criteria
- Method chosen.

### Actions
1. In-process experiment (pattern from GitHub's Scientist library; ports exist for several languages, verify a port is maintained before adding one, or write the pattern directly):
   ```python
   def get_invoice(invoice_id):
       old = legacy_get_invoice(invoice_id)
       if flags.enabled("billing-shadow"):
           try:
               new = billing_api.get_invoice(invoice_id)
               if normalize(new) != normalize(old):
                   log.warning("billing_shadow_mismatch", extra={"id": invoice_id, "old": normalize(old), "new": normalize(new)})
           except Exception:
               log.exception("billing_shadow_error")
       return old
   ```
   The new call must not change state, and its exceptions must never reach the user.
2. nginx mirror for reads:
   ```nginx
   location /api/invoices {
       mirror /_shadow_billing;
       mirror_request_body off;
       proxy_pass http://monolith;
   }
   location = /_shadow_billing {
       internal;
       if ($request_method !~ ^(GET|HEAD)$) { return 204; }
       proxy_pass http://billing$request_uri;
   }
   ```
   nginx discards mirror responses, so log the response body on both backends keyed by `X-Request-ID`, then join the logs.
3. Replay: export a sample of real requests (access logs or a capture), then for each request: `curl -s "$OLD$path" | jq -S "$IGNORE" > old/$n.json` and `curl -s "$NEW$path" | jq -S "$IGNORE" > new/$n.json`, where `$IGNORE` is a `jq` filter such as `del(.request_id, .generated_at) | walk(if type == "object" then del(.etag) else . end)`.
4. Sample size: ask the user, or cover every route and every status value seen in production logs at least once; record what was covered.

### Output
Paired old and new responses.

### Quality Gate
- Every route in the route table (or every public API operation, in-process) has at least one compared pair.

---

## Phase 3: Classify Differences

### Entry Criteria
- Pairs collected.

### Actions
1. Diff: `diff -r old new` or, for logged pairs, compare normalized JSON. Count matches and mismatches.
2. Classify each mismatch:

   | Class | Test | Action |
   |---|---|---|
   | `volatile_missed` | Differs only in a timestamp, ID, ordering of an unordered list | Add to the ignore filter; rerun |
   | `expected_difference` | Documented in the anti-corruption layer mapping (for example money now integer minor units) | Normalize both sides to the same representation; rerun |
   | `bug_new` | New path disagrees with old and with the characterization snapshot | Fix the new path; add a regression test |
   | `bug_old` | Old path is wrong by the business rule | Do not fix silently; report to the user, who decides whether the new path keeps the old behavior |

3. `parity_ok` is true only when `bug_new` and unclassified counts are zero on the final run.
4. Do not widen the ignore filter to hide business fields. Every ignored path is listed in the report with the reason.

### Output
`parity_report`.

### Quality Gate
- Final run mismatch counts by class are recorded, and `bug_new` is zero for `parity_ok = true`.
- The ignore list contains only fields named in the characterization suite's volatile list or the mapping table.

---

## Worked Example

Illustrative. Service, read endpoints, replay of 2,000 requests sampled from one day of access logs (user choice).

```
$ for p in $(cat paths.txt); do n=$((n+1)); curl -s "$OLD$p" | jq -S 'del(.request_id)' > old/$n.json; curl -s "$NEW$p" | jq -S 'del(.request_id)' > new/$n.json; done
$ diff -rq old new | wc -l
37
```
Classes: 30 `volatile_missed` (`.links.self` host differs; normalized), 5 `expected_difference` (`total` vs `total_minor`; normalized via mapping), 2 `bug_new` (time zone: new service rendered `issued_at` in UTC, old in store local time per ACL quirk table). Fixed; rerun: 0 mismatches. `parity_ok = true`.

---

## Exit Criteria

DONE when every route or operation has been compared on real inputs, every mismatch is classified, and the final run has zero `bug_new` and zero unclassified differences.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Only write endpoints exist | **Adjust**: use the replay method against an isolated copy. |
| Phase 2 | Shadow path adds latency to user requests | **Adjust**: in-process, run the new call asynchronously or sample a fraction set by the user; with mirror, confirm nginx is not waiting on the mirror subrequest for the client response. |
| Phase 3 | Mismatch count does not drop after fixes | **Retry**: re-check normalization on both sides; compare raw bodies for one pair by hand. |
| Phase 3 | `bug_old` found | **Return**: user decides; record the decision in the report. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
