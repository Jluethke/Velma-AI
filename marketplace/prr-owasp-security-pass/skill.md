# PR Security Pass with the OWASP Top 10 Checklist

**One-line description:** Maps the PR's added lines onto the ten OWASP Top 10:2021 categories with a ripgrep pattern and a manual question per category, traces each hit from untrusted input to the dangerous sink, and records only traced, evidenced issues as security findings.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `diff_file` (string, required): Saved PR diff.
- `reading_plan` (object[], required): Ordered files from `prr-diff-reading-order`.
- `findings_dir` (string, required): Findings directory.

---

## Outputs

- `security_findings` (object[]): Traced security issues with OWASP category, source, sink and fix, written to `<findings_dir>/prr-owasp-security-pass.json`.

---

## Phase 1: Extract Added Lines and Mark Trust Boundaries

### Entry Criteria
- `diff_file` exists.

### Actions
1. Extract added lines with file and line numbers into a scratch file outside the repository:
   `git diff -U0 origin/<base>...<head> | grep -nE '^(\+\+\+ |@@|\+)' > ../added.txt`
2. Mark every place untrusted data enters the changed code (sources): HTTP request params, body, headers, cookies; file uploads; message queue payloads; environment of a multi-tenant job; CLI arguments in a service; database fields written by users; third-party API responses.
3. Mark new or changed endpoints, routes, handlers, consumers and scheduled jobs. Each one is a place to check access control.

### Output
Added-lines file, source list, new entry point list.

### Quality Gate
- `../added.txt` is non-empty and lives outside the repository (`git status --porcelain` shows nothing new).
- Every new route or handler in the diff appears in the entry point list.

---

## Phase 2: Run the Category Checklist

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Run these candidate searches on the added lines. Copy each command exactly; `|` inside the quotes is regex alternation. Patterns find candidates; they do not prove an issue.
   ```
   rg -n -e '@app\.route|@router\.|app\.(get|post|put|patch|delete)\(|HandleFunc|@(Get|Post|Put|Patch|Delete|Request)Mapping|permission_classes|AllowAny' ../added.txt   # A01
   rg -n -e 'md5|sha1|\bDES\b|ECB|random\.random|Math\.random|math/rand|verify=False|InsecureSkipVerify|rejectUnauthorized:\s*false' ../added.txt   # A02
   rg -n -e 'execute\(f["'"'"']|execute\(.*%|execute\(.*\+|\.raw\(|text\(f|shell=True|os\.system|child_process|\beval\(|\bexec\(|innerHTML|dangerouslySetInnerHTML|v-html|\|\s*safe|mark_safe|Sprintf\(.*(SELECT|INSERT|UPDATE|DELETE)' ../added.txt   # A03
   rg -n -i -e 'login|reset|otp|coupon|redeem|transfer|limit|quota' ../added.txt   # A04
   rg -n -e 'DEBUG\s*=\s*True|Access-Control-Allow-Origin|allow_origins|CORS|csrf_exempt|X-Frame-Options' ../added.txt   # A05
   rg -n -i -e 'password|passwd|token|jwt|session|algorithms|verify_signature|compare' ../added.txt   # A07
   rg -n -e 'pickle\.loads|yaml\.load\(|ObjectInputStream|unserialize|uses: .*@(main|master)|curl .*\|\s*(sh|bash)' ../added.txt   # A08
   rg -n -e 'log\.|logger\.|logging\.|console\.|print\(' ../added.txt   # A09
   rg -n -e 'requests\.(get|post|put|request)|fetch\(|axios|http\.Get|http\.NewRequest|urlopen|HttpClient' ../added.txt   # A10
   ```
   For A06, list changed manifests and lockfiles; the stack SAST flow runs the audit tool.
2. For every changed file, answer the manual question for each category (OWASP Top 10:2021):

