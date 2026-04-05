# Codebase Mapper -- Mapping a FastAPI Microservice

## Scenario

A team inherits a FastAPI microservice with ~15,000 lines of Python across 80 files. No documentation exists. They need to understand the architecture before making changes.

## Input

```
repo_path: /srv/order-service
language_filter: ["python"]
depth: 4
previous_map: null
```

## OBSERVE: Scan Repository Structure

### Directory Tree
```
order-service/
├── app/
│   ├── __init__.py
│   ├── main.py                    # Entry point: FastAPI app creation
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── orders.py          # 12 endpoints
│   │   │   ├── products.py        # 8 endpoints
│   │   │   └── health.py          # 2 endpoints
│   │   ├── dependencies.py        # Auth, DB session injection
│   │   └── middleware.py          # CORS, logging, rate limiting
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py              # Pydantic settings
│   │   ├── security.py            # JWT validation, password hashing
│   │   └── exceptions.py          # Custom exception hierarchy
│   ├── models/
│   │   ├── __init__.py
│   │   ├── order.py               # SQLAlchemy Order model
│   │   ├── product.py             # SQLAlchemy Product model
│   │   └── user.py                # SQLAlchemy User model
│   ├── schemas/
│   │   ├── order.py               # Pydantic request/response schemas
│   │   ├── product.py
│   │   └── user.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── order_service.py       # Business logic for orders
│   │   ├── product_service.py     # Business logic for products
│   │   ├── payment_service.py     # Stripe integration
│   │   └── notification_service.py # Email/SMS notifications
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── order_repo.py          # DB queries for orders
│   │   └── product_repo.py        # DB queries for products
│   ├── db/
│   │   ├── __init__.py
│   │   ├── session.py             # SQLAlchemy engine + session factory
│   │   └── migrations/            # Alembic migrations (14 files)
│   └── utils/
│       ├── __init__.py
│       ├── formatting.py          # Date/currency formatting
│       ├── validators.py          # Input validation helpers
│       └── legacy_helpers.py      # Old utility functions
├── tests/                         # 45 test files
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── alembic.ini
└── Makefile
```

### Import Graph (Key Edges)
```
api/routes/orders.py   -> services/order_service.py    (8 imports)
api/routes/orders.py   -> schemas/order.py             (5 imports)
api/routes/orders.py   -> api/dependencies.py          (3 imports)
services/order_service.py -> repositories/order_repo.py (6 imports)
services/order_service.py -> services/payment_service.py (2 imports)
services/payment_service.py -> services/notification_service.py (1 import)
repositories/order_repo.py -> models/order.py          (3 imports)
repositories/order_repo.py -> db/session.py            (1 import)
api/dependencies.py    -> core/security.py             (2 imports)
core/config.py         <- (imported by 12 files)       # High fan-in
```

## REASON: Identify Architecture

### Module Map with Layers

```
┌─────────────────────────────────────────────────┐
│  PRESENTATION LAYER                              │
│  ┌───────────┐ ┌────────────┐ ┌──────────────┐  │
│  │ api/routes │ │ api/middle │ │  api/deps    │  │
│  │ (22 endpt) │ │  ware      │ │              │  │
│  └─────┬──────┘ └────────────┘ └──────┬───────┘  │
│        │                              │          │
├────────┼──────────────────────────────┼──────────┤
│  APPLICATION LAYER                    │          │
│  ┌─────┴──────┐  ┌──────────────┐    │          │
│  │  services/  │  │   schemas/   │    │          │
│  │ (4 services)│  │ (3 schemas)  │    │          │
│  └─────┬──────┘  └──────────────┘    │          │
│        │                              │          │
├────────┼──────────────────────────────┼──────────┤
│  DOMAIN LAYER                         │          │
│  ┌─────┴──────┐                       │          │
│  │   models/   │                      │          │
│  │ (3 models)  │                      │          │
│  └─────┬──────┘                       │          │
│        │                              │          │
├────────┼──────────────────────────────┼──────────┤
│  INFRASTRUCTURE LAYER                 │          │
│  ┌─────┴──────┐  ┌──────────────┐    │          │
│  │ reposito-  │  │    db/       │    │          │
│  │   ries/    │  │ (session +   │    │          │
│  │            │  │  migrations) │    │          │
│  └────────────┘  └──────────────┘    │          │
│                                       │          │
├───────────────────────────────────────┼──────────┤
│  CROSS-CUTTING                        │          │
│  ┌────────────┐  ┌──────────────┐    │          │
│  │   core/    │──┤    utils/    │◄───┘          │
│  │ (config,   │  │ (formatting, │               │
│  │  security) │  │  validators) │               │
│  └────────────┘  └──────────────┘               │
└─────────────────────────────────────────────────┘
```

### Coupling Metrics

| Module | Ca (in) | Ce (out) | Instability | Layer |
|---|---|---|---|---|
| core/ | 12 | 1 | 0.08 | Cross-cutting |
| models/ | 6 | 1 | 0.14 | Domain |
| schemas/ | 5 | 2 | 0.29 | Application |
| repositories/ | 4 | 3 | 0.43 | Infrastructure |
| services/ | 5 | 4 | 0.44 | Application |
| api/routes/ | 0 | 5 | 1.00 | Presentation |
| utils/ | 3 | 0 | 0.00 | Cross-cutting |

Architecture follows Clean Architecture well: domain modules are stable (low I), presentation is unstable (high I, free to change).

### Dead Code Detection

| File | Confidence | Reason |
|---|---|---|
| `utils/legacy_helpers.py` | HIGH | Zero fan-in, not an entry point, 340 lines |
| `schemas/user.py` | MEDIUM | Only imported in test files (2 references) |

### Tech Stack

| Category | Detected |
|---|---|
| Language | Python 3.11 |
| Framework | FastAPI 0.104 |
| ORM | SQLAlchemy 2.0 |
| Migrations | Alembic |
| Auth | JWT (python-jose) |
| Payments | Stripe (stripe-python) |
| Database | PostgreSQL (asyncpg) |
| Container | Docker + docker-compose |
| Build | Make |

## ACT: Deliver Architecture Map

### Summary

This is a well-structured FastAPI microservice following Clean Architecture patterns. Dependencies flow inward correctly (routes -> services -> repositories -> models). The codebase has strong separation of concerns across 8 modules.

### Top 3 Strengths
1. Clean dependency direction -- no layer violations detected
2. Repository pattern properly isolates database access
3. Pydantic schemas separate API contracts from domain models

### Top 3 Risks
1. **Dead code**: `utils/legacy_helpers.py` (340 lines) has zero references -- safe to remove
2. **Service coupling**: `payment_service` directly calls `notification_service` -- consider event-based decoupling for independent scaling
3. **Missing tests**: `repositories/` has no dedicated test directory -- DB query logic is only tested indirectly through service tests

### Actionable Recommendations
- Delete `utils/legacy_helpers.py` (HIGH confidence dead code)
- Investigate `schemas/user.py` -- if only used in tests, the User API may be incomplete or abandoned
- Add repository-level unit tests with an in-memory database
- Extract payment -> notification coupling into an event/callback pattern

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
