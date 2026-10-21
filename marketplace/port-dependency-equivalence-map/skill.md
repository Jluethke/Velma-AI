# Port Dependency Equivalence Map

**One-line description:** Lists every third-party and standard-library dependency the source program uses, picks a target-language equivalent for each from a fixed mapping table, and records the specific behavior differences (regex engine features, JSON number handling, date parsing, HTTP defaults) that will break parity if ignored.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_repo` (string, required): Path to the source repository at the reference commit.
- `stack` (string, required): Port pair (`py-ts`, `py-go`, `js-ts`, `java-kotlin`, `c-rust`).

---

## Outputs

- `dependency_map` (object[]): One row per dependency: `source_dep`, `version`, `used_features` (the functions actually called), `target_dep` (package and version, or "stdlib", or "hand-written"), `behavior_differences` (list), `decision_reason`.

---

## Phase 1: List What Is Actually Used

### Entry Criteria
- `source_repo` is at the reference commit.

### Actions
1. List declared dependencies:
   - Python: `pip freeze` in the project's virtualenv, plus `pipdeptree --warn silence` if installed to see which are direct.
   - JavaScript: `npm ls --depth=0 --json`.
   - Java: `mvn dependency:tree -Dscope=runtime` or `./gradlew dependencies --configuration runtimeClasspath`.
   - C: `ldd ./build/app` for shared libraries, `pkg-config --list-all` for what the build can find, and the `find_package` / `target_link_libraries` lines in `CMakeLists.txt`.
2. For each direct dependency, list the functions actually imported or called:
   - Python: `rg -n "^\s*(from|import) <pkg>"` then `rg -n "<pkg>\.\w+"`.
   - JavaScript: `rg -n "from ['\"]<pkg>|require\(['\"]<pkg>"`.
   - Java: `rg -n "^import <group>\."`.
   - C: `rg -n "#include <<lib>/"` and the called function names.
3. Also list standard-library modules with known cross-language traps: regex, JSON, date and time, decimal, hashing, CSV, URL parsing, subprocess, HTTP.

### Output
Usage list: dependency, version, used functions.

### Quality Gate
- Every direct dependency in the lockfile or build file has a row (count rows vs `npm ls --depth=0` entries, `pip freeze` direct deps, or the build file).
- Every row lists at least one used function, or is marked "declared but unused" with the grep that found zero uses.

---

## Phase 2: Pick Target Equivalents

### Entry Criteria
- Usage list exists.

### Actions
1. Look up each row in this table. Use the first column for the source library family and the column for the target language.

| Source need | TypeScript (Node) | Go | Kotlin (JVM) | Rust |
|---|---|---|---|---|
| HTTP client (requests, axios, HttpClient, libcurl) | global `fetch` (Node 18+) | `net/http` | `java.net.http.HttpClient` or OkHttp or Ktor client | `reqwest` |
| JSON (json, JSON, Jackson, cJSON) | `JSON` | `encoding/json` | kotlinx.serialization or keep Jackson | `serde_json` |
| Regex (re, RegExp, java.util.regex, PCRE) | `RegExp` | `regexp` (RE2) | `kotlin.text.Regex` (java.util.regex) | `regex` crate, or `fancy-regex` when lookaround or backreferences are required |
| CLI args (argparse, click, commander, picocli, getopt) | `commander` or `yargs` or `node:util` `parseArgs` | `flag` or `cobra` | `clikt` or keep picocli | `clap` |
| Dates (datetime, dateutil, Date, java.time, strftime) | `Date` plus `luxon` or `date-fns` (check Temporal support in your Node version before using it) | `time` | `java.time` | `chrono` or `jiff` or `time` |
| Exact decimal (decimal, BigDecimal) | `decimal.js` or `big.js` | `github.com/shopspring/decimal` or `math/big.Rat` | `java.math.BigDecimal` | `rust_decimal` or `bigdecimal` |
| Big integers (int, BigInteger, GMP) | built-in `bigint` | `math/big.Int` | `java.math.BigInteger` | `num-bigint` |
| Logging (logging, winston, SLF4J, syslog) | `pino` | `log/slog` (Go 1.21+) | SLF4J with Logback, or kotlin-logging | `tracing` or `log` |
| SQLite (sqlite3, better-sqlite3, sqlite-jdbc, libsqlite3) | `better-sqlite3` or `node:sqlite` (check your Node version) | `database/sql` with `modernc.org/sqlite` (pure Go) or `github.com/mattn/go-sqlite3` (cgo) | `org.xerial:sqlite-jdbc` | `rusqlite` |
| Tests (pytest, Jest, JUnit, CTest) | `vitest` | `testing` | JUnit 5 | `cargo test` |
| Property tests (hypothesis, fast-check, jqwik, theft) | `fast-check` | `testing/quick` or `pgregory.net/rapid` | `jqwik` or Kotest property | `proptest` |

2. For each row, write the behavior differences from this trap list that apply to the functions used:
   - Regex: Go `regexp` and Rust `regex` reject lookahead `(?=`, lookbehind `(?<=`, and backreferences `\1`; patterns using them must be rewritten or moved to `fancy-regex`. Python `\w`, `\d`, `\s` match Unicode by default for `str` patterns; JavaScript, Go and Java match ASCII only for `\w` and `\d` (Java needs `Pattern.UNICODE_CHARACTER_CLASS`), and Rust `regex` matches Unicode. Python `re.match` anchors at the start only; JavaScript has no `match` equivalent, use `^` or the sticky `y` flag.
   - JSON: JavaScript `JSON.parse` loses integer precision above 2^53 - 1. Python `json.dumps` writes `NaN` and `Infinity` (non-standard) by default, while `JSON.stringify(NaN)` writes `null` and Go `json.Marshal` returns an error. Python `json.dumps` escapes non-ASCII by default (`ensure_ascii=True`); Go escapes `<`, `>`, `&` by default (`Encoder.SetEscapeHTML(false)` turns it off). Python writes `1.0` for a float, JavaScript writes `1`. Go `json.Marshal` sorts map keys; JavaScript keeps insertion order except integer-like keys, which come first.
   - Dates: JavaScript `new Date(y, m, d)` uses 0-based months; `Date.parse` of a date-only ISO string is UTC but a date-time without offset is local time. Python naive `datetime` has no timezone. Go layout strings use the reference time `2006-01-02 15:04:05`, not `%Y`.
   - CSV: Python `csv` handles quoted newlines; splitting on `,` in the target does not.
   - HTTP: default timeouts differ (Python `requests` has none, Go `http.Client` zero value has none, `fetch` has none); redirect following defaults differ.
3. When no equivalent exists, write "hand-written" and list the exact functions to implement. Do not invent a package name; if unsure a package exists, search the registry (`npm view <name>`, `go list -m <path>@latest`, Maven Central search, `cargo search <name>`) and paste the result.

### Output
`dependency_map`.

### Quality Gate
- Every `target_dep` that names a package was confirmed with a registry command whose output is attached.
- Every regex in the source using `(?=`, `(?!`, `(?<=`, `(?<!` or `\1` through `\9` is listed when the target is Go or Rust: `rg -n "\(\?<?[=!]|\\\\[1-9]"` count matches the listed count.

---

## Worked Example

Illustrative. `stack=py-go`, source imports `requests`, `dateutil`, `re`.

Phase 1:
```
$ rg -n "^\s*(from|import) (requests|dateutil|re)\b" --type py | wc -l
14
$ rg -n "\(\?<?[=!]|\\\\[1-9]" --type py
parse/headers.py:9:  _TOKEN = re.compile(r"(?<=;)\s*(\w+)=")
```
Phase 2 rows:
```
requests 2.32.3  used: get, Session.post   -> net/http   diffs: no default timeout in either; set http.Client{Timeout: ...} from config, do not invent a value
dateutil 2.9.0   used: parser.isoparse     -> time.Parse(time.RFC3339Nano, s)  diffs: isoparse accepts "2024-01-02" without time; RFC3339 does not, add a second layout "2006-01-02"
re (stdlib)      used: compile, sub        -> regexp     diffs: headers.py:9 uses lookbehind; rewrite as a capture group: ;\s*(\w+)=
$ go list -m golang.org/x/text@latest
golang.org/x/text v0.x.y
```

---

## Exit Criteria

DONE when every used dependency has a confirmed target equivalent or a hand-written plan, and every applicable trap is recorded as a behavior difference.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No lockfile, versions unknown | **Adjust**: read installed versions from the environment (`pip show`, `npm ls`, `mvn dependency:list`); record the source of each version. |
| Phase 2 | Registry command finds no such package | **Stop**: remove the name; choose another or write "hand-written". Never keep an unverified package name. |
| Phase 2 | Target library behaves differently on a used function | **Adjust**: record the difference; the semantics audit and golden corpus decide which behavior wins. |
| Phase 2 | C dependency has no Rust equivalent | **Adjust**: keep calling the C library through `bindgen` bindings; record it for `port-c-rust-ffi-strangler`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
