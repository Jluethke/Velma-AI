# Node.js pino JSON Logging With Correlation IDs

**One-line description:** Configures pino and pino-http in an Express or Fastify service so every log line is JSON with a `request_id` taken from `X-Request-ID` (or generated), echoes the ID in the response, carries it into non-request code with `AsyncLocalStorage`, and gets `trace_id`/`span_id` from the OpenTelemetry pino instrumentation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Absolute path to the Node.js service repository.
- `service_name` (string, required): Value for the `service` field.
- `log_level_policy` (object, required): Output of `obs-log-level-policy`.

---

## Outputs

- `logging_change` (object): Files changed, the diff, the verification command, and one captured JSON log line that contains `request_id` and `trace_id`.

---

## Phase 1: Install And Create The Base Logger

### Entry Criteria
- `package.json` exists; the test command (`npm test` or the `test` script) passes before changes. Save its summary line.

### Actions
1. Detect the package manager from the lockfile and install. Run one row only:

| Lockfile | Command |
|---|---|
| `package-lock.json` | `npm install pino pino-http` |
| `pnpm-lock.yaml` | `pnpm add pino pino-http` |
| `yarn.lock` | `yarn add pino pino-http` |

Fastify already bundles pino; skip `pino-http` there.
2. Create ONE file `src/logger.js` (or `.ts`):
```js
const pino = require('pino');
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { service: process.env.OTEL_SERVICE_NAME || 'checkout-api' },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: { level: (label) => ({ level: label }) },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]',
            '*.password', '*.token', '*.api_key', '*.access_token', '*.refresh_token'],
    censor: '[REDACTED]'
  }
});
module.exports = { logger };
```
3. Add any extra keys from `log_level_policy.redact_keys` as `*.<key>` paths. pino `redact` paths use the fast-redact syntax; a wrong path is silently not redacted, so the gate below tests one.
4. Do not use `pino-pretty` in production. It is a development transport only. `formatters.level` cannot be combined with `transport.targets` per the pino docs; if the repo uses `transport.targets`, remove `formatters.level` and keep numeric levels.

### Output
`src/logger.js`.

### Quality Gate
- `node -e "require('./src/logger').logger.info({token:'abc'},'probe')"` prints one JSON line where `token` is `[REDACTED]` and `level` is `"info"`.

---

## Phase 2: Attach request_id Per Request

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Edit only the file that creates the app. Pick the framework row:

| Framework | Change |
|---|---|
| Express | block A |
| Fastify | block B |

Block A (Express):
```js
const { randomUUID } = require('node:crypto');
const { AsyncLocalStorage } = require('node:async_hooks');
const pinoHttp = require('pino-http');
const { logger } = require('./logger');
const als = new AsyncLocalStorage();

app.use(pinoHttp({
  logger,
  genReqId: (req, res) => {
    const id = req.headers['x-request-id'] || randomUUID();
    res.setHeader('X-Request-Id', id);
    return id;
  },
  customAttributeKeys: { reqId: 'request_id' }
}));
app.use((req, res, next) => als.run(req.log, next));
const log = () => als.getStore() || logger;   // use log().info(...) in services
module.exports.log = log;
```
Block B (Fastify):
```js
const fastify = require('fastify')({
  logger: { level: process.env.LOG_LEVEL || 'info' },
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'request_id',
  genReqId: () => require('node:crypto').randomUUID()
});
fastify.addHook('onSend', async (req, reply) => { reply.header('X-Request-Id', req.id); });
```
2. Inside route handlers, log with `req.log` (Express) or `request.log` (Fastify). In code called from handlers that has no `req`, use `log()` from block A. Do not use the root `logger` there; it has no `request_id`.
3. Check the option names against the installed versions: `npm view pino-http@$(node -p "require('pino-http/package.json').version") readme | rg -n "customAttributeKeys|genReqId"`. If an option is missing, stop and read that version's README; do not guess another name.

### Output
Request logging middleware.

### Quality Gate
- `curl -s -D - -o /dev/null -H "X-Request-ID: verify-123" localhost:3000/orders | rg -i "x-request-id: verify-123"` prints a match.
- The test suite passes with the same count as before.

---

## Phase 3: Trace Correlation And Verification

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. If `obs-node-otel-sdk-setup` is applied, `@opentelemetry/auto-instrumentations-node` includes `@opentelemetry/instrumentation-pino`, which adds `trace_id`, `span_id` and `trace_flags` to log records written inside an active span. Confirm it is installed: `npm ls @opentelemetry/instrumentation-pino`.
2. The instrumentation patches `pino` only if the OTel SDK starts before `pino` is first required. If `trace_id` is missing, check the start command loads the instrumentation file first (`node --require ./instrumentation.js src/server.js`).
3. Convert `console.log` calls one file at a time to `req.log` or `log()`, running tests after each file: `rg -n "console\.(log|error|warn)\(" src`.
4. Run the service, send `curl -H "X-Request-ID: verify-123" localhost:3000/orders`, and parse the access line:
   `<service stdout> | rg '"request_id":"verify-123"' | head -1 | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d)))"`

### Output
`logging_change`.

### Quality Gate
- The parsed access line contains `request_id: 'verify-123'`, `level: 'info'`, an ISO `time`, and `service`.
- With the SDK running, `trace_id` matches `/^[0-9a-f]{32}$/`.
- `rg -c "console\.log" src` count is lower than before or zero; the number is reported.

---

## Worked Example

Illustrative only.

Input: Express service on port 3000, OTel SDK loaded with `--require ./instrumentation.js`.

```
$ curl -s -D - -o /dev/null -H "X-Request-ID: verify-123" localhost:3000/orders | rg -i x-request-id
X-Request-Id: verify-123
$ node --require ./instrumentation.js src/server.js | rg '"request_id":"verify-123"' | head -1
{"level":"info","time":"2026-10-20T14:05:09.120Z","service":"checkout-api","request_id":"verify-123",
 "trace_id":"4bf92f3577b34da6a3ce929d0e0e4736","span_id":"00f067aa0ba902b7","trace_flags":"01",
 "req":{"method":"GET","url":"/orders","headers":{"authorization":"[REDACTED]"}},
 "res":{"statusCode":200},"responseTime":12,"msg":"request completed"}
```

---

## Exit Criteria

DONE when the access line for a real request parses as JSON with the echoed `request_id`, redaction is proven by the Phase 1 gate, and OTel IDs appear when the SDK runs.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Error "option.transport.targets do not allow custom level formatters" | **Adjust**: remove `formatters.level` as Phase 1 step 4 says. |
| Phase 2 | `request_id` key appears as `reqId` | **Adjust**: the installed pino-http lacks `customAttributeKeys`; read its README and use the documented option. |
| Phase 3 | No `trace_id` on lines | **Adjust**: instrumentation loads after `pino`; move `--require` first and restart. |
| Phase 3 | Tests fail after a call-site change | **Retry**: revert that file, redo the change, rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
