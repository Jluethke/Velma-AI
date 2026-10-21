# Realtime Message Envelope Schema

**One-line description:** Defines the JSON envelope every realtime message travels in (version, type, id, stream, sequence, timestamp, payload), writes it as a JSON Schema draft 2020-12 file with one schema per message type, and proves it with ajv-cli against valid and invalid fixture files.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `feature_spec` (string, required): The realtime feature description, including every message the server sends and the client sends.
- `transport_decision` (object, required): Output of `rtw-transport-decision`. Its `transport` decides whether binary frames are allowed.

---

## Outputs

- `protocol_spec` (object): `{ schema_dir, envelope_schema_path, message_types: [ { type, direction, schema_path, idempotent: bool, droppable: bool } ], max_message_bytes, fixtures_dir, validate_command }`.

---

## Phase 1: List the Message Types

### Entry Criteria
- `feature_spec` and `transport_decision` are present.

### Actions
1. Read `feature_spec` and list every message as a row: `type | direction (s2c, c2s) | trigger | payload fields`.
2. Name each type `<domain>.<event>` in lowercase with a dot, past tense for facts and imperative for requests: `order.created`, `order.updated`, `cursor.moved`, `sub.subscribe`, `sub.unsubscribe`.
3. Always add these control types even if `feature_spec` does not mention them: `sys.hello` (s2c, sent once after connect with server protocol version), `sys.error` (s2c), `sys.ack` (s2c, acknowledges a c2s message by `id`), `sys.resume` (c2s, carries last seen sequence per stream), `sys.ping` and `sys.pong` (both directions, app-level heartbeat for browsers that cannot send WebSocket ping frames).
4. For SSE, the c2s rows become ordinary HTTP endpoints; mark them `direction = c2s-http`.
5. Mark each type `idempotent` (applying it twice gives the same state, e.g. "set status to done") and `droppable` (a later message fully replaces it, e.g. cursor position).

### Output
Message type table.

### Quality Gate
- Every message named in `feature_spec` has a row.
- The six `sys.*` control types are present.
- Every row has `idempotent` and `droppable` set to true or false.

---

## Phase 2: Write the Envelope and Type Schemas

### Entry Criteria
- Message type table exists.

### Actions
1. Create the directory `schema/realtime/` in the repo (use the existing schema folder if the repo has one; check first with `ls`).
2. Write `schema/realtime/envelope.schema.json` with `"$schema": "https://json-schema.org/draft/2020-12/schema"` and these properties:
   - `v` (integer, required): envelope version. Starts at 1.
   - `type` (string, required, pattern `^[a-z]+(\\.[a-z_]+)+$`).
   - `id` (string, required): sender-generated unique id (UUIDv4 or ULID). Used for dedupe and acks.
   - `stream` (string, optional): ordering scope, e.g. `room:42`. Required on every s2c data message.
   - `seq` (integer, optional, minimum 1): position within `stream`, assigned by the server.
   - `ts` (string, `format: date-time`): server time in RFC 3339.
   - `data` (object, required): the type-specific payload.
   - Set `"additionalProperties": true` on the envelope so older readers tolerate new top-level fields.
3. For each message type, write `schema/realtime/types/<type>.schema.json` describing only `data`. Use `"additionalProperties": true` for s2c types (tolerant reader) and `false` for c2s types (the server rejects unexpected input).
4. Decide `max_message_bytes`: if the server library has a default you will keep, record it with its source (for example Node `ws` `maxPayload` default 104857600 bytes, Python `websockets` `max_size` default 1048576 bytes, uvicorn `--ws-max-size` default 16777216 bytes). If the feature needs a different limit, record it as a user decision. Never leave it unset.
5. Binary: if `transport_decision.transport` is `websocket` and a payload is binary, define a binary frame layout in a separate `binary-frames.md` next to the schemas (first byte = frame kind, then a length-prefixed JSON header). Do not base64 large binary into JSON.

### Output
Schema files on disk.

### Quality Gate
- `envelope.schema.json` parses: `node -e "JSON.parse(require('fs').readFileSync('schema/realtime/envelope.schema.json','utf8'))"` exits 0.
- One type schema file exists per row in the Phase 1 table: `ls schema/realtime/types | wc -l` equals the row count.

---

## Phase 3: Prove the Schemas with Fixtures

### Entry Criteria
- Schema files exist.

### Actions
1. Create `schema/realtime/fixtures/valid/` with one realistic message per type, and `schema/realtime/fixtures/invalid/` with at least these cases: missing `type`, `seq` = 0, `v` as a string, a c2s message with an extra field.
2. Install the validator as a dev dependency instead of trusting a global: `npm install --save-dev ajv-cli ajv-formats`.
3. Validate: `npx ajv-cli validate --spec=draft2020 -c ajv-formats -s schema/realtime/envelope.schema.json -d "schema/realtime/fixtures/valid/*.json"`. Expect one `valid` line per file.
4. Validate invalid fixtures with the same command on `fixtures/invalid/*.json`. Every file must print `invalid`. A file that prints `valid` means the schema is too loose: tighten the schema, never delete the fixture.
5. If ajv-cli flags differ in your installed version, run `npx ajv-cli help validate` and use the flags it lists.
6. Record the exact command in `protocol_spec.validate_command` and add it to the repo test script (for example a `"test:schema"` entry in `package.json`).

### Output
`protocol_spec`.

### Quality Gate
- The valid run prints only `valid` lines and exits 0.
- The invalid run prints `invalid` for every file and exits non-zero.
- `protocol_spec.validate_command` is a command a reader can paste.

---

## Worked Example

Illustrative only.

Feature: chat room. Types: `chat.message_posted` (s2c, not droppable, idempotent by id), `chat.post` (c2s), `typing.started` (s2c, droppable), plus the six `sys.*` types.

Valid fixture `chat.message_posted.json`:
`{"v":1,"type":"chat.message_posted","id":"01J9Z8...","stream":"room:42","seq":118,"ts":"2026-10-20T14:03:11Z","data":{"author":"u7","text":"hi"}}`

Run:
```
$ npx ajv-cli validate --spec=draft2020 -c ajv-formats -s schema/realtime/envelope.schema.json -d "schema/realtime/fixtures/valid/*.json"
schema/realtime/fixtures/valid/chat.message_posted.json valid
schema/realtime/fixtures/valid/sys.hello.json valid
...
$ npx ajv-cli validate ... -d "schema/realtime/fixtures/invalid/*.json"
schema/realtime/fixtures/invalid/seq-zero.json invalid
[ { instancePath: '/seq', keyword: 'minimum', ... } ]
```

`max_message_bytes = 1048576` (Python `websockets` default `max_size`, kept).

---

## Exit Criteria

DONE when every message type has a schema file, valid fixtures pass, every invalid fixture fails, and `protocol_spec` records the size limit with its source and the validation command.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `feature_spec` does not say who sends a message | **Return** the message name to the feature owner; do not guess direction. |
| Phase 2 | Repo already has a message format in use | **Adjust**: write the schema to match the existing format and record differences as open questions; do not rename live fields. |
| Phase 3 | An invalid fixture validates | **Adjust** the schema (add `required`, `minimum`, `additionalProperties: false`); never delete or weaken the fixture. |
| Phase 3 | ajv-cli rejects a flag | **Retry** after reading `npx ajv-cli help validate`; do not invent flags. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
