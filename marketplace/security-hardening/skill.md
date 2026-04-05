# Security Hardening

Systematically scan, assess, prioritize, and remediate application security vulnerabilities across the OWASP Top 10, authentication, authorization, input validation, and infrastructure configuration.

## Execution Pattern: Phase Pipeline

```
PHASE 1: SCAN          --> Inventory attack surface (inputs, auth, deps, secrets)
PHASE 2: ASSESS        --> Check each OWASP Top 10 category
PHASE 3: PRIORITIZE    --> Rank vulnerabilities by severity x exploitability
PHASE 4: REMEDIATE     --> Generate fixes for each vulnerability
PHASE 5: VERIFY        --> Checklist verification, residual risk assessment
```

## Inputs

- `codebase_context`: string -- Source code, configuration files, or repository to audit
- `deployment_environment`: string -- Where and how the app is deployed (cloud, on-prem, containers)
- `auth_mechanism`: string -- Current authentication/authorization approach
- `task_description`: string -- Specific security concern or general audit request

## Outputs

- `attack_surface_inventory`: object -- All entry points, external inputs, dependencies, secrets locations
- `vulnerability_report`: object -- Each vulnerability with OWASP category, severity, exploitability, and evidence
- `remediation_plan`: object -- Prioritized list of fixes with code examples and effort estimates
- `verification_checklist`: object -- Post-fix verification steps to confirm each vulnerability is resolved

---

## Execution

### Phase 1: SCAN -- Inventory Attack Surface

**Entry criteria:** Codebase or application description is accessible.

**Actions:**
1. Identify all external inputs: HTTP endpoints, form fields, URL parameters, file uploads, WebSocket messages, CLI arguments
2. Identify authentication mechanisms: JWT, session cookies, API keys, OAuth flows
3. Identify authorization checks: RBAC roles, ABAC policies, endpoint-level guards
4. Scan dependencies for known vulnerabilities (`npm audit`, `pip-audit`, `cargo audit`)
5. Search for hardcoded secrets: API keys, passwords, tokens, connection strings in source code
6. Inventory CORS configuration, CSP headers, and security-related HTTP headers
7. Check TLS configuration and certificate management
8. Identify server-side request capabilities (URLs fetched from user input)

**Output:** A complete attack surface inventory listing every entry point, dependency, secret location, and security configuration.

**Quality gate:** Every HTTP endpoint is listed. Dependency audit has been run. Secret scan has been performed. No entry points are marked "unknown."

---

### Phase 2: ASSESS -- Check Each OWASP Top 10 Category

**Entry criteria:** Attack surface inventory is complete.

**Actions:**
1. **A01 Broken Access Control**: Check for IDOR vulnerabilities, missing ownership checks, admin endpoints without server-side auth (see Reference: Authorization Patterns, Broken Access Control Patterns)
2. **A02 Cryptographic Failures**: Verify TLS 1.2+, check password hashing algorithm (must be Argon2id or bcrypt 12+), check for MD5/SHA-1 usage, verify data classification (see Reference: Authentication Best Practices)
3. **A03 Injection**: Check all database queries for parameterization, check HTML output for XSS, check shell command construction, check file path handling (see Reference: Input Validation, Common Vulnerability Prevention)
4. **A04 Insecure Design**: Review threat model, check rate limiting on auth endpoints, check for account lockout/CAPTCHA
5. **A05 Security Misconfiguration**: Check for default credentials, unnecessary features/endpoints, debug mode in production, verbose error messages (see Reference: Security Headers)
6. **A06 Vulnerable Components**: Review dependency audit results, check for pinned versions and lock files
7. **A07 Authentication Failures**: Check password policy, MFA availability, session management (see Reference: Session Security Checklist)
8. **A08 Integrity Failures**: Verify dependency lock files, check CI/CD artifact signing, review update mechanisms
9. **A09 Logging Failures**: Check for auth event logging, access control failure logging, input validation failure logging
10. **A10 SSRF**: Check all server-side URL fetching for input validation, internal network blocking, redirect handling (see Reference: SSRF Prevention)

**Output:** A vulnerability report with each finding categorized by OWASP category, including evidence (code location, specific issue) and severity assessment.

**Quality gate:** All 10 OWASP categories have been checked. Every finding has a specific code location or configuration reference. No categories are marked "not checked."

