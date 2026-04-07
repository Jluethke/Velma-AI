# API Design

Design production-grade REST and GraphQL APIs by gathering requirements, modeling resources, generating specs, validating consistency, and producing documentation.

## Execution Pattern: Phase Pipeline

```
PHASE 1: REQUIREMENTS  --> Gather API requirements (resources, consumers, auth needs)
PHASE 2: DESIGN        --> Design resources, endpoints, status codes, error format
PHASE 3: SPECIFY       --> Generate OpenAPI/GraphQL spec
PHASE 4: VALIDATE      --> Check consistency, naming, versioning, security
PHASE 5: DOCUMENT      --> Produce API documentation
```

## Inputs

- `codebase_context`: string -- Existing code, domain models, or project description that the API will serve
- `consumer_description`: string -- Who will consume this API (frontend, mobile, third-party, internal services)
- `auth_requirements`: string -- Authentication/authorization needs (JWT, API key, OAuth2, none)
- `constraints`: string -- Rate limits, versioning strategy, pagination style, breaking-change policy

## Outputs

- `resource_model`: object -- List of resources with relationships, naming, and nesting decisions
- `endpoint_spec`: object -- Complete endpoint list with methods, status codes, request/response schemas
- `openapi_spec`: string -- OpenAPI 3.1 YAML spec (or GraphQL schema if applicable)
- `validation_report`: object -- Consistency check results with any issues found
- `api_documentation`: string -- Human-readable API documentation with examples

---

## Execution

### Phase 1: REQUIREMENTS

**Entry criteria:** A project or domain description exists. At least one consumer type is identified.

**Actions:**
1. Identify the domain entities that will become API resources (users, orders, products, etc.)
2. Identify the consumers and their needs (what data they read, what actions they perform)
3. Determine authentication requirements (bearer tokens, API keys, OAuth2 flows)
4. Determine non-functional requirements (rate limits, latency targets, payload size limits)
5. Identify existing API contracts or conventions the new API must be compatible with

**Output:** A requirements summary listing resources, consumers, auth model, and constraints.

**Quality gate:** Every identified resource has at least one consumer. Auth model is explicitly chosen (not "TBD").

---

### Phase 2: DESIGN

**Entry criteria:** Requirements summary is complete and validated.

**Actions:**
1. Name resources following REST naming rules (see Reference: RESTful Resource Naming)
2. Map CRUD and non-CRUD operations to HTTP methods (see Reference: HTTP Method Semantics)
3. Select status codes for each response scenario (see Reference: Status Code Selection Guide)
4. Design the error response format following RFC 7807 (see Reference: Error Response Format)
5. Choose pagination strategy -- cursor for feeds/sync, offset for page-based UIs (see Reference: Pagination Patterns)
6. Choose versioning strategy (see Reference: Versioning Strategies)
7. Design rate limiting tiers (see Reference: Rate Limiting)
8. Design authentication flow (see Reference: Authentication Patterns)
9. If GraphQL: design queries, mutations, input types, connection pattern, and mutation payloads (see Reference: GraphQL Schema Design)

**Output:** A complete API design document with resource model, endpoint list, status code mapping, error format, pagination, versioning, and auth design.

**Quality gate:** Every endpoint has a defined method, URL, request schema, response schema, and error responses. No verbs in URLs. No endpoints without auth decisions.

---

### Phase 3: SPECIFY

**Entry criteria:** API design document is complete and reviewed.

**Actions:**
1. Generate an OpenAPI 3.1 spec with all endpoints, schemas, and examples (see Reference: OpenAPI Spec Guidelines)
2. Ensure every endpoint has an `operationId`
3. Use `$ref` for shared schemas to avoid duplication
4. Include realistic `example` values in all schemas
5. Document all possible response codes per endpoint (not just 200)
6. If GraphQL: generate the SDL schema with input types, connection types, and payload types

**Output:** A complete, valid OpenAPI 3.1 YAML file (or GraphQL SDL).

**Quality gate:** Spec passes OpenAPI linting (e.g., `spectral lint`). Every endpoint has `operationId`. All `$ref` targets resolve.

---

