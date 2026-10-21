# Docker Compose for Local Development

**One-line description:** Writes a `compose.yaml` that builds the app from its Dockerfile (dev target), starts backing services such as PostgreSQL or Redis with their own healthchecks, orders startup with `depends_on: condition: service_healthy`, syncs code with `develop.watch`, and validates everything with `docker compose config` and `docker compose up --wait`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Repository root where `compose.yaml` is written.
- `image_name` (string, required): Name for the built app image.
- `build_profile` (object, required): From `ctr-stack-inventory`; supplies port, entrypoint and test command.
- `compose_services` (string[], optional): Backing services the app needs, for example `postgres`, `redis`. Empty means find them in Phase 1.
- `app_port` (string, optional): Port the app listens on inside the container.

---

## Outputs

- `compose_file` (object): Path to `compose.yaml`, the services defined with pinned images, the env file used, the watch rules, and the outputs of `docker compose config` and `docker compose ps`.

---

## Phase 1: Determine Services and Config

### Entry Criteria
- `docker compose version` prints v2 (the `docker compose` plugin, not the old `docker-compose` binary).

### Actions
1. If `compose_services` is empty, find services from the app's config: `grep -rnE "DATABASE_URL|POSTGRES|MYSQL|REDIS_URL|AMQP|KAFKA|MONGO" <project_dir> --include=*.{py,js,ts,go,java,properties,yml,yaml,toml,env.example}`. List each with the env var that points to it.
2. If a `compose.yaml` or `docker-compose.yml` already exists, read it fully. Extend it; do not create a second file with a different name.
3. Choose service images that match production versions when the user knows them (ask). Pin each by digest using `ctr-pin-base-digest` Phase 1, for example `postgres:16-bookworm@sha256:<digest>`.
4. Variables: Compose reads `.env` in the project directory for `${VAR}` interpolation in `compose.yaml`; `env_file:` sets variables inside a container. They are different mechanisms. Put developer defaults in `.env.example` (committed) and tell the developer to copy it to `.env` (ignored by git and by `.dockerignore`).

### Output
Service list with pinned images and the variable plan.

### Quality Gate
- Every service maps to an env var found in the repo, with file and line.
- Every service image has `@sha256:`.

---

## Phase 2: Write compose.yaml

### Entry Criteria
- Phase 1 complete.

### Actions
1. Add a `dev` target to the Dockerfile only if live reload needs dev dependencies; otherwise build the normal target. Write:
```
services:
  app:
    build:
      context: .
      target: <dev or runtime>
    image: <image_name>:compose
    ports:
      - "127.0.0.1:<app_port>:<app_port>"
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
    develop:
      watch:
        - action: sync
          path: ./src
          target: /app/src
        - action: rebuild
          path: <lockfile>
  db:
    image: postgres:16-bookworm@sha256:<digest>
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?set in .env}
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
volumes:
  db-data:
```
2. Service healthchecks by image: PostgreSQL `pg_isready -U <user>`; MySQL `mysqladmin ping -h 127.0.0.1`; Redis `redis-cli ping`; RabbitMQ `rabbitmq-diagnostics -q ping`. Leave interval and retries at Compose defaults unless the user supplies values.
3. `depends_on` without `condition: service_healthy` only waits for the container to start, not to be ready. Always use the condition when the dependency has a healthcheck.
4. Bind ports to `127.0.0.1` so dev databases are not exposed on the network.
5. `develop.watch` needs Compose 2.22 or later and the target path must be writable by the container user. Use `sync` for interpreted source, `rebuild` for lockfile and Dockerfile changes, `sync+restart` for config files.
6. Do NOT commit real passwords. The `${VAR:?message}` form makes Compose fail loudly when the variable is missing.

### Output
`compose.yaml` and `.env.example`.

### Quality Gate
- `docker compose config --quiet` exits 0.
- `git check-ignore .env` prints `.env`.

---

## Phase 3: Bring It Up and Verify

### Entry Criteria
- Config validates.

### Actions
1. `docker compose up --build --wait`. `--wait` returns after services are running and healthy, and exits non-zero if one fails.
2. `docker compose ps` must show each service `running` and `(healthy)` where a healthcheck exists.
3. Call the app: `curl -fsS http://127.0.0.1:<app_port><health path>`.
4. Run integration tests the image build could not run (see `ctr-test-in-image`): `docker compose run --rm app <integration test command from the repo>`.
5. Test watch: run `docker compose watch` in another terminal, change a source file, and confirm the log shows a sync and the change takes effect.
6. Tear down with `docker compose down`. Do NOT add `-v` unless you intend to delete the database volume; `-v` removes named volumes.

### Output
`compose_file` with verification output.

### Quality Gate
- `docker compose up --wait` exit code 0 and `docker compose ps` output pasted.
- Integration test summary line pasted, or "no integration tests in repo".

---

## Worked Example

Illustrative. `orders-api`, port 8000, `DATABASE_URL` in `orders/settings.py:12`.

Phase 1: services `db` (PostgreSQL 16, matches production per user). Digest resolved. `.env.example` has `POSTGRES_PASSWORD=devonly` and `DATABASE_URL=postgresql://postgres:devonly@db:5432/postgres`.

Phase 2: compose as above; `docker compose config --quiet` exits 0.

Phase 3: `docker compose up --build --wait` prints `Container orders-api-db-1 Healthy` and `Container orders-api-app-1 Healthy`. `uv run pytest -m integration -q` via `docker compose run --rm app` prints `12 passed`. Watch log: `Syncing "app" after changes were detected`.

---

## Exit Criteria

DONE when `compose.yaml` validates, all services start healthy in dependency order with pinned images, integration tests run against them, and code sync works.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Only `docker-compose` v1 available | **Stop**: Compose v2 is required for `--wait` and `develop`; install the plugin. |
| Phase 2 | `required variable POSTGRES_PASSWORD is missing` | **Adjust**: copy `.env.example` to `.env`; never put the value in `compose.yaml`. |
| Phase 3 | App starts before DB is ready and crashes | **Adjust**: add the healthcheck and `condition: service_healthy`, rerun. |
| Phase 3 | Watch sync fails with permission denied | **Adjust**: the target path is not owned by the container user; fix ownership in the dev target. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
