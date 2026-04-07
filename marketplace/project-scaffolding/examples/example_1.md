# Project Scaffolding -- Setting Up a Python API Project

## Scenario

You're starting a new REST API in Python with FastAPI. You want proper structure, linting, testing, Docker, and CI from day one.

## Directory Structure (Feature-Based)

```
my-api/
  src/
    my_api/
      __init__.py
      main.py                # FastAPI app, lifespan, middleware
      config.py              # Settings from env vars (pydantic-settings)
      users/
        __init__.py
        router.py            # GET/POST/PUT/DELETE /users
        models.py            # SQLAlchemy models
        schemas.py           # Pydantic request/response schemas
        service.py           # Business logic
        repository.py        # Database queries
      orders/
        __init__.py
        router.py
        models.py
        schemas.py
        service.py
        repository.py
  tests/
    conftest.py              # Shared fixtures (test db, client)
    test_users.py
    test_orders.py
  .env.example               # Template (never commit .env)
  .gitignore
  .editorconfig
  .pre-commit-config.yaml
  pyproject.toml
  Dockerfile
  docker-compose.yml
```

## pyproject.toml

```toml
[project]
name = "my-api"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.34",
    "sqlalchemy>=2.0",
    "pydantic-settings>=2.0",
    "alembic>=1.13",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.24",
    "httpx>=0.27",           # For TestClient
    "ruff>=0.8",
    "pre-commit>=4.0",
]

[tool.ruff]
target-version = "py311"
line-length = 100
select = ["E", "F", "I", "N", "W", "UP", "B", "SIM", "RUF"]

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
```

## Docker Setup

```dockerfile
# Dockerfile
FROM python:3.11-slim AS base
WORKDIR /app
COPY pyproject.toml .
RUN pip install --no-cache-dir .

FROM base AS dev
RUN pip install --no-cache-dir ".[dev]"
COPY . .
CMD ["uvicorn", "my_api.main:app", "--host", "0.0.0.0", "--reload"]

FROM base AS prod
COPY src/ src/
CMD ["uvicorn", "my_api.main:app", "--host", "0.0.0.0", "--workers", "4"]
```

```yaml
# docker-compose.yml
services:
  api:
    build:
      context: .
      target: dev
    ports: ["8000:8000"]
    volumes: ["./src:/app/src"]    # Hot reload
    env_file: .env
    depends_on: [db]

  db:
    image: postgres:16
    environment:
      POSTGRES_DB: myapi
      POSTGRES_PASSWORD: localdev
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]

volumes:
  pgdata:
```

## Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.8.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
```

## Time to First Endpoint

From `git init` to a running API with tests, linting, and Docker: under 15 minutes. Every decision above is a default you can change later -- the point is to start with good structure, not to bikeshed on day one.