### Phase 4: VALIDATE

**Entry criteria:** Spec file is generated and passes linting.

**Actions:**
1. Check naming consistency: all resources use plural nouns, kebab-case, lowercase
2. Check method consistency: POST returns 201 + Location, DELETE returns 204, etc.
3. Check error consistency: all errors follow the same RFC 7807 structure
4. Check versioning: strategy is applied uniformly, deprecation headers present on old versions
5. Check security: every endpoint has auth defined, rate limit headers documented, no secrets in URLs
6. Check pagination: all list endpoints have pagination, limits are capped
7. Cross-reference spec against requirements to ensure nothing was missed

**Output:** A validation report listing any issues found, categorized by severity (blocking, warning, suggestion).

**Quality gate:** Zero blocking issues. All warnings have a documented justification or are resolved.

---

### Phase 5: DOCUMENT

**Entry criteria:** Validation passes with zero blocking issues.

**Actions:**
1. Generate human-readable API documentation from the spec
2. Add a getting-started section with authentication setup
3. Add runnable code examples for common operations (list, create, update, delete)
4. Add an error handling guide explaining each error type
5. Add a rate limiting section explaining tiers and headers
6. Add a versioning/migration guide

**Output:** Complete API documentation ready for publishing.

**Quality gate:** Every endpoint has at least one example. Examples are runnable (correct auth, valid payloads). No internal implementation details are exposed.

---

## Exit Criteria

The skill is DONE when:
- All identified resources have fully specified endpoints
- The OpenAPI spec passes linting with zero errors
- The validation report has zero blocking issues
- Documentation includes authentication, examples, errors, and rate limiting
- The consumer's identified needs are all addressable through the API

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| REQUIREMENTS | Insufficient domain knowledge to identify resources | **Escalate** -- ask the user for domain clarification |
| REQUIREMENTS | No consumers identified | **Abort** -- cannot design API without knowing who uses it |
| DESIGN | Resource naming conflict (two resources want the same name) | **Adjust** -- use more specific names or sub-resources |
| DESIGN | Operation doesn't map to standard HTTP methods | **Adjust** -- use action sub-resource pattern (POST /orders/123/cancel) |
| SPECIFY | Schema circular reference | **Adjust** -- break cycle with `$ref` to a shared component |
| VALIDATE | Blocking issues found | **Retry** -- return to Phase 2 with the specific issues to fix |
| DOCUMENT | Examples fail to run against the spec | **Retry** -- fix the spec or examples, max 2 retries |

## State Persistence

Between runs, this skill saves:
- **Resource inventory**: list of identified domain resources and their relationships
- **Design decisions**: versioning strategy, pagination style, auth model, error format chosen
- **Validation history**: previous validation results and how issues were resolved
- **Spec version**: current OpenAPI spec version for incremental updates

---

## Reference

### RESTful Resource Naming

#### Rules
- **Use plural nouns** for collections: `/users`, `/orders`, `/products`
- **Use IDs for specific resources**: `/users/123`, `/orders/abc-456`
- **Nest for relationships**: `/users/123/orders` (orders belonging to user 123)
- **Max nesting depth: 2 levels**. Beyond that, promote to top-level with filters: `/orders?user_id=123&shop_id=456` instead of `/users/123/shops/456/orders`
- **No verbs in URLs**. The HTTP method IS the verb.
- **Use kebab-case**: `/user-profiles`, not `/userProfiles` or `/user_profiles`
- **Use lowercase only**: `/api/user-accounts`, never `/api/UserAccounts`

#### Common Mistakes
```
BAD:  GET /getUsers          -- verb in URL
BAD:  GET /user              -- singular collection
BAD:  POST /createOrder      -- verb + redundant with POST
BAD:  GET /users/123/orders/456/items/789/variants  -- too deep

GOOD: GET    /users          -- list users
GOOD: GET    /users/123      -- get specific user
GOOD: POST   /users          -- create user
GOOD: GET    /users/123/orders    -- user's orders
GOOD: GET    /order-items?order_id=456  -- promoted from deep nesting
```

