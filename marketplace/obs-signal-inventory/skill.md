# Observability Signal Inventory

**One-line description:** Reads a service repository and produces a signal plan that lists every entrypoint, every resource, the existing telemetry libraries, and whether each component is measured with RED (request-driven) or USE (resource) signals.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Absolute path to the service repository root.
- `stack` (string, required): One of `python`, `node`, `go`, `java`. Drives the stack-specific flows downstream.
- `service_name` (string, required): The name the service will report as `service.name` and as the Prometheus `job` label, lowercase with hyphens (for example `checkout-api`).

---

## Outputs

- `signal_plan` (object): `service_repo`, `stack`, `service_name`, `runtime_version`, `entrypoints[]` (kind, framework, file:line, route list), `resources[]` (kind, name, file:line), `existing_telemetry[]` (library, version, file), `components[]` with `method` set to `RED`, `USE` or `RED+USE`, and `open_questions[]`.

---

## Phase 1: Confirm The Stack From Files

### Entry Criteria
- `service_repo` exists and is readable.
- `stack` is one of the four allowed values.

### Actions
1. List the build manifests at the repo root:
   `ls "$SERVICE_REPO"/{pyproject.toml,requirements*.txt,setup.cfg,package.json,go.mod,pom.xml,build.gradle,build.gradle.kts} 2>/dev/null`
2. Map files to a stack with this table. Do not guess beyond it.

| File present | Stack |
|---|---|
| `pyproject.toml`, `requirements*.txt`, `setup.cfg` | `python` |
| `package.json` | `node` |
| `go.mod` | `go` |
| `pom.xml`, `build.gradle`, `build.gradle.kts` | `java` |

3. If the detected stack differs from `stack`, stop and report both values. If two stacks are present (for example a Python API with a `package.json` for frontend assets), record the one that owns the server entrypoint found in Phase 2 and list the other under `open_questions`.
4. Record the language runtime version from the manifest (`requires-python`, `engines.node`, the `go` directive in `go.mod`, `maven.compiler.release` or the Gradle toolchain). Several downstream flows depend on it (for example Go `log/slog` needs Go 1.21 or later).

### Output
Confirmed `stack` and runtime version.

### Quality Gate
- The `ls` command output is pasted and contains at least one manifest that maps to `stack`.
- The runtime version line is quoted from the manifest, or recorded in `open_questions` as missing.

---

## Phase 2: Find Entrypoints And Resources

### Entry Criteria
- Stack confirmed.

### Actions
1. Search for server and consumer entrypoints with ripgrep. Run only the command for your stack.
   - python: `rg -n "FastAPI\(|Flask\(|Django|APIRouter\(|@app\.(get|post|route)|grpc\.server\(|Celery\(|@shared_task|KafkaConsumer\(" "$SERVICE_REPO" -g '*.py'`
   - node: `rg -n "express\(\)|fastify\(|new Koa\(|createServer\(|@nestjs/|new Worker\(|consumer\.run\(" "$SERVICE_REPO" -g '*.{js,ts,mjs,cjs}' -g '!node_modules'`
   - go: `rg -n "http\.ListenAndServe|http\.Server\{|gin\.(New|Default)\(|echo\.New\(|chi\.NewRouter\(|grpc\.NewServer\(|sarama\.|kafka\.NewReader" "$SERVICE_REPO" -g '*.go'`
   - java: `rg -n "@RestController|@Controller|@KafkaListener|@RabbitListener|@Scheduled|ServerBuilder\.forPort" "$SERVICE_REPO" -g '*.{java,kt}'`

2. For each HTTP framework hit, list its route templates (for example `/orders/{id}`), not example URLs. Route templates become the `http.route` label later; raw paths would explode cardinality.
3. Search for resources that saturate: database pools, HTTP client pools, thread or worker pools, queues, caches.
   `rg -n -i "pool_size|max_connections|maxPoolSize|SetMaxOpenConns|ThreadPoolExecutor|newFixedThreadPool|max_workers|concurrency|queue" "$SERVICE_REPO" -g '!node_modules' -g '!vendor'`
4. Search for existing telemetry libraries:
   `rg -n -i "prometheus_client|prom-client|client_golang|micrometer|opentelemetry|structlog|python-json-logger|pino|winston|bunyan|zap|zerolog|logrus|log/slog|logback|log4j" "$SERVICE_REPO" -g '!node_modules' -g '!vendor' -l`