---

### Phase 3: PRIORITIZE -- Rank by Severity x Exploitability

**Entry criteria:** Vulnerability report is complete with all OWASP categories assessed.

**Actions:**
1. Score each vulnerability on severity (1-5): impact if exploited (data breach = 5, info disclosure = 2)
2. Score each vulnerability on exploitability (1-5): how easy to exploit (unauthenticated remote = 5, requires admin access = 2)
3. Compute priority = severity x exploitability
4. Group into tiers:
   - **Critical (20-25)**: Fix immediately, block deployment
   - **High (12-19)**: Fix before next release
   - **Medium (6-11)**: Fix within sprint
   - **Low (1-5)**: Track, fix when convenient
5. Order within tiers by effort (quick fixes first)

**Output:** Prioritized vulnerability list with severity scores, exploitability scores, and priority tiers.

**Quality gate:** Every vulnerability has both scores. No critical or high items are missing effort estimates. The ordering is defensible.

---

### Phase 4: REMEDIATE -- Generate Fixes

**Entry criteria:** Prioritized list is reviewed and accepted.

**Actions:**
1. For each vulnerability, generate a specific fix with code examples:
   - **Injection**: Replace string interpolation with parameterized queries (see Reference: Parameterized Queries)
   - **XSS**: Apply output escaping, use framework auto-escaping, add DOMPurify for user HTML (see Reference: XSS Prevention)
   - **CSRF**: Add SameSite cookies, CSRF tokens, Origin/Referer validation (see Reference: CSRF Prevention)
   - **SSRF**: Add URL validation with internal network blocking (see Reference: SSRF Prevention)
   - **Broken auth**: Implement proper password hashing, JWT validation, session management (see Reference: Authentication Best Practices, JWT Best Practices)
   - **Broken access control**: Add ownership checks, enforce RBAC/ABAC (see Reference: Authorization Patterns)
   - **Missing headers**: Add CSP, HSTS, X-Frame-Options, X-Content-Type-Options (see Reference: Security Headers)
   - **CORS issues**: Restrict origins, remove wildcard with credentials (see Reference: CORS Configuration)
   - **Secret exposure**: Move to environment variables or vault, add to .gitignore (see Reference: Secret Management)
   - **Rate limiting**: Implement token bucket or sliding window (see Reference: Rate Limiting)
2. For each fix, note any breaking changes or migration steps required
3. Generate a verification test for each fix (how to confirm it works)

**Output:** Complete remediation package with code fixes, migration steps, and verification tests for each vulnerability.

**Quality gate:** Every critical and high vulnerability has a concrete fix with code. Every fix has a verification test. No fixes introduce new vulnerabilities.

---

### Phase 5: VERIFY -- Checklist Verification and Residual Risk

**Entry criteria:** Remediation fixes have been generated (or applied).

**Actions:**
1. Run through the Secure Defaults Checklist (see Reference: Secure Defaults Checklist)
2. Re-run dependency audit to confirm no new vulnerabilities introduced
3. Verify each fix addresses the specific vulnerability it targets
4. Identify residual risks -- vulnerabilities that cannot be fully mitigated and require ongoing monitoring
5. Document accepted risks with justification and compensating controls
6. Recommend ongoing security practices: regular dependency audits, secret rotation schedule, log monitoring

**Output:** A verification report confirming which vulnerabilities are resolved, which are accepted risks, and what ongoing practices are recommended.

**Quality gate:** Every critical and high vulnerability is either resolved or has a documented accepted-risk justification with compensating controls. The secure defaults checklist passes.

---

## Exit Criteria

The skill is DONE when:
- All 10 OWASP categories have been assessed
- All critical and high vulnerabilities have fixes (generated or applied)
- The secure defaults checklist passes
- Residual risks are documented with compensating controls
- A verification test exists for every remediated vulnerability

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| SCAN | Cannot access source code | **Abort** -- security audit requires code access |
| SCAN | Dependency audit tool unavailable | **Adjust** -- manually check lock files for known CVEs |
| ASSESS | Cannot determine auth mechanism | **Escalate** -- ask user to describe authentication approach |
| ASSESS | Obfuscated or minified code | **Adjust** -- focus on configuration, headers, and dependency audit |
| PRIORITIZE | Cannot assess exploitability without deployment context | **Escalate** -- ask user for deployment details |
| REMEDIATE | Fix requires architectural change beyond scope | **Escalate** -- document the issue and recommend a dedicated project |
| VERIFY | Cannot run verification tests (no test environment) | **Adjust** -- provide manual verification steps instead |