#### Action Resources (RPC-style exceptions)
Some operations don't map to CRUD. Use a sub-resource verb for these:
```
POST /orders/123/cancel        -- cancel an order
POST /users/123/verify-email   -- trigger verification
POST /reports/generate         -- trigger report generation
```

---

### HTTP Method Semantics

| Method | Purpose | Idempotent | Request Body | Typical Response |
|--------|---------|-----------|--------------|-----------------|
| GET | Read resource(s) | Yes | No | 200 + body |
| POST | Create resource | No | Yes | 201 + Location header |
| PUT | Full replace | Yes | Yes | 200 or 204 |
| PATCH | Partial update | No* | Yes | 200 + updated resource |
| DELETE | Remove resource | Yes | No | 204 (no body) |
| HEAD | Same as GET, no body | Yes | No | 200, headers only |
| OPTIONS | CORS preflight / discovery | Yes | No | 204 + Allow header |

*PATCH is idempotent if using JSON Merge Patch (RFC 7396), not idempotent with JSON Patch (RFC 6902) operations like "add to array."

#### PUT vs PATCH
```json
// PUT /users/123 — replaces the ENTIRE resource
// Omitted fields are set to null/default
{
  "name": "Alice",
  "email": "alice@example.com",
  "role": "admin"
}

// PATCH /users/123 — updates ONLY specified fields
// Omitted fields are left unchanged
{
  "role": "admin"
}
```

---

### Status Code Selection Guide

#### Success Codes
| Code | When to Use |
|------|-------------|
| 200 OK | GET succeeded, PUT/PATCH updated, DELETE with body |
| 201 Created | POST created a resource. MUST include `Location` header |
| 202 Accepted | Request accepted for async processing (queued job) |
| 204 No Content | DELETE succeeded, PUT with no response body |

#### Client Error Codes
| Code | When to Use |
|------|-------------|
| 400 Bad Request | Malformed JSON, missing required field, validation error |
| 401 Unauthorized | No authentication provided, or token expired/invalid |
| 403 Forbidden | Authenticated but not authorized for this resource |
| 404 Not Found | Resource doesn't exist (also use for unauthorized resource to avoid leaking existence) |
| 405 Method Not Allowed | POST to a read-only endpoint. Include `Allow` header |
| 409 Conflict | Duplicate creation, optimistic locking version mismatch |
| 410 Gone | Resource was deleted and won't return (permanent 404) |
| 415 Unsupported Media Type | Sent XML but endpoint only accepts JSON |
| 422 Unprocessable Entity | JSON is valid but semantically wrong (e.g., end_date before start_date) |
| 429 Too Many Requests | Rate limit exceeded. Include `Retry-After` header |

#### Server Error Codes
| Code | When to Use |
|------|-------------|
| 500 Internal Server Error | Unhandled exception. NEVER expose stack traces in production |
| 502 Bad Gateway | Upstream service returned invalid response |
| 503 Service Unavailable | Planned maintenance or overload. Include `Retry-After` |
| 504 Gateway Timeout | Upstream service timed out |

#### Decision Tree
```
Was the request successful?
├── Yes → Did we create something?
│   ├── Yes → 201 + Location header
│   └── No → Is there a response body?
│       ├── Yes → 200
│       └── No → 204
└── No → Is it the client's fault?
    ├── Yes → Is the client authenticated?
    │   ├── No → 401
    │   └── Yes → Is the client authorized?
    │       ├── No → 403 (or 404 to hide existence)
    │       └── Yes → Is the input malformed?
    │           ├── Yes → 400
    │           └── No → Is it a business rule violation?
    │               ├── Yes → 422
    │               └── No → 409 (conflict) or 404 (not found)
    └── No (server fault) → 500
```

---

### Pagination Patterns

#### Offset-Based (simple, lossy)
```
GET /users?offset=20&limit=10

Response:
{
  "data": [...],
  "pagination": {
    "offset": 20,
    "limit": 10,
    "total": 253
  }
}
```
- **Pros**: Supports jumping to page N, simple to implement
- **Cons**: Skips/duplicates items when data changes between pages. Slow for large offsets (DB scans N rows)