5. Record every hit with file and line. Do not open and edit any file in this flow; it is read-only.

### Output
Raw lists of entrypoints, resources and existing telemetry with file:line references.

### Quality Gate
- Every entrypoint row cites a file:line that the ripgrep output printed.
- If ripgrep returned zero entrypoints, the result is recorded as an open question, not filled with a guess.

---

## Phase 3: Classify Components And Emit The Plan

### Entry Criteria
- Raw lists exist.

### Actions
1. Classify each component with this table:

| Component kind | Method | Signals |
|---|---|---|
| HTTP or gRPC server handler | RED | request rate, error rate, duration histogram |
| Queue or stream consumer | RED+USE | messages processed rate, failed messages rate, processing duration; queue depth or consumer lag as saturation |
| Scheduled or batch job | RED | runs, failed runs, run duration, last success timestamp gauge |
| Connection pool, thread pool, worker pool | USE | in-use / max (utilization), waiters or wait time (saturation), acquire errors (errors) |
| Host or container | USE | CPU, memory, disk, network via node_exporter or cAdvisor |

2. For each existing telemetry library, decide keep or replace with this rule: keep it if a downstream flow in this domain configures that same library (structlog, pino, slog, logback, OpenTelemetry, prometheus_client, prom-client, client_golang, Micrometer); otherwise list it under `open_questions` with the text "migrate or bridge".
3. Write `signal_plan` as JSON with the keys listed in Outputs.
4. Validate it parses: `python -m json.tool signal_plan.json > /dev/null && echo PARSE_OK`.

### Output
`signal_plan`.

### Quality Gate
- `python -m json.tool` prints `PARSE_OK`.
- Every component has `method` set to `RED`, `USE` or `RED+USE`.
- Every HTTP entrypoint lists route templates, with no literal IDs in any path.

---

## Worked Example

Illustrative only.

Input: `service_repo=/src/checkout-api`, `stack=python`, `service_name=checkout-api`.

Phase 1:
```
$ ls /src/checkout-api/{pyproject.toml,package.json,go.mod} 2>/dev/null
/src/checkout-api/pyproject.toml
$ rg -n "requires-python" /src/checkout-api/pyproject.toml
7:requires-python = ">=3.11"
```

Phase 2:
```
$ rg -n "FastAPI\(|APIRouter\(|Celery\(" /src/checkout-api -g '*.py'
app/main.py:12:app = FastAPI(title="checkout")
app/routes/orders.py:5:router = APIRouter(prefix="/orders")
app/worker.py:4:celery = Celery("checkout", broker=BROKER_URL)
$ rg -n -i "pool_size" /src/checkout-api
app/db.py:9:engine = create_async_engine(DB_URL, pool_size=10, max_overflow=5)
```

Phase 3 `signal_plan` excerpt:
```json
{"stack":"python","service_name":"checkout-api",
 "components":[
  {"name":"http","kind":"http_server","method":"RED","routes":["/orders","/orders/{order_id}"],"ref":"app/main.py:12"},
  {"name":"celery","kind":"queue_consumer","method":"RED+USE","ref":"app/worker.py:4"},
  {"name":"db_pool","kind":"connection_pool","method":"USE","ref":"app/db.py:9"}],
 "open_questions":["python-json-logger found in app/log.py: migrate or bridge"]}
```

---

## Exit Criteria

DONE when `signal_plan` parses, the stack is confirmed from a manifest file, and every entrypoint and resource is classified with a file:line citation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Manifest stack differs from `stack` input | **Stop**: report both values and ask which is correct. |
| Phase 1 | No manifest at repo root | **Adjust**: search one level deeper with `rg --files -g 'pyproject.toml' -g 'package.json' -g 'go.mod' -g 'pom.xml'`; if still none, stop. |
| Phase 2 | `rg` not installed | **Adjust**: use `grep -rnE` with the same pattern and the same exclusions. |
| Phase 2 | Zero entrypoints found | **Return**: record an open question; do not invent routes. |
| Phase 3 | JSON does not parse | **Retry**: fix the syntax error that `json.tool` reports, then rerun it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
