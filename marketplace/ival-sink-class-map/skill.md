# Dangerous Sink Map by Vulnerability Class

**One-line description:** Searches a Python, Node.js or Go codebase for every dangerous sink (SQL string building, HTML output, shell execution, filesystem paths, outbound URL fetch, XML parsing, deserialization, regex on user data, response headers and redirects, file upload storage), links each sink to the entry points in the inventory that can reach it, and emits the list of vulnerability classes that later flows must fix.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `entry_point_inventory` (object[], required): Output of `ival-entry-point-inventory`.

---

## Outputs

- `sink_map` (object): `classes` (list of class names with one or more reachable sinks, drawn from `sql`, `xss`, `command`, `path`, `ssrf`, `xxe`, `deserialization`, `upload`, `redos`, `header`), and `sinks` (rows of `class`, `file`, `line`, `code`, `reached_from` (entry point IDs or `unknown`), `status` (`vulnerable`, `safe_pattern`, `needs_review`)).

---

## Phase 1: Run the Sink Searches

### Entry Criteria
- `entry_point_inventory` is non-empty.
- `rg --version` prints a version.

### Actions
1. Run every command for your `stack` from `repo_path`, appending `--glob "!**/node_modules/**" --glob "!**/vendor/**" --glob "!**/.venv/**"`. The comment after each command is the class. Save each command's output; do NOT filter the output by path before classifying it.

```
# python
rg -n "execute\(\s*f[\"']|execute\(.*%\s*\(|execute\(.*\.format\(|execute\(.*\+|text\(\s*f[\"']|raw\(\s*f[\"']|\.extra\(" --type py   # sql
rg -n "\|\s*safe|mark_safe|Markup\(|autoescape\s+off|autoescape=False|render_template_string" -g "*.py" -g "*.html" -g "*.jinja*"     # xss
rg -n "os\.system|os\.popen|shell\s*=\s*True|commands\.getoutput" --type py                                                     # command
rg -n "open\(.*request|send_file\(|send_from_directory\(|os\.path\.join\(.*request|Path\(.*request" --type py                   # path
rg -n "requests\.(get|post|put|request)\(|httpx\.|urlopen\(|aiohttp\.ClientSession" --type py                                  # ssrf
rg -n "lxml|xml\.etree|xml\.dom|xml\.sax|xmltodict" --type py                                                                   # xxe
rg -n "pickle\.loads?|cPickle|yaml\.load\(|yaml\.unsafe_load|jsonpickle|marshal\.loads|shelve\.open|torch\.load" --type py     # deserialization
rg -n "request\.files|FILES\[|UploadFile|\.save\(" --type py                                                                    # upload
rg -n "re\.(compile|match|search|fullmatch|sub|split|findall)\(" --type py                                                      # redos
rg -n "headers\[.*\]\s*=|set_cookie\(|redirect\(|Location" --type py                                                            # header

# node
rg -n "query\(\s*\`|query\(.*\+|\\\$queryRawUnsafe|\\\$executeRawUnsafe|whereRaw\(\s*\`|sequelize\.query\(\s*\`" --type js --type ts   # sql
rg -n "dangerouslySetInnerHTML|innerHTML\s*=|outerHTML|insertAdjacentHTML|document\.write|v-html|bypassSecurityTrust" -g "*.{js,jsx,ts,tsx,vue}"   # xss
rg -n "child_process|execSync\(|exec\(|shell:\s*true" --type js --type ts                                                     # command
rg -n "(readFile|createReadStream|sendFile|download)\(.*req\.|path\.join\(.*req\." --type js --type ts                          # path
rg -n "fetch\(|axios|got\(|http\.request\(|https\.get\(|undici" --type js --type ts                                            # ssrf
rg -n "libxmljs|xml2js|fast-xml-parser|DOMParser|xmldom|sax" --type js --type ts                                               # xxe
rg -n "node-serialize|unserialize\(|serialize-javascript|eval\(|new Function\(|vm\.run" --type js --type ts                     # deserialization
rg -n "multer|busboy|formidable|req\.files?" --type js --type ts                                                               # upload
rg -n "new RegExp\(|\.match\(|\.test\(|\.replace\(/|\.split\(/" --type js --type ts                                            # redos
rg -n "setHeader\(|res\.set\(|res\.header\(|redirect\(|res\.cookie\(" --type js --type ts                                      # header

# go
rg -n "(Query|QueryRow|Exec)(Context)?\(.*(Sprintf|\+)|fmt\.Sprintf\(\"(SELECT|INSERT|UPDATE|DELETE)" --type go               # sql
rg -n "\"text/template\"|template\.HTML\(|template\.JS\(|template\.URL\(|template\.HTMLAttr\(" --type go                         # xss
rg -n "exec\.Command(Context)?\(" --type go                                                                                     # command
rg -n "(os\.Open|os\.ReadFile|os\.Create|http\.ServeFile|filepath\.Join)\(" --type go                                          # path
rg -n "http\.(Get|Post|Head|NewRequest)|\.Do\(req" --type go                                                                   # ssrf
rg -n "encoding/xml|xml\.Unmarshal|xml\.NewDecoder" --type go                                                                  # xxe
rg -n "encoding/gob|gob\.NewDecoder|yaml\.Unmarshal" --type go                                                                 # deserialization
rg -n "FormFile\(|MultipartForm|ParseMultipartForm|MultipartReader" --type go                                                  # upload
rg -n "dlclark/regexp2" --type go                                                                                               # redos (stdlib regexp is linear time; only backtracking libraries count)
rg -n "Header\(\)\.(Set|Add)\(|http\.Redirect\(|SetCookie\(" --type go                                                          # header
```

