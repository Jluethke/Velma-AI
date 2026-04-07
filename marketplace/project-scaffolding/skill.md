# Project Scaffolding

Set up new projects from scratch by gathering requirements, designing directory structure, generating project files and configurations, validating the build, and producing documentation.

## Execution Pattern: Phase Pipeline

```
PHASE 1: REQUIREMENTS  --> Language, framework, deployment target, team size
PHASE 2: STRUCTURE     --> Directory layout, essential files, monorepo decision
PHASE 3: SCAFFOLD      --> Generate project files, configs, CI, Docker
PHASE 4: VALIDATE      --> Build check, lint passes, tests run, Docker builds
PHASE 5: DOCUMENT      --> Generate README, contributing guide, ADR template
```

## Inputs

- `language`: string -- Primary programming language (Python, TypeScript, Rust, Go, etc.)
- `framework`: string -- Framework choice (FastAPI, React, Gin, Actix, etc.)
- `deploy_target`: string -- Where the app will run (AWS, Vercel, K8s, bare metal, etc.)
- `team_size`: string -- Number of developers (solo, small team, large org)
- `task_description`: string -- Specific scaffolding need or general project setup request

## Outputs

- `project_files`: object -- All generated project files (configs, source stubs, .gitignore, etc.)
- `ci_config`: string -- CI/CD configuration file (GitHub Actions, GitLab CI, etc.)
- `docker_config`: string -- Dockerfile and docker-compose.yml (if applicable)
- `documentation`: string -- README.md, CONTRIBUTING.md, and ADR template

---

## Execution

### Phase 1: REQUIREMENTS -- Gather Project Requirements

**Entry criteria:** A new project needs to be set up.

**Actions:**
1. Identify the primary language and version requirement
2. Identify the framework and its project conventions
3. Determine the deployment target and its requirements
4. Assess team size for tooling decisions:
   - Solo/small: simpler tooling, fewer conventions
   - Large team: stricter linting, conventional commits, CODEOWNERS, ADRs
5. Determine project type: library, CLI tool, web app, API service, microservice
6. Determine monorepo vs polyrepo (see Reference: Monorepo vs Polyrepo)
7. Identify required external services (database, cache, message queue)
8. Determine testing requirements (unit, integration, E2E)
9. Determine CI/CD requirements (which CI system, deployment strategy)

**Output:** Requirements document listing language, framework, deploy target, team size, project type, repo structure, services, and testing/CI needs.

**Quality gate:** Language and framework are specified. Deploy target is known. Monorepo/polyrepo decision is made.

---

### Phase 2: STRUCTURE -- Design Directory Layout

**Entry criteria:** Requirements are complete.

**Actions:**
1. Choose directory structure pattern (see Reference: Directory Structure Patterns):
   - **Feature-based** (recommended for most projects): each feature is a self-contained directory
   - **Layer-based** (simpler, for small projects): routes/, services/, models/ flat structure
   - **Domain-driven** (for complex business logic): domain/, infrastructure/, application/ separation
2. For monorepos: design the workspace structure (see Reference: Monorepo Structure)
   - apps/ for deployable applications
   - packages/ for shared libraries
   - tools/ for scripts
3. Plan essential files for day one (see Reference: Essential Project Files):
   - README.md, LICENSE, .gitignore, .editorconfig, .env.example
4. Plan the build configuration file (see Reference: Build Configuration):
   - Python: pyproject.toml
   - JS/TS: package.json + tsconfig.json
   - Rust: Cargo.toml
   - Go: go.mod
5. Plan linting and formatting setup (see Reference: Linting and Formatting)
6. Plan git configuration (see Reference: Git Setup):
   - Branch strategy (trunk-based or gitflow)
   - Conventional commits
   - Pre-commit hooks

**Output:** Directory structure diagram with all planned files and their purposes.

**Quality gate:** Directory structure follows the chosen pattern. All essential files are planned. Build configuration matches the language/framework.

---

### Phase 3: SCAFFOLD -- Generate Project Files

**Entry criteria:** Directory structure is designed.

**Actions:**
1. Generate the build configuration (see Reference: Build Configuration):
   - Python: pyproject.toml with dependencies, dev dependencies, tool config
   - JS/TS: package.json with scripts, dependencies, engines
   - Rust: Cargo.toml with dependencies, profile settings
   - Go: go.mod with module name and dependencies
