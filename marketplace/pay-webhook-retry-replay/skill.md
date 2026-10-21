# Webhook Retries, Missed Events and Replay

**One-line description:** Documents the provider retry schedule, detects failing deliveries from the Dashboard and the Events API, and replays missed events into the idempotent handler with `stripe events resend` or an Events API backfill script, without double processing.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `event_store_schema` (object, required): Output of `pay-webhook-dedup-ordering`.
- `test_env` (object, required): Output of `pay-test-mode-setup`.

---

## Outputs

- `replay_runbook` (object): Retry facts per provider with doc links, the detection query, the backfill procedure, and a test record of one replay.

---

## Phase 1: Record the Retry Contract

### Entry Criteria
- Dedup table in place.

### Actions
1. From each provider's webhook docs, copy the retry behavior into the runbook with the doc URL and the date read. For Stripe, the docs state: in live mode, failed deliveries are retried for up to three days with exponential backoff; test mode (sandboxes) retries fewer times over a shorter window; events can be listed through the API for the last 30 days. For PayPal and Adyen, copy the retry text from their webhook pages; do not fill in numbers you did not read.
2. Record what counts as failure: any non-2xx response or a timeout. A 2xx with an error body still counts as success to the provider.
3. Record Stripe's endpoint behavior when deliveries keep failing: read the "disabled endpoints" notes on the webhooks page and copy them.

### Output
Retry contract section.

### Quality Gate
- Every number in the section has a doc URL next to it.

---

## Phase 2: Detect Missed or Failed Events

### Entry Criteria
- Phase 1 done.

### Actions
1. Dashboard: Workbench or Developers, Webhooks, select the endpoint, and filter deliveries by failed status. Note event ids.
2. API listing for a time window (Python shown):
   ```python
   for ev in stripe.Event.list(created={"gte": start_ts, "lt": end_ts}, types=["payment_intent.succeeded","charge.refunded"], limit=100).auto_paging_iter():
       ids.append(ev.id)
   ```
   Node: `for await (const ev of stripe.events.list({ created: { gte, lt }, types: [...] , limit: 100 }))`. Go: `event.List(&stripe.EventListParams{...})` with the iterator's `Next()`.
3. Compare with the store: `SELECT event_id FROM webhook_events WHERE provider='stripe' AND status='processed' AND received_at >= <start>`. Missing = API ids minus processed ids.
4. Add `delivery_success=false` filter if your SDK and API version document it on Event list; otherwise use the set difference only.

### Output
List of missing event ids.

### Quality Gate
- The count of API ids, processed ids and missing ids are recorded, and missing = API minus processed (check by recounting).

---

## Phase 3: Replay Safely

### Entry Criteria
- Missing list exists; handler dedups by event id.

### Actions
1. Small number of events: `stripe events resend evt_... --webhook-endpoint we_...` for each. Run `stripe events resend --help` to confirm the endpoint flag name on your CLI version.
2. Larger backfill: a script that, for each missing id, retrieves the event (`stripe.Event.retrieve(id)`) and calls the same internal processing function the webhook worker uses, passing the event. It must go through the same dedup insert. Do not call the HTTP endpoint without a signature and do not add a "skip verification" flag to the public route.
3. Run the backfill first against test mode with a staged missing event: stop the app, `stripe trigger payment_intent.succeeded`, restart, run detection and replay.
4. After replay, rerun Phase 2. Expected missing count: zero.

### Output
`replay_runbook`.

### Quality Gate
- After the test replay, the Phase 2 difference is empty and the fulfillment count for the staged order is `1`.
- `rg -n "skip_verif|SKIP_SIGNATURE|verify=False" <src>` returns no matches.

---

## Worked Example

Illustrative.

- Phase 2: window 10:00 to 11:00, API ids 14, processed 13, missing `evt_3QmZ...`.
- Phase 3:
```
$ stripe events resend evt_3QmZ...
# listen: <-- [200] POST http://localhost:4242/webhook [evt_3QmZ...]
psql> SELECT status FROM webhook_events WHERE event_id='evt_3QmZ...';
 processed
```
Rerun detection: missing 0.

---

## Exit Criteria

DONE when retry facts are cited, missed events can be found by query, and a staged missed event is replayed once through the dedup path.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Provider doc does not state a number | **Return**: record as an open question; do not guess. |
| Phase 2 | Gap older than the API retention window | **Return**: reconcile from object lists (PaymentIntents, Refunds) instead of events. |
| Phase 3 | Replay causes a second fulfillment | **Stop**: the backfill bypassed dedup; route it through the same insert. |
| Phase 3 | Endpoint disabled by provider | **Adjust**: fix the cause, re-enable in the Dashboard, then replay. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
