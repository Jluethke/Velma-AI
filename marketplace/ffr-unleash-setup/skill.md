# Unleash Flag Creation and Token Setup

**One-line description:** Runs or connects to a self-hosted Unleash server, creates one flag with the correct Unleash flag type through the Admin API, issues the right token type for each consumer, and proves the flag is served through the Client API with curl.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flag_spec` (object, required): Output of `ffr-flag-type-classify`.
- `provider_choice` (object, required): Output of `ffr-provider-select`; `provider` must be `unleash`.
- `repo_path` (string, required): Repository root; used only to record where tokens are referenced (environment variable names), never to store tokens.

---

## Outputs

- `unleash_config` (object): Unleash base URL, project, environments, flag name and Unleash type, the token types issued and the environment variable names that hold them, and the curl transcript.

---

## Phase 1: Reach an Unleash Server

### Entry Criteria
- `provider_choice.provider` == "unleash".

### Actions
1. If the team already runs Unleash, record its base URL and skip to step 4.
2. For a local server, use the official Docker Compose file from the Unleash repository:
```
git clone https://github.com/Unleash/unleash.git
cd unleash
docker compose up -d
```
The UI is at `http://localhost:4242`. The Unleash docs list the initial admin login for this setup; change the password at first login.
3. Check health: `curl -s http://localhost:4242/health` must return a JSON body with `"health":"GOOD"`.
4. Create a personal access token or admin token in the UI (Profile, then Personal API tokens, or Admin settings, then API access) for the setup steps. Export it only in your shell: `export UNLEASH_ADMIN_TOKEN=...`. Never paste it into a file in `repo_path`.

### Output
A reachable Unleash URL and an admin-capable token in the shell.

### Quality Gate
- `/health` returned `"health":"GOOD"` (paste the response).
- `git -C <repo_path> grep -n "UNLEASH_ADMIN_TOKEN=" ` returns no lines with a token value.

---

## Phase 2: Create the Flag with the Right Type

### Entry Criteria
- Admin token exported.

### Actions
1. Map `flag_spec.type` to the Unleash flag type. Unleash uses the type to compute when a flag becomes "potentially stale" (Unleash documents 40 days for release and experiment, 7 days for operational, and no expiry for kill-switch and permission).

| `flag_spec.type` | Unleash type |
|---|---|
| release | `release` |
| experiment | `experiment` |
| kill_switch | `kill-switch` |
| permission | `permission` |

2. Create the flag in the project (here `default`):
```
curl -s -X POST "http://localhost:4242/api/admin/projects/default/features" \
  -H "Authorization: $UNLEASH_ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"checkout-new-tax-engine","type":"release","description":"Gates tax engine v2. Owner @payments-core."}'
```
3. Leave the flag disabled in every environment for now. In Unleash a disabled flag evaluates to `false` for boolean checks. That must equal `flag_spec.safe_default`. If the safe default is `true` (some kill switches), record that the code default and the disabled state differ, and add an open question about naming the flag the other way (`disable-x` instead of `x-enabled`) so disabled means safe.
4. Do not add strategies yet. Strategies (targeting and gradual rollout) are written in `ffr-targeting-rules`.

### Output
Flag created and disabled.

### Quality Gate
- `curl -s -H "Authorization: $UNLEASH_ADMIN_TOKEN" http://localhost:4242/api/admin/projects/default/features/checkout-new-tax-engine` returns the flag with `"type":"release"` (or the mapped type) and every environment `"enabled":false`.

---

## Phase 3: Issue Consumer Tokens and Read Through the Client API

### Entry Criteria
- Flag exists.

### Actions
1. Issue tokens by consumer, per the Unleash token types:

| Consumer | Token type | Note |
|---|---|---|
| Backend service SDK | Backend (client) token, scoped to one project and one environment | secret; store in the deployment secret store |
| Browser or mobile app | Frontend token, used with the Frontend API or Unleash Edge | not secret, but scoped to one environment |
| Automation (rollback, cleanup) | Personal access token or service account token | secret; least privilege |

2. Record the environment variable names the services will read, for example `UNLEASH_URL` and `UNLEASH_API_TOKEN`. Record names only.
3. Prove the backend token can read the flag:
```
curl -s "http://localhost:4242/api/client/features/checkout-new-tax-engine" \
  -H "Authorization: $UNLEASH_CLIENT_TOKEN"
```
The response must contain `"enabled":false` and an empty `strategies` list.
4. Record the SDK polling interval you will run with. Unleash server SDKs poll; check the SDK docs for the default (`refreshInterval` in Node, `refresh_interval` in Python). This interval bounds how fast a kill switch takes effect and is measured in `ffr-kill-switch-drill`.

### Output
`unleash_config`.

### Quality Gate
- The client API curl with the backend token returns the flag with `"enabled":false`.
- Each consumer in the table has a token type and an environment variable name recorded, and no token value appears in `repo_path` (`git grep -nE "[a-z0-9*_-]+:(development|production)\.[a-f0-9]{16,}"` returns nothing; Unleash backend tokens have the form `<project>:<environment>.<secret>`, with `*` as the project for all-project tokens; adjust the environment names to yours).

---

## Worked Example

Illustrative only.

```
$ curl -s http://localhost:4242/health
{"health":"GOOD"}
$ curl -s -X POST http://localhost:4242/api/admin/projects/default/features -H "Authorization: $UNLEASH_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"name":"checkout-new-tax-engine","type":"release"}'
{"name":"checkout-new-tax-engine","type":"release","project":"default","stale":false,...}
$ curl -s http://localhost:4242/api/client/features/checkout-new-tax-engine -H "Authorization: $UNLEASH_CLIENT_TOKEN"
{"name":"checkout-new-tax-engine","type":"release","enabled":false,"stale":false,"strategies":[],"variants":[]}
```
Recorded: `UNLEASH_URL`, `UNLEASH_API_TOKEN` for the Python and Go services; frontend token for the React app via Unleash Edge.

---

## Exit Criteria

DONE when the flag exists in Unleash with the mapped type, is disabled everywhere, a backend token reads it through the Client API, and token handling is recorded by variable name only.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `/health` not GOOD or no response | **Retry**: `docker compose logs web db`; the database container is usually still starting. |
| Phase 2 | 401 or 403 from the Admin API | **Adjust**: the token is a client or frontend token; use a personal access or admin token. |
| Phase 2 | 409 conflict on create | **Stop**: the name exists (possibly archived); return to `ffr-flag-type-classify` for a new key. |
| Phase 3 | Client API returns 404 for the flag | **Adjust**: the token is scoped to another project or environment; issue one for the right scope. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