| Category | Manual question |
|---|---|
| A01 Broken Access Control | Does every new entry point check authentication and that this user may access this specific object ID (not only that they are logged in)? |
| A02 Cryptographic Failures | Are passwords hashed with a password hash (bcrypt, scrypt, Argon2, PBKDF2) and tokens made with a CSPRNG (`secrets`, `crypto.randomBytes`, `crypto/rand`)? Is TLS verification on? |
| A03 Injection | Does any request data reach SQL, shell, HTML, template, LDAP or eval without parameterization or context-correct escaping? |
| A04 Insecure Design | Can the new flow be abused by repetition (no rate limit on login, reset, OTP, coupon)? Is a business rule enforced only in the UI? |
| A05 Security Misconfiguration | Is CORS `*` combined with credentials? Is CSRF protection disabled on a cookie-authenticated endpoint? Are debug modes or stack traces exposed? |
| A06 Vulnerable and Outdated Components | Is any added or bumped dependency flagged by the stack audit tool? |
| A07 Identification and Authentication Failures | Are secrets compared in constant time (`hmac.compare_digest`, `crypto.timingSafeEqual`, `subtle.ConstantTimeCompare`)? Is the JWT algorithm pinned and the signature verified? Is the session rotated on login? |
| A08 Software and Data Integrity Failures | Is untrusted data deserialized? Do CI changes run unpinned actions or piped install scripts? |
| A09 Security Logging and Monitoring Failures | Do new log lines include passwords, tokens, full card numbers or personal data? Are auth failures and access denials logged? |
| A10 Server-Side Request Forgery | Can a user control the URL or host? Is there an allowlist, and are internal ranges (169.254.169.254, 10/8, 127/8) blocked after DNS resolution? |

3. If the organization has adopted a newer OWASP Top 10 edition, map the same checks to that edition's category IDs; keep the checks.

### Output
Candidate list: category, file, line, matched text, answer to the manual question.

### Quality Gate
- All ten categories have a recorded result: candidates found, or "no candidates" with the pattern run.
- Every new entry point has an A01 answer.

---

## Phase 3: Trace Each Candidate and Record Findings

### Entry Criteria
- Candidate list exists.

### Actions
1. For each candidate, trace from source to sink in the code: name the variable at the source, every function it passes through, and the sink call. Open each function; do not assume a helper sanitizes because of its name.
2. Decide with this table:

| Trace result | Label |
|---|---|
| Untrusted source reaches sink with no parameterization, escaping, allowlist or authorization check | blocking |
| Reaches sink, but protection depends on a caller not in this PR | question: name the caller and ask |
| Source is trusted (server config, constant) | drop |
| Weak practice with no reachable source (for example `md5` for a cache key) | nit, or drop if the use is not security-related |

3. For every blocking finding write the fix as the specific safe API: parameterized query (`cursor.execute("... WHERE id = %s", (id,))`), `subprocess.run([...], shell=False)`, framework auto-escaping, an object-level permission check, an allowlist.
4. Write `<findings_dir>/prr-owasp-security-pass.json` (fields `flow`, `category` = the OWASP ID such as "A03", `file`, `line`, `evidence` = source-to-sink trace, `proposed_label`, `fix`) and validate with `python -m json.tool`.
5. Do not paste working exploit payloads into review comments; describe the class and the trace.

### Output
`security_findings`.

### Quality Gate
- Every blocking finding has a source, a sink and the path between them in `evidence`.
- The findings file passes `python -m json.tool`.

---

## Worked Example

Illustrative. Diff adds:
```
+@app.get("/invoices/<int:invoice_id>")
+@login_required
+def get_invoice(invoice_id):
+    row = db.execute(f"SELECT * FROM invoices WHERE id = {invoice_id}").fetchone()
+    return jsonify(row)
```
- Phase 1: source `invoice_id` (URL path); new entry point `/invoices/<id>`.
- Phase 2: A03 pattern `execute\(f["']` matches; A01 question: the handler checks login but not that the invoice belongs to the user.
- Phase 3: A03 trace: the `int:` converter makes the value an integer, so SQL injection is not reachable; finding downgraded to nit ("use a parameter anyway"). A01 trace: any logged-in user can read any invoice by ID: blocking, fix "filter by `owner_id = current_user.id` and return 404 when no row".

---

## Exit Criteria

DONE when all ten categories were checked with recorded results, every candidate was traced from source to sink, and every reachable issue is a finding with the trace and a specific safe API as the fix.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Source of data unclear (comes from another service) | **Adjust**: treat it as untrusted unless the service contract states validation. |
| Phase 2 | Pattern produces too many matches | **Adjust**: restrict to files with `how` = full in `reading_plan`; still answer every manual question. |
| Phase 3 | Trace leaves the repository (shared library) | **Adjust**: label `question` and name the library function. |
| Phase 3 | A finding needs a security specialist | **Return**: label it blocking with the trace and request a security reviewer by name or team. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