#### Cursor-Based (robust, recommended)
```
GET /users?limit=10&cursor=eyJpZCI6MTAwfQ==

Response:
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6MTEwfQ==",
    "has_more": true
  }
}
```
- Cursor is a Base64-encoded pointer (often `{"id": 100}` or `{"created_at": "2026-01-01", "id": 100}`)
- **Pros**: Stable under concurrent writes, performant (uses indexed WHERE clause)
- **Cons**: Can't jump to page N, cursor is opaque to client

#### Link Headers (RFC 8288)
```http
Link: </users?cursor=abc123>; rel="next",
      </users?cursor=xyz789>; rel="prev",
      </users>; rel="first"
```

#### Rule of Thumb
- User-facing paginated lists (page 1, 2, 3): offset
- API-to-API data sync, infinite scroll, real-time feeds: cursor
- Default limit: 20. Max limit: 100. Always cap the max.

---

### Versioning Strategies

#### URL Path Versioning (recommended for most APIs)
```
GET /api/v1/users
GET /api/v2/users
```
- **Pros**: Explicit, easy to route, cacheable, easy to sunset
- **Cons**: URL changes between versions

#### Header Versioning
```
GET /api/users
Accept: application/vnd.myapi.v2+json
```
- **Pros**: Clean URLs, content negotiation
- **Cons**: Harder to test in browser, easy to forget

#### Query Parameter
```
GET /api/users?version=2
```
- **Pros**: Easy to switch versions in testing
- **Cons**: Pollutes query params, caching issues

#### Versioning Rules
1. Only bump major version for **breaking changes** (removed fields, changed types, renamed endpoints)
2. **Additive changes are NOT breaking**: new optional fields, new endpoints, new enum values
3. Support at most 2 major versions simultaneously
4. Announce deprecation 6+ months before sunset
5. Return `Sunset` and `Deprecation` headers on old versions:
   ```http
   Deprecation: true
   Sunset: Sat, 01 Jan 2027 00:00:00 GMT
   ```

---

### Error Response Format (RFC 7807)

Every error response should follow a consistent structure. RFC 7807 Problem Details is the standard:

```json
{
  "type": "https://api.example.com/errors/validation-error",
  "title": "Validation Error",
  "status": 422,
  "detail": "The 'email' field must be a valid email address.",
  "instance": "/users/signup",
  "errors": [
    {
      "field": "email",
      "message": "Must be a valid email address",
      "value": "not-an-email"
    },
    {
      "field": "age",
      "message": "Must be at least 13",
      "value": 8
    }
  ],
  "trace_id": "abc-123-def-456"
}
```

#### Fields
- `type` (URI): Machine-readable error type. Link to documentation.
- `title` (string): Human-readable summary. Same for all instances of this type.
- `status` (int): HTTP status code (redundant with response, but useful when errors are logged)
- `detail` (string): Human-readable explanation specific to this occurrence
- `instance` (string): URI of the specific request that caused the error
- `trace_id` (string): Correlation ID for debugging (pass through from `X-Request-Id`)

#### Rules
- NEVER expose stack traces, SQL queries, or internal paths in production errors
- ALWAYS include a `trace_id` so support can find logs
- DO return the same error structure for every error (4xx and 5xx)
- DO include field-level validation errors as an array

---

### Rate Limiting

#### Response Headers
```http
X-RateLimit-Limit: 1000          # Max requests per window
X-RateLimit-Remaining: 847       # Requests left in current window
X-RateLimit-Reset: 1672531200    # Unix timestamp when window resets
Retry-After: 30                  # Seconds until client should retry (on 429)
```

#### Implementation Patterns
- **Fixed window**: Simple. 1000 req/hour, resets on the hour. Can burst at window edges.
- **Sliding window**: Count requests in the last 60 minutes. Smoother but more memory.
- **Token bucket**: Bucket holds N tokens, refills at rate R. Allows controlled bursts.

#### Rate Limit Tiers
```
Anonymous:      60 req/hour
Authenticated:  1000 req/hour
Premium:        10000 req/hour
Internal:       no limit (but still track)
```

---

### Authentication Patterns

