# Auth RBAC vs ABAC Decision

**One-line description:** Chooses role-based (RBAC), attribute-based (ABAC, NIST SP 800-162) or relationship-based (ReBAC, Zanzibar-style) access control from a decision table driven by the app's actual permission rules, picks an enforcement engine (in-code policy module, Casbin, OPA/Rego, Cedar, OpenFGA), and writes a permission matrix with deny-by-default that the IDOR and abuse-case flows test against.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `authorization_requirements` (object, required): The rules product states in sentences, for example "editors can edit documents in their own workspace", "billing admins can see invoices", "a user can share a file with another user".
- `auth_inventory` (object, required): Output of `auth-session-vs-token-decision`.
- `stack` (string, required): `python`, `node` or `go`.

---

## Outputs

- `authz_model_decision` (object): Chosen model and table row, engine and version, the permission matrix (subject type x action x resource type x condition), the list of current authorization check sites, and gaps between rules and code.

---

## Phase 1: Normalize the Rules

### Entry Criteria
- `authorization_requirements` has at least one rule.

### Actions
1. Rewrite every rule as a tuple: `subject` (who, by role or attribute), `action`, `resource type`, `condition` (ownership, tenant, attribute, relationship, time).
2. Tag each condition with one kind:
   - `none`: role alone decides;
   - `tenant`: resource belongs to the subject's tenant or organization;
   - `owner`: subject created or owns the resource;
   - `attribute`: depends on resource or environment attributes (status, classification, region, time of day);
   - `relationship`: depends on a graph of shares, group membership or folder inheritance.
3. Find existing check sites: `rg -n -i "is_staff|is_superuser|has_perm|permission_required|@login_required|role ?==|roles\.includes|hasRole|can\(|authorize\(|policy" .`

### Output
Rule tuple list with condition kinds, and check sites.

### Quality Gate
- Every input rule maps to at least one tuple.
- Each check site has file and line.

---

## Phase 2: Choose Model and Engine

### Entry Criteria
- Tuple list exists.

### Actions
1. Count condition kinds and choose the model (first matching row):

| # | Condition kinds present | Model |
|---|---|---|
| 1 | Any `relationship` (sharing, nested folders, groups of groups) | ReBAC (OpenFGA, SpiceDB, or Zanzibar-style tables) with roles expressed as relations |
| 2 | Any `attribute` beyond tenant and owner | ABAC (policy engine: OPA/Rego, Cedar, or Casbin ABAC model) |
| 3 | Only `none`, `tenant`, `owner` | RBAC with tenant and ownership scoping in queries; roles scoped per tenant |
| 4 | Only `none` | Plain RBAC |

2. Engine choice:

| Situation | Engine |
|---|---|
| RBAC, one service, policy changes ship with code deploys | In-code policy module: one function `can(subject, action, resource) -> bool` with a static permission map, plus query scoping |
| RBAC or ABAC, several services, policies change without deploys | OPA (Rego) as sidecar or library, or Cedar |
| Need a model file and adapters in Python, Node and Go | Casbin (`pycasbin`, `casbin` npm, `github.com/casbin/casbin/v2`) with a `model.conf` |
| ReBAC | OpenFGA or SpiceDB |

   Introducing an external engine is a dependency decision; present the row to the user and record approval.
3. Deny by default: any (subject, action, resource) not granted in the matrix is denied. Super-admin bypasses are listed explicitly as matrix rows.
4. Role explosion check: if RBAC would need a role per tenant per feature, move to row 2 or 1.

### Output
Model, engine, and approval note.

### Quality Gate
- The selected model row and engine row are recorded with the tuple counts that selected them.

---

## Phase 3: Write the Permission Matrix

### Entry Criteria
- Model chosen.

### Actions
1. Write the matrix as data (YAML, JSON or CSV in the repo), one row per allowed tuple, with `subject`, `action`, `resource`, `condition`.
2. For Casbin RBAC with domains (tenants), a minimal model is:
   ```
   [request_definition]
   r = sub, dom, obj, act
   [policy_definition]
   p = sub, dom, obj, act
   [role_definition]
   g = _, _, _
   [policy_effect]
   e = some(where (p.eft == allow))
   [matchers]
   m = g(r.sub, p.sub, r.dom) && r.dom == p.dom && r.obj == p.obj && r.act == p.act
   ```
   Validate syntax by loading it in a two-line test with the installed Casbin package.
3. For OPA, write `package authz` with `default allow := false` and rules per matrix row; test with `opa test ./policy -v`.
4. Compare the matrix to the check sites from Phase 1. Every route that touches a resource must map to a matrix row; record unmapped routes as gaps.
5. Do not rewrite application authorization code in this flow; `auth-idor-object-access-checks` enforces it per object.

### Output
`authz_model_decision`.

### Quality Gate
- The matrix file parses (`python -c "import yaml,sys; yaml.safe_load(open(sys.argv[1]))" authz.yaml` or `jq . authz.json`).
- Casbin model loads in a test, or `opa test` passes, when an engine was chosen.
- Gap list is present (may be empty).

---

## Worked Example

Illustrative only. Multi-tenant SaaS, rules: "admins manage users in their org", "members read and edit projects in their org", "anyone can read a project shared with them by link".

Phase 1: tuples with kinds `tenant` (first two) and `relationship` (link sharing).

Phase 2: row 1 matches (relationship), ReBAC; but sharing is one level only, so the user approves row 3 RBAC plus a `project_shares` table, recorded as a deliberate deviation.

Phase 3: `authz.yaml` with 7 rows; `jq`/`yaml` parse succeeds; gaps: `PATCH /api/projects/:id/archive` has no check site.

---

## Exit Criteria

DONE when every product rule is a tuple, the model and engine are chosen from the tables with any deviation approved, a deny-by-default matrix exists as parseable data, and unmapped routes are listed as gaps.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Rules are vague ("admins can do admin stuff") | **Return**: ask for each action and resource; do not infer permissions. |
| Phase 2 | User rejects a new dependency | **Adjust**: use the in-code policy module row and record the trade-off. |
| Phase 3 | Casbin model fails to load | **Retry**: compare section names and matcher syntax with the Casbin docs example for RBAC with domains. |
| Phase 3 | Matrix contradicts existing behavior that users rely on | **Return**: list each contradiction for a product decision. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