## State Persistence

Between runs, this skill saves:
- **Attack surface inventory**: all entry points, deps, and configurations found
- **Vulnerability history**: previous findings and their resolution status
- **Dependency baseline**: lock file snapshot for detecting new vulnerabilities
- **Accepted risks register**: documented risks with review dates

---

## Reference

### OWASP Top 10 -- Quick Mitigations

#### A01: Broken Access Control
- Deny by default. Every endpoint requires explicit permission.
- Enforce ownership checks: `WHERE user_id = :current_user_id` on every query
- Disable directory listing. Return 404 for unauthorized resources (don't leak existence).
- Rate limit and log access control failures. Alert on repeated 403s from same IP.

#### A02: Cryptographic Failures
- Use TLS 1.2+ everywhere. No HTTP, no self-signed certs in production.
- Encrypt sensitive data at rest (AES-256-GCM) and in transit (TLS).
- Never store passwords in plaintext. Use Argon2id or bcrypt with cost factor 12+.
- Never use MD5 or SHA-1 for anything security-sensitive.
- Classify data: PII, PHI, financial. Apply controls per classification.

#### A03: Injection
- Use parameterized queries for ALL database operations. No exceptions.
- Use ORM methods that parameterize automatically.
- Validate and sanitize all user input. Allowlist > denylist.
- For HTML output: escape by default (React does this, EJS does not).

#### A04: Insecure Design
- Threat model before building: who are the adversaries, what are the assets?
- Apply principle of least privilege to every component.
- Use rate limiting on authentication endpoints (5 attempts, then lockout).
- Implement account lockout, CAPTCHA, or exponential backoff.

#### A05: Security Misconfiguration
- Remove default credentials. Change default ports.
- Disable unnecessary features, endpoints, HTTP methods.
- Keep frameworks, libraries, and OS patched.
- Automate configuration validation in CI.
- Remove stack traces, debug info, and verbose errors in production.

#### A06: Vulnerable and Outdated Components
- Run `npm audit` / `pip-audit` / `cargo audit` in CI.
- Pin dependency versions. Use lock files.
- Monitor CVE databases (NVD, GitHub Security Advisories).
- Remove unused dependencies.

#### A07: Identification and Authentication Failures
- Implement multi-factor authentication (MFA/2FA).
- Don't ship with default passwords. Ever.
- Enforce password complexity: 12+ characters, check against breached password lists.
- Use secure session management (see Session Security Checklist).

#### A08: Software and Data Integrity Failures
- Verify integrity of dependencies (lock files, SRI hashes for CDN scripts).
- Sign releases and verify signatures.
- CI/CD pipelines should validate artifact integrity.
- Protect update mechanisms with signing and verification.

#### A09: Security Logging and Monitoring Failures
- Log all authentication attempts (success and failure).
- Log access control failures.
- Log input validation failures.
- Send logs to a centralized system. Alert on anomalies.
- Include timestamp, user ID, IP, action, resource, result in every log entry.

#### A10: Server-Side Request Forgery (SSRF)
- Validate and sanitize all URLs from user input.
- Use allowlists for permitted domains/IPs.
- Block requests to internal networks (169.254.x.x, 10.x.x.x, 127.0.0.1, metadata endpoints).
- Disable HTTP redirects for server-side requests, or validate each redirect.

---

### Input Validation

#### Allowlists Over Denylists
```python
# BAD: Denylist — easy to bypass
def validate_filename(name):
    dangerous = ['..', '/', '\\', '\x00']
    for d in dangerous:
        if d in name:
            raise ValueError("Invalid filename")

# GOOD: Allowlist — only permit known-safe characters
import re
def validate_filename(name):
    if not re.match(r'^[a-zA-Z0-9_\-\.]{1,255}$', name):
        raise ValueError("Invalid filename")
```

#### Parameterized Queries
```python
# BAD: String interpolation — SQL injection
cursor.execute(f"SELECT * FROM users WHERE email = '{email}'")

# GOOD: Parameterized — safe
cursor.execute("SELECT * FROM users WHERE email = %s", (email,))

# GOOD: ORM — parameterized automatically
User.objects.filter(email=email)
```

```javascript
// BAD: String concatenation
db.query(`SELECT * FROM users WHERE email = '${email}'`);

// GOOD: Parameterized
db.query('SELECT * FROM users WHERE email = $1', [email]);
```

#### HTML Sanitization
```python
import bleach

# Strip all HTML
clean = bleach.clean(user_input)

# Allow specific tags only
clean = bleach.clean(
    user_input,
    tags=['b', 'i', 'u', 'a', 'p', 'br'],
    attributes={'a': ['href', 'title']},
    protocols=['https']
)
```

#### Type Validation Pattern
```python
from pydantic import BaseModel, validator, EmailStr
from typing import Optional

class CreateUserRequest(BaseModel):
    email: EmailStr
    name: str  # min_length/max_length via Field
    age: int

    @validator('name')
    def name_must_be_reasonable(cls, v):
        if len(v) < 1 or len(v) > 200:
            raise ValueError('Name must be 1-200 characters')
        if not v.replace(' ', '').replace('-', '').isalpha():
            raise ValueError('Name must contain only letters, spaces, hyphens')
        return v.strip()

    @validator('age')
    def age_must_be_valid(cls, v):
        if v < 13 or v > 150:
            raise ValueError('Age must be between 13 and 150')
        return v
```

---

### Authentication Best Practices

#### Password Hashing
```python
# GOOD: Argon2id (recommended, memory-hard)
from argon2 import PasswordHasher
ph = PasswordHasher(
    time_cost=3,        # iterations
    memory_cost=65536,   # 64 MB
    parallelism=4,
    hash_len=32
)
hash = ph.hash(password)
ph.verify(hash, password)  # raises on mismatch

# GOOD: bcrypt (widely supported)
import bcrypt
hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12))
bcrypt.checkpw(password.encode(), hash)  # returns True/False
```

**Never use**: MD5, SHA-1, SHA-256 (without salt/iterations), or any single-pass hash for passwords.

#### JWT Best Practices
```python
import jwt
from datetime import datetime, timedelta

# Use RS256 (asymmetric) — services verify without signing key
private_key = open('private.pem').read()
public_key = open('public.pem').read()

# Short-lived access token (15 min)
access_token = jwt.encode({
    'sub': user_id,
    'exp': datetime.utcnow() + timedelta(minutes=15),
    'iat': datetime.utcnow(),
    'iss': 'myapp',
    'aud': 'myapp-api',
    'jti': str(uuid4()),  # unique token ID for revocation
}, private_key, algorithm='RS256')

# Verification — ALWAYS specify algorithm and audience
payload = jwt.decode(
    access_token,
    public_key,
    algorithms=['RS256'],          # NEVER use algorithms=None
    audience='myapp-api',
    issuer='myapp'
)
```

#### Refresh Token Pattern
```
1. Login → return access_token (15min) + refresh_token (7 days)
2. Store refresh_token as httpOnly, secure, sameSite cookie
3. Store access_token in memory only (not localStorage!)
4. When access_token expires, POST /auth/refresh with refresh cookie
5. Server validates refresh_token, issues new access + new refresh (rotation)
6. Old refresh_token is immediately invalidated (one-time use)
7. If stolen refresh_token is used → invalidate ALL tokens for that user
```

#### Session Security Checklist
- [ ] Session IDs are random (128+ bits of entropy)
- [ ] Session cookies: `httpOnly`, `Secure`, `SameSite=Lax` (or Strict)
- [ ] Sessions invalidated on logout (server-side deletion)
- [ ] Sessions rotated on privilege change (login, role change)
- [ ] Absolute session timeout: 24 hours
- [ ] Idle session timeout: 30 minutes

---

### Authorization Patterns

#### RBAC (Role-Based Access Control)
```python
# Simple role check
PERMISSIONS = {
    'admin': ['read', 'write', 'delete', 'manage_users'],
    'editor': ['read', 'write'],
    'viewer': ['read'],
}

def require_permission(permission):
    def decorator(f):
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if permission not in PERMISSIONS.get(user.role, []):
                raise Forbidden()
            return f(*args, **kwargs)
        return wrapper
    return decorator

@require_permission('write')
def update_article(article_id, data):
    ...
```

#### ABAC (Attribute-Based Access Control)
More flexible -- decisions based on user attributes, resource attributes, and context:
```python
def can_edit_document(user, document):
    # User must be in same department
    if user.department != document.department:
        return False
    # Document must not be locked
    if document.locked:
        return False
    # User must have editor role OR be the document owner
    if user.role != 'editor' and document.owner_id != user.id:
        return False
    # Outside business hours: only admins
    if not is_business_hours() and user.role != 'admin':
        return False
    return True
```

#### Broken Access Control Patterns to Catch
```python
# BAD: IDOR — user can access any order by changing the ID
@app.get('/orders/{order_id}')
def get_order(order_id):
    return db.query("SELECT * FROM orders WHERE id = %s", order_id)

# GOOD: Enforce ownership
@app.get('/orders/{order_id}')
def get_order(order_id, current_user=Depends(get_current_user)):
    order = db.query(
        "SELECT * FROM orders WHERE id = %s AND user_id = %s",
        order_id, current_user.id
    )
    if not order:
        raise HTTPException(404)  # 404, not 403 (don't leak existence)
    return order
```

---

### CORS Configuration

```python
# GOOD: Specific origins, explicit methods
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://myapp.com", "https://staging.myapp.com"],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    allow_credentials=True,     # Required for cookies
    max_age=3600,               # Cache preflight for 1 hour
)
```

#### CORS Rules
- **NEVER use `allow_origins=["*"]` with `allow_credentials=True`** -- browsers block this combination
- `allow_origins=["*"]` is only safe for truly public APIs (no auth, no cookies)
- List specific origins in production. Use env vars to differ between staging and prod.
- `max_age` reduces preflight OPTIONS requests (set to 3600 = 1 hour)

---

### Security Headers (CSP, HSTS, etc.)

```python
# Express.js — use helmet
const helmet = require('helmet');
app.use(helmet());

# Manual headers
@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    # Prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"
    # Prevent MIME sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    # Force HTTPS
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    # XSS filter (legacy browsers)
    response.headers["X-XSS-Protection"] = "0"  # Disabled — CSP is better
    # Referrer policy
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    # Permissions policy
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response
```

#### Content Security Policy (CSP)
```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://cdn.example.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

Start with `Content-Security-Policy-Report-Only` to test without breaking things. Monitor the report-uri for violations.

---

### Secret Management

#### Rules
1. **NEVER hardcode secrets** in source code. Ever. Not even "temporarily."
2. **NEVER commit `.env` files**. Add to `.gitignore` before first commit.
3. **NEVER log secrets**. Mask them in log output.
4. **Rotate secrets on schedule**: API keys quarterly, passwords on compromise.

#### Environment Variables (Minimum Viable)
```bash
# .env (NEVER committed)
DATABASE_URL=postgresql://user:pass@host:5432/db
API_SECRET_KEY=sk_live_abc123...
JWT_PRIVATE_KEY_PATH=/etc/secrets/jwt-private.pem
```

```python
import os
DATABASE_URL = os.environ["DATABASE_URL"]  # Crash if missing — intentional
```

#### Vault / Secret Manager (Production)
```python
# AWS Secrets Manager
import boto3
client = boto3.client('secretsmanager')
secret = client.get_secret_value(SecretId='myapp/prod/db-password')
db_password = secret['SecretString']

# HashiCorp Vault
import hvac
client = hvac.Client(url='https://vault.internal:8200', token=os.environ['VAULT_TOKEN'])
secret = client.secrets.kv.v2.read_secret_version(path='myapp/database')
db_password = secret['data']['data']['password']
```

#### Secret Rotation Pattern
1. Generate new secret
2. Add new secret to secret manager (keep old secret active)
3. Deploy application with new secret
4. Verify application works with new secret
5. Revoke old secret
6. Audit log the rotation

---

### Rate Limiting

#### Token Bucket (recommended)
```python
import time
from collections import defaultdict

class TokenBucket:
    def __init__(self, rate: float, capacity: int):
        self.rate = rate          # tokens per second
        self.capacity = capacity  # max burst size
        self.buckets = defaultdict(lambda: {'tokens': capacity, 'last': time.time()})

    def allow(self, key: str) -> bool:
        bucket = self.buckets[key]
        now = time.time()
        elapsed = now - bucket['last']
        bucket['tokens'] = min(self.capacity, bucket['tokens'] + elapsed * self.rate)
        bucket['last'] = now
        if bucket['tokens'] >= 1:
            bucket['tokens'] -= 1
            return True
        return False

# 10 requests per second, burst of 20
limiter = TokenBucket(rate=10, capacity=20)
if not limiter.allow(request.client.host):
    return Response(status_code=429, headers={'Retry-After': '1'})
```

#### Sliding Window (Redis)
```python
import redis
import time

def is_rate_limited(redis_client, key, limit, window_seconds):
    now = time.time()
    pipeline = redis_client.pipeline()
    pipeline.zremrangebyscore(key, 0, now - window_seconds)
    pipeline.zadd(key, {str(now): now})
    pipeline.zcard(key)
    pipeline.expire(key, window_seconds)
    results = pipeline.execute()
    return results[2] > limit
```

#### Rate Limit by Layer
```
Layer 1: Per-IP at load balancer (Nginx/Cloudflare) — coarse, catches bots
Layer 2: Per-user in application — fine-grained, per endpoint
Layer 3: Per-operation for expensive endpoints (search, export, ML inference)
```

---

### Common Vulnerability Prevention

#### SQL Injection
Already covered in Input Validation. Use parameterized queries. Always.

#### XSS (Cross-Site Scripting)
```javascript
// BAD: innerHTML with user data
element.innerHTML = userInput;

// GOOD: textContent (auto-escapes)
element.textContent = userInput;

// GOOD: Framework auto-escaping (React, Vue, Angular all do this)
return <div>{userInput}</div>;  // React escapes automatically

// DANGEROUS: dangerouslySetInnerHTML — only with sanitized HTML
return <div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(userInput)}} />;
```

#### CSRF (Cross-Site Request Forgery)
```python
# Defense 1: SameSite cookies (primary defense)
response.set_cookie(
    'session_id', value=session_id,
    httponly=True, secure=True,
    samesite='Lax'  # Prevents CSRF on POST/PUT/DELETE
)

