# Untrusted Input Entry Point Inventory

**One-line description:** Builds a complete, file-and-line-cited table of every place untrusted data enters a codebase (HTTP routes, headers, cookies, uploads, webhooks, queue consumers, CLI arguments, environment, files read from shared locations) for Python, Node.js or Go, so every later validation flow works from the same list instead of from memory.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `stack` (string, required): One of `python`, `node`, `go`. A repository with more than one stack runs this flow once per stack.

---

## Outputs

- `entry_point_inventory` (object[]): One row per entry point with `id` (EP-001, EP-002, ...), `kind` (http_route, http_header, cookie, upload, webhook, queue_consumer, cli_arg, env_var, file_read, grpc, websocket), `file`, `line`, `method_and_path` (for HTTP), `parameters` (every named field the handler reads), `auth_required` (true, false, or unknown), and `trust_note` (who can send it).

---

## Phase 1: Enumerate HTTP Routes From the Framework Itself

### Entry Criteria
- `repo_path` exists and contains source for `stack`.
- `rg` (ripgrep) is installed: `rg --version` prints a version.

### Actions
1. Identify the web framework from the dependency file. Run only the line for your `stack` (commands are in code blocks so the `|` characters are copied exactly):

```
# python
rg -in "^(flask|django|fastapi|starlette|aiohttp|tornado|falcon)" requirements*.txt pyproject.toml poetry.lock
# node
rg -n "\"(express|fastify|koa|@nestjs/core|@hapi/hapi|next)\"" package.json
# go (no hit means plain net/http)
rg -n "(gin-gonic/gin|labstack/echo|go-chi/chi|gorilla/mux|gofiber/fiber)" go.mod
```

2. Prefer a route list the framework prints over a text search, because a text search misses routes registered in loops or by decorators in other files:

| Framework | Route listing command |
|---|---|
| Flask | `flask --app <module> routes` |
| Django | `python manage.py show_urls` (needs the `django-extensions` package; if it is not installed, read `urls.py` files with `rg -n "path\(|re_path\(" --glob "**/urls.py"`) |
| FastAPI / Starlette | start the app and fetch `/openapi.json`, or run `python -c "from <module> import app; [print(r.methods, r.path) for r in app.routes if hasattr(r,'methods')]"` |
| Express | no built-in listing; use the text search in step 3 |
| NestJS | `rg -n "@(Get|Post|Put|Patch|Delete|All)\(" --type ts` |
| Go any router | text search in step 3 |

3. Run the text search for your stack and keep the raw output:

```
# python
rg -n "@(app|bp|router|blueprint)\.(route|get|post|put|patch|delete)\(|@api_view|class .*\(.*View\)" --type py
# node
rg -n "\.(get|post|put|patch|delete|all|use)\(\s*['\"/]" --type js --type ts
# go
rg -n "HandleFunc\(|Handle\(|\.(GET|POST|PUT|PATCH|DELETE|Any)\(|r\.(Get|Post|Put|Patch|Delete)\(" --type go
```

4. For every route, record method, path, file, line, and whether an authentication decorator or middleware applies. If you cannot tell, write `unknown`; do NOT guess `true`.

### Output
Draft rows of kind `http_route`.

### Quality Gate
- The count of `http_route` rows is equal to or greater than the count of route lines printed by the step 2 or step 3 command.
- Every row has a `file` and `line` that open to the route definition.

---

## Phase 2: Enumerate the Fields Each Handler Reads

### Entry Criteria
- Draft `http_route` rows exist.

### Actions
1. Open each handler and list every request accessor it calls. Search patterns:

| `stack` | Accessors to search |
|---|---|
| python (Flask) | `request.args`, `request.form`, `request.json`, `request.get_json`, `request.files`, `request.headers`, `request.cookies`, `request.data`, `request.values` |
| python (Django) | `request.GET`, `request.POST`, `request.body`, `request.FILES`, `request.META`, `request.COOKIES`, `request.headers` |
| python (FastAPI) | function parameters typed with `Query`, `Path`, `Body`, `Header`, `Cookie`, `File`, `Form`, `Request` |
| node | `req.query`, `req.params`, `req.body`, `req.headers`, `req.get(`, `req.cookies`, `req.file`, `req.files`, `request.body` (Fastify) |
| go | `r.URL.Query()`, `r.FormValue`, `r.PostFormValue`, `r.Body`, `r.Header.Get`, `r.Cookie`, `r.MultipartForm`, `chi.URLParam`, `c.Param`, `c.Query`, `c.Bind`, `c.ShouldBind` |

2. Command to list them all at once, for example Node: `rg -n "req\.(query|params|body|headers|cookies|files?|get\()" --type js --type ts`.
3. Add each distinct field name to the route's `parameters`. Add separate rows of kind `http_header`, `cookie` or `upload` when a header, cookie or file is read, because those need their own checks.