2. Generate .gitignore with language + IDE + OS rules (see Reference: .gitignore Essentials)
3. Generate .editorconfig for consistent formatting (see Reference: .editorconfig)
4. Generate linter and formatter configuration (see Reference: Linting and Formatting)
5. Generate pre-commit hook configuration (see Reference: Pre-commit Hooks)
6. Generate testing setup (see Reference: Testing Setup):
   - Test runner configuration
   - Coverage configuration
   - At least one passing test
7. Generate CI/CD configuration (GitHub Actions, GitLab CI, etc.):
   - Lint, test, build, deploy stages
   - Caching for dependencies
   - Coverage reporting
8. Generate Docker files if applicable (see Reference: Docker):
   - Multi-stage Dockerfile (dev + prod stages)
   - docker-compose.yml for local development
   - .dockerignore
9. Generate environment management files (see Reference: Environment Management):
   - .env.example with all variables documented
   - Environment validation code
10. Generate source code stubs:
    - Entry point file
    - Config/settings module
    - Health check endpoint (for services)
11. Select language-specific starter template (see Reference: Language-Specific Starters)

**Output:** Complete set of project files ready to commit.

**Quality gate:** All planned files from Phase 2 are generated. Build configuration includes both production and dev dependencies. .env.example documents every variable. At least one test exists.

---

### Phase 4: VALIDATE -- Build Check

**Entry criteria:** All project files are generated.

**Actions:**
1. Verify the project builds:
   - `pip install -e .` / `npm ci` / `cargo build` / `go build`
2. Verify the linter passes:
   - `ruff check .` / `eslint .` / `cargo clippy` / `golangci-lint run`
3. Verify the formatter passes:
   - `ruff format --check .` / `prettier --check .` / `cargo fmt --check` / `gofmt -l .`
4. Verify tests run and pass:
   - `pytest` / `vitest` / `cargo test` / `go test ./...`
5. Verify Docker builds (if applicable):
   - `docker build .` completes without errors
   - Container starts and serves health check
6. Verify pre-commit hooks install and run:
   - `pre-commit install && pre-commit run --all-files`
7. Verify .env.example documents all required variables
8. Check for security basics:
   - .env is in .gitignore
   - Docker runs as non-root
   - No secrets in generated files

**Output:** Validation report listing pass/fail status for each check.

**Quality gate:** Build succeeds. Linter passes. Formatter passes. Tests pass. Docker builds (if applicable). No secrets in committed files.

---

### Phase 5: DOCUMENT -- Generate Documentation

**Entry criteria:** Validation passes on all checks.

**Actions:**
1. Generate README.md following the template (see Reference: README Template from technical-writing):
   - Project name and one-line description
   - Install command
   - Quick start (3-5 lines of code that do something useful)
   - Features list
   - Configuration (env vars with descriptions)
   - Development setup (how to run locally)
   - Testing instructions
   - License
2. Generate CONTRIBUTING.md:
   - How to set up the development environment
   - How to run tests
   - Branch naming convention
   - Commit message format (conventional commits)
   - PR process
3. Generate an ADR (Architecture Decision Record) template (if team_size > 3):
   - ADR-001: initial technology choices with rationale
4. Generate LICENSE file (MIT for open source, proprietary for business)
5. Verify the Quick Decision Checklist (see Reference: Quick Decision Checklist)

**Output:** Complete documentation files ready to commit alongside the project.

**Quality gate:** README has install, quick start, and test instructions. CONTRIBUTING has dev setup and PR process. All documentation follows the project's chosen conventions.

---

## Exit Criteria

The skill is DONE when:
- Project builds, lints, formats, and tests pass from a clean checkout
- CI pipeline is configured with lint -> test -> build stages
- Docker setup works (if applicable)
- README has install, quick start, and test instructions
- .env.example documents all required environment variables
- Pre-commit hooks are configured and passing
- The project is ready for a developer to clone and start working immediately

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| REQUIREMENTS | Language or framework not specified | **Escalate** -- ask user for technology choices |
| REQUIREMENTS | Deploy target unknown | **Adjust** -- scaffold without Docker/deploy config, add TODO |
| STRUCTURE | Monorepo vs polyrepo unclear | **Adjust** -- default to single repo, note that monorepo can be adopted later |
| SCAFFOLD | Framework has no standard project template | **Adjust** -- use the language's standard layout, add framework-specific files manually |
| SCAFFOLD | Cannot determine correct dependency versions | **Adjust** -- use latest stable versions with compatible range pinning |
| VALIDATE | Build fails due to system dependency | **Adjust** -- add installation instructions to README prerequisites |
| VALIDATE | Linter has too many rules for the team's taste | **Adjust** -- start with recommended ruleset, note how to customize |
| DOCUMENT | Project is too early for full documentation | **Adjust** -- generate minimal README with install and run, add TODO for expanded docs |