# Defense 2: CSRF tokens (belt-and-suspenders)
from secrets import token_urlsafe
csrf_token = token_urlsafe(32)
# Include in form: <input type="hidden" name="csrf_token" value="...">
# Validate on POST: if request.form['csrf_token'] != session['csrf_token']: abort(403)

# Defense 3: Check Origin/Referer headers on state-changing requests
```

#### SSRF (Server-Side Request Forgery)
```python
import ipaddress
from urllib.parse import urlparse

def is_safe_url(url):
    """Validate URL is not targeting internal resources."""
    parsed = urlparse(url)

    # Must be HTTP(S)
    if parsed.scheme not in ('http', 'https'):
        return False

    # Resolve hostname to IP
    import socket
    try:
        ip = socket.gethostbyname(parsed.hostname)
    except socket.gaierror:
        return False

    addr = ipaddress.ip_address(ip)

    # Block private, loopback, link-local
    if addr.is_private or addr.is_loopback or addr.is_link_local:
        return False

    # Block cloud metadata endpoints
    if ip in ('169.254.169.254', '100.100.100.200'):
        return False

    return True
```

---

### Secure Defaults Checklist for New Projects

- [ ] `.env` in `.gitignore` before first commit
- [ ] `Dockerfile` runs as non-root user
- [ ] HTTPS only, HSTS enabled
- [ ] Security headers set (CSP, X-Frame-Options, X-Content-Type-Options)
- [ ] CORS origins explicitly listed (no wildcard with credentials)
- [ ] All database queries parameterized
- [ ] Passwords hashed with Argon2id or bcrypt (cost 12+)
- [ ] JWT uses RS256, 15min expiry, audience/issuer validated
- [ ] Rate limiting on auth endpoints (5 attempts then lockout)
- [ ] Dependency audit in CI (`npm audit`, `pip-audit`)
- [ ] Logging: auth events, access control failures, input validation errors
- [ ] No secrets in code, logs, or error responses
- [ ] Session cookies: httpOnly, Secure, SameSite=Lax
- [ ] File uploads: validate type, limit size, store outside web root
- [ ] Admin endpoints behind VPN or IP allowlist