#### Bearer Token (JWT)
```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```
- Use RS256 (asymmetric) over HS256 (symmetric) so services can verify without the signing key
- Keep access tokens short-lived: 15 minutes
- Use refresh tokens (stored server-side, rotated on use) for session continuity
- NEVER store JWTs in localStorage (XSS vulnerable). Use httpOnly cookies or in-memory.

#### API Key
```http
X-API-Key: sk_live_abc123...
```
- Good for server-to-server. Bad for client-side (can't be rotated easily once leaked).
- Prefix keys: `sk_live_` for production, `sk_test_` for sandbox
- Hash keys in your database (store `SHA-256(key)`, not the key itself)

#### OAuth2 Flow Selection
| Flow | Use Case |
|------|----------|
| Authorization Code + PKCE | Web apps, mobile apps, SPAs (RECOMMENDED) |
| Client Credentials | Server-to-server (machine-to-machine) |
| Device Code | Smart TVs, CLI tools, IoT devices |
| ~~Implicit~~ | DEPRECATED. Do not use. |
| ~~Resource Owner Password~~ | DEPRECATED. Do not use. |

---

### OpenAPI Spec Guidelines

```yaml
openapi: 3.1.0
info:
  title: My API
  version: 1.0.0
  description: |
    Brief description. Include authentication instructions here.

paths:
  /users:
    get:
      summary: List users            # Short (shown in sidebar)
      description: |                  # Long (shown in detail)
        Returns a paginated list of users.
        Supports filtering by role and status.
      operationId: listUsers          # Unique, used for SDK generation
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserList'
        '401':
          $ref: '#/components/responses/Unauthorized'

components:
  schemas:
    User:
      type: object
      required: [id, email]
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        created_at:
          type: string
          format: date-time
```

#### Rules
- Every endpoint MUST have `operationId` (SDK generators use it for method names)
- Use `$ref` to avoid schema duplication
- Document ALL possible response codes, not just 200
- Include realistic `example` values in schemas
- Use `format` hints: `uuid`, `email`, `date-time`, `uri`

---

### GraphQL Schema Design

#### Queries vs Mutations
```graphql
type Query {
  user(id: ID!): User                    # Read single
  users(first: Int, after: String): UserConnection  # Read list (paginated)
}

type Mutation {
  createUser(input: CreateUserInput!): CreateUserPayload!
  updateUser(input: UpdateUserInput!): UpdateUserPayload!
  deleteUser(id: ID!): DeleteUserPayload!
}
```

#### Input Types
Always use dedicated `Input` types for mutations:
```graphql
input CreateUserInput {
  email: String!
  name: String!
  role: Role = MEMBER    # Default value
}

# Separate input for updates (all fields optional)
input UpdateUserInput {
  id: ID!
  email: String
  name: String
  role: Role
}
```

#### Connection Pattern (Relay-style Pagination)
```graphql
type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

#### Mutation Payloads
Always return a payload type (not the entity directly) so you can add errors later:
```graphql
type CreateUserPayload {
  user: User
  errors: [UserError!]!
}

type UserError {
  field: String!
  message: String!
}
```

#### N+1 Prevention
Use DataLoader pattern: batch individual lookups into a single query per tick.
```javascript
const userLoader = new DataLoader(async (ids) => {
  const users = await db.users.findMany({ where: { id: { in: ids } } });
  return ids.map(id => users.find(u => u.id === id));
});
```

---

### Quick Reference Checklist

- [ ] Resource URLs use plural nouns, no verbs
- [ ] POST returns 201 + Location header
- [ ] DELETE returns 204 (no body)
- [ ] All errors follow RFC 7807 format with trace_id
- [ ] Pagination uses cursor for feeds, offset for page-based UIs
- [ ] Rate limit headers present on every response
- [ ] Authentication uses short-lived tokens (15min access, rotated refresh)
- [ ] API keys are hashed in storage, prefixed by environment
- [ ] Versioning strategy chosen and documented
- [ ] OpenAPI spec has operationId on every endpoint
- [ ] No stack traces or internal details in production error responses
- [ ] HATEOAS links included where clients need discoverability