## State Persistence

Between runs, this skill saves:
- **Technology choices**: language, framework, tooling decisions and rationale
- **Directory structure**: chosen layout pattern for consistency across related projects
- **Configuration templates**: reusable configs for the same tech stack
- **Validation baseline**: what checks must pass for this project type

---

## Reference

### Monorepo vs Polyrepo

#### Decision Matrix

| Factor | Monorepo | Polyrepo |
|--------|----------|----------|
| Team size | < 50 devs or strong tooling team | Any size |
| Shared code | Lots of shared libraries/types | Little sharing |
| Deploy coupling | Services deploy together | Services deploy independently |
| CI complexity | Need custom build system | Standard CI per repo |
| Code discovery | Easy (everything in one place) | Harder (search across repos) |
| Access control | Harder (CODEOWNERS, path-based) | Easy (repo-level permissions) |

#### Recommendation

```
Starting a new company/project -> Monorepo (simplicity wins early)
Microservices with separate teams -> Polyrepo (independence wins at scale)
Monorepo + poor tooling -> Pain (invest in Nx, Turborepo, or Bazel first)
```

#### Monorepo Structure

```
my-company/
  apps/
    web/           # React frontend
    api/           # Backend API
    worker/        # Background job processor
  packages/
    shared-types/  # TypeScript types shared across apps
    ui-kit/        # Shared React components
    utils/         # Shared utility functions
  tools/
    scripts/       # Build/deploy/migration scripts
  package.json     # Root workspace config
  turbo.json       # Turborepo config
```

---

### Directory Structure Patterns

#### Feature-Based (Recommended for Most Projects)

```
src/
  users/
    router.py       # HTTP routes
    service.py       # Business logic
    repository.py    # Data access
    models.py        # Database models
    schemas.py       # Validation schemas
    tests/
      test_service.py
      test_router.py
  orders/
    router.py
    service.py
    ...
  shared/
    auth.py
    database.py
    config.py
```

Why: Adding a new feature means creating one new directory. Deleting a feature means deleting one directory. Each feature is self-contained.

#### Layer-Based (Simpler, for Small Projects)

```
src/
  routes/
    users.py
    orders.py
  services/
    user_service.py
    order_service.py
  models/
    user.py
    order.py
  tests/
    test_users.py
    test_orders.py
```

Why: Simple mental model. Works for <10 files per layer. Breaks down when layers get large.

#### Domain-Driven (For Complex Business Logic)

```
src/
  domain/
    user/
      aggregate.py
      value_objects.py
      events.py
      repository.py  # Interface only
    order/
      aggregate.py
      value_objects.py
      events.py
      repository.py
  infrastructure/
    persistence/
      user_repo_postgres.py  # Implementation
      order_repo_postgres.py
    messaging/
      event_bus_redis.py
  application/
    commands/
      create_user.py
      place_order.py
    queries/
      get_user.py
```

Why: Business logic has zero dependencies on infrastructure. Swap PostgreSQL for DynamoDB by replacing one file. Overkill for CRUD apps.

---

### Essential Project Files

#### Every Project Needs These on Day One

```
README.md          What it does, how to install, how to run
LICENSE            MIT for open source, proprietary for business
.gitignore         Language-specific + IDE-specific + OS-specific
.editorconfig      Consistent indentation across all editors
.env.example       Template for environment variables (never commit .env)
```

#### .editorconfig (Universal)

```ini
root = true

[*]
indent_style = space
indent_size = 4
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.{js,ts,jsx,tsx,json,yml,yaml}]
indent_size = 2

[Makefile]
indent_style = tab
```

#### .gitignore Essentials

```gitignore
# Dependencies
node_modules/
__pycache__/
*.pyc
target/
vendor/

# Environment
.env
.env.local
.env.*.local

# Build output
dist/
build/
*.egg-info/

# IDE
.idea/
.vscode/
*.swp
*.swo
.DS_Store
Thumbs.db

# Test/coverage
coverage/
htmlcov/
.pytest_cache/
.coverage
```

---

### Build Configuration

#### Python (pyproject.toml)

```toml
[project]
name = "my-project"
version = "0.1.0"
description = "One-sentence description"
requires-python = ">=3.11"
license = {text = "MIT"}
dependencies = [
    "fastapi>=0.115",
    "httpx>=0.27",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "ruff>=0.8",
    "pre-commit>=4.0",
    "mypy>=1.13",
]

[project.scripts]
my-project = "my_project.main:main"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.ruff]
target-version = "py311"
line-length = 100
select = ["E", "F", "I", "N", "W", "UP", "B", "SIM", "RUF"]

[tool.mypy]
python_version = "3.11"
strict = true

[tool.pytest.ini_options]
testpaths = ["tests"]
```

