# Client State Reconciliation: Snapshot, Deltas and Pending Mutations

**One-line description:** Implements the client reducer that keeps local state equal to server state across reconnects: subscribe-then-snapshot with buffered deltas, sequence-checked delta apply with gap resync, and pending local mutations keyed by client mutation id that are confirmed, rolled back or rebased, proven with a randomized delivery-order test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Client repository (TypeScript).
- `delivery_contract` (object, required): From `rtw-delivery-contract`; gives `snapshot_endpoint`, `gap_rule` and dedupe rules.
- `reconnect_client` (object, required): From `rtw-client-reconnect-backoff`; supplies connection events and `lastSeq` storage.

---

## Outputs

- `reconciliation_impl` (object): `{ files_changed: [], store_shape, invariants: [], test_command, test_summary }`.

---

## Phase 1: Write the Invariants and Store Shape

### Entry Criteria
- Inputs present.

### Actions
1. Store shape per stream: `{ confirmed: State, confirmedSeq: number, buffer: Envelope[], pending: Mutation[], status: "syncing" | "live" | "resyncing" }`. The UI renders `view = pending.reduce(applyMutation, confirmed)`.
2. Write these invariants into `invariants` and as a comment at the top of the reducer file:
   - I1: `confirmed` changes only by applying server messages with `seq = confirmedSeq + 1`, or by replacing it with a snapshot.
   - I2: a server message with `seq <= confirmedSeq` is ignored (duplicate).
   - I3: a server message with `seq > confirmedSeq + 1` goes to `buffer` and triggers the gap rule.
   - I4: each pending mutation has a `client_mutation_id` (UUID) sent to the server; the server echoes it on the resulting event or on `sys.ack`/`sys.error`.
   - I5: after all pending mutations are acked or rejected and no message is in flight, `view == server state`.
3. Do NOT mutate `confirmed` directly from a UI action. UI actions only add to `pending`.

### Output
Store shape and invariants.

### Quality Gate
- Five invariants are written in the reducer file header (paste the comment).

---

## Phase 2: Implement the Reducer

### Entry Criteria
- Invariants written.

### Actions
1. Initial sync (also after reconnect when the replay window is exceeded):
   1. Set `status = "syncing"`.
   2. Subscribe to the stream first, and push every incoming delta into `buffer`.
   3. Fetch `snapshot_endpoint`; it returns `{ seq: S, state }`.
   4. `confirmed = state`, `confirmedSeq = S`.
   5. Drop buffered deltas with `seq <= S`; apply the rest in `seq` order using I1 to I3.
   6. `status = "live"`.
   Subscribing before the snapshot is required; fetching first loses every delta published between the snapshot read and the subscribe.
2. Delta apply in `live`: follow I1 to I3. When a gap appears, set `status = "resyncing"`, ask `reconnect_client` to send `sys.resume` from `confirmedSeq`; if the server answers with snapshot-required, run the initial sync again.
3. Pending mutations:
   - On UI action: push `{ client_mutation_id, op, sentAt }` to `pending`, send the c2s message with that id.
   - On a server event that carries a `client_mutation_id` matching a pending entry: apply the event to `confirmed` (I1) and remove the pending entry.
   - On `sys.error` for that id: remove the pending entry (rollback is automatic because `view` is recomputed) and surface the error.
   - After a snapshot replaces `confirmed`, keep `pending` and recompute `view`; this rebases pending ops on the new server state. Mutations whose target no longer exists are removed with an error.
   - On reconnect, resend pending mutations whose ack never arrived, using the same `client_mutation_id`; the server must treat a repeated id as a no-op.
4. Keep `applyMutation` and `applyEvent` pure functions (no I/O) so they can be tested directly.

### Output
Reducer module.

### Quality Gate
- `npx tsc --noEmit` exits 0.
- `grep -rn "confirmed\s*=" src/realtime` shows assignments only inside the reducer.

---

## Phase 3: Prove Convergence

### Entry Criteria
- Reducer compiles.

### Actions
1. Example tests (Vitest or Jest):
   - snapshot race: deltas 9, 10, 11 arrive while the snapshot (S = 10) loads; final `confirmedSeq = 11`, delta 11 applied once.
   - duplicate after reconnect: replay sends 10 and 11 again; state unchanged.
   - gap: deliver 12 then 14; `status = "resyncing"` and 14 is buffered.
   - rejected mutation: pending rename, then `sys.error`; `view` equals `confirmed`.
   - rebase: pending increment by 1, then snapshot with value 7; `view` shows 8 until the ack arrives.
2. Randomized test with `fast-check` (`npm install --save-dev fast-check`): generate a server event log of N events, then a delivery schedule that duplicates and reorders messages and inserts a reconnect with snapshot at a random point. Property: after delivering everything and resolving all pendings, `view` deep-equals the server state computed by applying the log in order. Keep the default run count, and print the seed on failure (fast-check does this) so failures replay.
3. Run the suite and paste the summary. If the property fails, copy the shrunk counterexample into a new example test before fixing.

### Output
`reconciliation_impl`.

### Quality Gate
- Five example tests and the property test pass (summary pasted).

---

## Worked Example

Illustrative only.

Shared counter board. Server log: `inc(a)`, `inc(a)`, `set(b,3)` as seq 1 to 3.
- Client connects mid-stream: subscribes, buffers seq 3, snapshot returns `{seq: 2, state: {a: 2}}`, applies 3 to get `{a: 2, b: 3}`.
- User clicks `inc(b)`: pending `m-91`; view `{a: 2, b: 4}`.
- Connection drops before the ack; reconnect resends `m-91`; server applies once (dedupe by id) and emits seq 4 with `client_mutation_id: "m-91"`; pending cleared.
```
$ npx vitest run src/realtime/reducer
 ✓ snapshot race ✓ duplicate ✓ gap ✓ rejected ✓ rebase
 ✓ converges under reorder/duplicate/reconnect (100 runs)
 Tests  6 passed (6)
```

---

## Exit Criteria

DONE when the reducer enforces the five invariants, syncs with subscribe-then-snapshot, resyncs on gaps, handles pending mutations with confirm, rollback and rebase, and both example and randomized convergence tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Server events do not echo `client_mutation_id` | **Return** to the server team; pending mutations cannot be matched without it. |
| Phase 2 | Snapshot endpoint has no `seq` | **Stop**: the buffer cannot be trimmed; add `seq` to the endpoint. |
| Phase 3 | Property test fails | **Adjust** the reducer after turning the counterexample into an example test; never lower the run count to pass. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