2. Record the hit count for every class, including zero.

### Output
Raw hit lists per class.

### Quality Gate
- 10 counts recorded for the stack (one per class).
- Raw output saved before any classification.

---

## Phase 2: Classify Each Hit

### Entry Criteria
- Raw hit lists exist.

### Actions
1. Open each hit and apply this table. Use the first matching rule:

| Observation | `status` |
|---|---|
| Value from a request, queue message, upload or shared file reaches the sink without a fixed allowlist or the safe API named in the class flow | `vulnerable` |
| Sink uses the safe API (bound parameter, argument list without shell, autoescaped template, `safe_load`, `defusedxml`) | `safe_pattern` |
| Only constants or operator-controlled values reach the sink | `safe_pattern`; write the constant's origin in `code` |
| You cannot trace the value within the handler and the functions it calls directly | `needs_review` |

2. Do NOT mark a hit `safe_pattern` because it "looks internal". If the value's origin is not traced, it is `needs_review`.
3. For every `vulnerable` and `needs_review` row, write `reached_from` as the entry point IDs from `entry_point_inventory` whose fields flow into it.

### Output
Classified `sinks` rows.

### Quality Gate
- Every raw hit has exactly one `status`.
- Every `vulnerable` row has at least one entry point ID in `reached_from`, or the literal `unknown` with the reason.

---

## Phase 3: Emit the Class List

### Entry Criteria
- All hits classified.

### Actions
1. Put a class into `classes` if it has one or more `vulnerable` or `needs_review` row.
2. Add `upload` to `classes` if any inventory row has kind `upload`, even with zero sink hits, because upload checks are needed at the entry point.
3. Add `header` if any route issues a redirect whose target comes from a request field.
4. Emit `sink_map`.

### Output
`sink_map`.

### Quality Gate
- `classes` contains only names from the fixed list in Outputs.
- Every class in `classes` has a row count above zero, or a stated reason from step 2 or 3.

---

## Worked Example

Illustrative. Input: `stack` = `node`, inventory from an Express app with EP-001 to EP-009.

Phase 1 counts: sql 3, xss 1, command 1, path 2, ssrf 4, xxe 0, deserialization 0, upload 1, redos 6, header 2.

Phase 2 excerpt:
```
sql  src/repo/orders.js:52  db.query(`SELECT * FROM orders WHERE status = '${req.query.status}'`)  reached_from=[EP-003]  vulnerable
sql  src/repo/users.js:17   db.query('SELECT * FROM users WHERE id = $1', [id])                     safe_pattern
ssrf src/hooks.js:30        await fetch(body.callback_url)                                          reached_from=[EP-007]  vulnerable
```
Phase 3: `classes` = `["sql", "ssrf", "path", "upload", "redos", "header"]`.

---

## Exit Criteria

DONE when every search row for the stack has a recorded count, every hit is classified, and `sink_map.classes` lists every class with a vulnerable or unreviewed sink.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Search returns thousands of hits (for example `fetch(` in a frontend bundle) | **Adjust**: exclude build output directories (`dist`, `build`, `.next`) by glob and record the globs; never exclude source directories. |
| Phase 2 | Value passes through many layers | **Adjust**: mark `needs_review` and carry it forward; do not guess `safe_pattern`. |
| Phase 2 | Sink in test code only | **Adjust**: mark `safe_pattern` with note "test only"; confirm the file path is under a test directory. |
| Phase 3 | Every class empty | **Return**: report zero sinks with the 10 counts as evidence, so the result can be checked. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