#### JavaScript/TypeScript (package.json)

```json
{
  "name": "my-project",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint . --fix",
    "format": "prettier --write .",
    "check": "tsc --noEmit",
    "prepare": "husky"
  },
  "engines": {
    "node": ">=20"
  }
}
```

#### Rust (Cargo.toml)

```toml
[package]
name = "my-project"
version = "0.1.0"
edition = "2024"
rust-version = "1.85"
description = "One-sentence description"
license = "MIT"

[dependencies]
serde = { version = "1", features = ["derive"] }
tokio = { version = "1", features = ["full"] }

[dev-dependencies]
assert_cmd = "2"
predicates = "3"

[profile.release]
lto = true
strip = true
```

#### Go (go.mod)

```
module github.com/username/my-project

go 1.23

require (
    github.com/gin-gonic/gin v1.10.0
)
```

---

### Linting and Formatting

#### Setup by Language

| Language | Linter | Formatter | Config |
|----------|--------|-----------|--------|
| Python | Ruff | Ruff format | pyproject.toml |
| JavaScript | ESLint | Prettier | eslint.config.js + .prettierrc |
| TypeScript | ESLint + typescript-eslint | Prettier | eslint.config.js |
| Rust | clippy | rustfmt | rustfmt.toml |
| Go | golangci-lint | gofmt | .golangci.yml |

#### Rule: Autofix on Save, Block on CI

```
Local: Editor runs formatter on save (zero effort)
Pre-commit: Linter runs with --fix on staged files (catch before push)
CI: Linter runs without --fix (fail the build on violations)
```

---

### Git Setup

#### Branch Strategy

```
TRUNK-BASED (recommended for most teams):
  main (always deployable)
  +-- feature/add-user-search (short-lived, <2 days)
  +-- feature/update-pricing (short-lived, <2 days)

GITFLOW (for packaged software with versions):
  main (production releases)
  +-- develop (integration branch)
      +-- feature/xyz (from develop)
  +-- release/1.2.0 (stabilization)
  +-- hotfix/fix-crash (from main)
```

#### Conventional Commits

```
Format: <type>(<scope>): <description>

Types:
  feat:     New feature
  fix:      Bug fix
  docs:     Documentation only
  style:    Formatting, no code change
  refactor: Code change that neither fixes a bug nor adds a feature
  perf:     Performance improvement
  test:     Adding or fixing tests
  chore:    Build, CI, dependencies

Examples:
  feat(auth): add JWT refresh token rotation
  fix(orders): prevent negative quantities in cart
  docs(api): add rate limiting section to API reference
  refactor(users): extract validation into shared module
```

#### Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
        args: ['--maxkb=500']
      - id: detect-private-key
      - id: check-merge-conflict

  # Add language-specific hooks below (Ruff, ESLint, etc.)
```

---

### Testing Setup

#### Test Runner Configuration

```
Python:     pytest (with pytest-cov, pytest-asyncio)
JavaScript: Vitest (fast, ESM-native, Vite-compatible)
TypeScript: Vitest (same)
Rust:       cargo test (built-in)
Go:         go test (built-in)
```

#### Coverage Configuration

```toml
# Python: pyproject.toml
[tool.coverage.run]
source = ["src"]
omit = ["*/tests/*", "*/migrations/*"]

[tool.coverage.report]
fail_under = 80
show_missing = true
```

```json
// JavaScript: vitest.config.ts
{
  "test": {
    "coverage": {
      "provider": "v8",
      "include": ["src/**"],
      "exclude": ["src/**/*.test.ts", "src/**/*.d.ts"],
      "thresholds": { "lines": 80 }
    }
  }
}
```

#### CI Test Integration

```yaml
# GitHub Actions
- name: Test
  run: |
    pytest --cov --cov-report=xml
    # or: npx vitest --coverage

- name: Upload coverage
  uses: codecov/codecov-action@v4
  with:
    file: coverage.xml
```

---

### Docker

#### Development Dockerfile (Multi-Stage)

```dockerfile
# Stage 1: Base with dependencies
FROM python:3.11-slim AS base
WORKDIR /app
COPY pyproject.toml .
RUN pip install --no-cache-dir -e ".[dev]"