### Output
Every route row carries its `parameters`; header, cookie and upload rows exist.

### Quality Gate
- Every accessor line printed by the step 2 command maps to a row (count printed lines, count mapped; numbers match).
- No route row has an empty `parameters` list unless the handler reads nothing (state "reads nothing" in `trust_note`).

---

## Phase 3: Enumerate Non-HTTP Entry Points

### Entry Criteria
- Phase 2 complete.

### Actions
1. Run every search for your stack. Every hit becomes a row with the kind named in the comment:

```
# python
rg -n "argparse|click\.|typer\.|sys\.argv" --type py                              # cli_arg
rg -n "os\.environ|os\.getenv" --type py                                          # env_var
rg -n "basic_consume|@app\.task|@shared_task|KafkaConsumer|receive_messages" --type py   # queue_consumer
rg -n "open\(|read_text\(|read_bytes\(" --type py                                 # file_read
rg -n "websocket|WebSocket" --type py                                             # websocket
rg -n "add_.*Servicer_to_server" --type py                                        # grpc

# node
rg -n "process\.argv|yargs|commander" --type js --type ts                         # cli_arg
rg -n "process\.env\." --type js --type ts                                        # env_var
rg -n "\.consume\(|\.subscribe\(|on\(['\"]message['\"]" --type js --type ts       # queue_consumer
rg -n "readFile|createReadStream" --type js --type ts                             # file_read
rg -n "ws\.on\(|socket\.on\(" --type js --type ts                                 # websocket
rg -n "addService\(" --type js --type ts                                          # grpc

# go
rg -n "flag\.|os\.Args|cobra\." --type go                                         # cli_arg
rg -n "os\.Getenv|os\.LookupEnv" --type go                                        # env_var
rg -n "Consume\(|Subscribe\(|FetchMessage\(|ReadMessage\(" --type go              # queue_consumer
rg -n "os\.Open|os\.ReadFile" --type go                                           # file_read
rg -n "websocket\." --type go                                                     # websocket
rg -n "Register\w+Server\(" --type go                                             # grpc
```

2. For `file_read` rows, keep only files whose path or content can be influenced by a user or another system (upload directories, shared mounts, downloaded files). Drop reads of files shipped inside the repository and state why in `trust_note`.
3. For `env_var` rows, set `trust_note` to "operator-controlled" unless the value is set from a request or a tenant config.
4. Assign IDs EP-001 upward in file order and emit `entry_point_inventory`.

### Output
`entry_point_inventory`.

### Quality Gate
- Every search in step 1 was run; its hit count is recorded next to the kind (zero is a valid count).
- Every row has `id`, `kind`, `file`, `line`, `parameters`, `auth_required`, `trust_note`.

---

## Worked Example

Illustrative. Input: `repo_path` = `/src/shop`, `stack` = `python` (Flask).

Phase 1:
```
$ flask --app shop.app routes
Endpoint        Methods  Rule
orders.create   POST     /orders
orders.export   GET      /orders/export
static          GET      /static/<path:filename>
```
Phase 2: `rg -n "request\.(args|form|json|get_json|files|headers|cookies)" --type py` prints 6 lines. `/orders/export` reads `request.args["format"]` and `request.args["path"]`.

Phase 3: `rg -n "os\.environ"` finds `DATABASE_URL`; `rg -n "basic_consume"` finds a RabbitMQ consumer in `shop/worker.py:41`.

Result rows (excerpt):
```
EP-002 http_route GET /orders/export shop/orders.py:88 params=[format,path] auth=true trust=any logged-in customer
EP-005 queue_consumer shop/worker.py:41 params=[order_id,callback_url] auth=unknown trust=any service with queue publish rights
```

---

## Exit Criteria

DONE when `entry_point_inventory` lists every route, header, cookie, upload, CLI argument, environment variable, queue consumer, shared file read, websocket and gRPC service, each with file, line, fields read, and trust note, and every search command's hit count is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Framework route listing command fails (app will not import) | **Adjust**: use the text search in Phase 1 step 3 and mark the inventory "text-search only" in every row's `trust_note`. |
| Phase 1 | `rg` not installed | **Stop**: install ripgrep; `grep -rn` misses the type filters used here. |
| Phase 2 | Handler reads the whole body into a generic dict and passes it on | **Adjust**: follow the dict to the function that reads keys and list those keys as `parameters`. |
| Phase 3 | Thousands of `open(` hits | **Adjust**: restrict to directories outside tests and vendored code with `--glob "!tests/**" --glob "!vendor/**"`, and record the globs used. |
| Any | Tempted to write "all routes validated" without the table | **Stop**: the table is the output; a summary is not. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