# Stage 2: Development (includes dev tools, hot reload)
FROM base AS dev
COPY . .
CMD ["uvicorn", "my_app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Stage 3: Production (minimal, no dev tools)
FROM python:3.11-slim AS prod
WORKDIR /app
COPY pyproject.toml .
RUN pip install --no-cache-dir .
COPY src/ src/
RUN useradd -r appuser && chown -R appuser /app
USER appuser
EXPOSE 8000
CMD ["uvicorn", "my_app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

#### docker-compose.yml for Local Dev

```yaml
services:
  app:
    build:
      context: .
      target: dev
    ports:
      - "8000:8000"
    volumes:
      - ./src:/app/src          # Hot reload
    env_file: .env
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: devpass
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dev"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

#### .dockerignore

```
.git
.env
node_modules
__pycache__
*.pyc
.pytest_cache
coverage/
dist/
.idea/
.vscode/
```

---

### Environment Management

#### .env.example Template

```bash
# Application
APP_ENV=development          # development | staging | production
APP_PORT=8000
APP_SECRET_KEY=              # Generate: openssl rand -hex 32
APP_DEBUG=true

# Database
DATABASE_URL=postgresql://dev:devpass@localhost:5432/myapp

# Redis
REDIS_URL=redis://localhost:6379/0

# External APIs
STRIPE_SECRET_KEY=           # Get from Stripe dashboard
SENDGRID_API_KEY=            # Get from SendGrid settings

# Monitoring (optional in dev)
SENTRY_DSN=
```

#### Rules

```
1. NEVER commit .env (it has real secrets)
2. ALWAYS commit .env.example (it's the template)
3. Document EVERY variable in .env.example (including where to get the value)
4. Use sensible defaults in code (so the app starts with minimal config)
5. Validate env vars at startup (fail fast with clear error messages)
```

#### Environment Validation (Python)

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_env: str = "development"
    app_port: int = 8000
    app_secret_key: str           # Required, no default -> fails if missing
    database_url: str
    redis_url: str = "redis://localhost:6379/0"
    debug: bool = False

    model_config = {"env_file": ".env"}

settings = Settings()  # Raises ValidationError with clear message if misconfigured
```

---

### Dependency Management

#### Lock Files

```
ALWAYS commit lock files:
  Python:     uv.lock or poetry.lock
  JavaScript: package-lock.json or pnpm-lock.yaml
  Rust:       Cargo.lock (for binaries; optional for libraries)
  Go:         go.sum

WHY: Without a lock file, `pip install` on two machines can install
different versions. Lock files ensure reproducible builds.
```

#### Version Pinning Strategy

```
Direct dependencies:  Pin to compatible range
  "fastapi>=0.115,<1.0"     # Accept patches and minors
  "react": "^19.0.0"        # Accept patches and minors

Transitive dependencies: Let the lock file handle it

Dev dependencies: Pin less strictly (breaking changes matter less)
  "pytest>=8.0"
  "ruff>=0.8"
```

#### Security Scanning

```bash
# Check for known vulnerabilities in dependencies
pip-audit                    # Python
npm audit                    # JavaScript
cargo audit                  # Rust
govulncheck ./...            # Go

# Run in CI on every PR
# Run weekly on main branch (new CVEs are published constantly)
```

---

### Language-Specific Starters

#### React (Vite + TypeScript)

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm install -D eslint @typescript-eslint/eslint-plugin prettier eslint-config-prettier
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

#### Python (uv)

```bash
uv init my-project
cd my-project
uv add fastapi uvicorn
uv add --dev pytest ruff mypy pre-commit
uv run pre-commit install
```

#### Rust

```bash
cargo init my-project
cd my-project
cargo add serde --features derive
cargo add tokio --features full
# Linting/formatting built-in: cargo clippy, cargo fmt
```

#### Go

```bash
mkdir my-project && cd my-project
go mod init github.com/username/my-project
go get github.com/gin-gonic/gin
# Testing/formatting built-in: go test, gofmt
# Linting: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
```

---

### Quick Decision Checklist

```
Starting a new project? Run through this in 5 minutes:

[ ] Language and framework chosen
[ ] Directory structure: feature-based or layer-based?
[ ] git init + .gitignore + .editorconfig
[ ] Package manager + lock file
[ ] Linter + formatter configured and running on save
[ ] Pre-commit hooks installed
[ ] At least one test + test runner configured
[ ] .env.example with all needed variables
[ ] README with: what, install, run, test
[ ] CI pipeline: lint + test + build
[ ] Docker: dev container with hot reload (if needed)
[ ] LICENSE file
```
