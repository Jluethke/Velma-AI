# Problem Decomposer -- Migrating a Monolith to Microservices

## Scenario

A fintech company has a 500K-line Python monolith serving 50K users. Deployments take 4 hours, the test suite takes 90 minutes, and a bug in the notification system caused a 6-hour outage in the payment processor last month. The CTO says "we need to move to microservices." Team: 12 engineers, 2 SREs.

## Phase 1: CAPTURE

**5 Whys:**
```
Problem: "We need to move to microservices."
Why? -> Deployments are too slow and risky (4 hours, high blast radius)
Why? -> Everything is coupled -- a notification bug took down payments
Why? -> No module boundaries -- payment, notification, user management share database tables and code
Why? -> The system was built by 2 people over 4 years without architectural planning
Why? -> There was no architectural ownership until the team grew to 12
```

Root cause: Lack of module boundaries, not "monolith vs microservices." The solution is bounded contexts -- which microservices provide, but so does a well-structured modular monolith.

**First principles check:**
- Assumption: "Microservices will fix our deployment problems." Challenge: a modular monolith with feature flags can also deploy independently. Microservices add distributed systems complexity (network failures, data consistency, observability).
- Fundamental truth: We need independent deployability and fault isolation.
- The real requirement is *bounded contexts with independent deployment*, not necessarily microservices.

**Scope:**
- In scope: Decomposing the monolith into independently deployable units with fault isolation
- Out of scope: Rewriting in a different language, changing cloud providers, hiring
- Boundary: The API contract with mobile clients must not break

**Success criteria:**
1. Deployment time < 30 minutes per service
2. A failure in any non-payment component does not affect payment processing
3. Test suite per service runs in < 10 minutes
4. Zero downtime during migration (incremental, not big-bang)

**Problem type:** Convergent (one right answer for our context) with wicked elements (requirements will shift as we learn during migration).

## Phase 2: DECOMPOSE (MECE)

Framework: By component (structural decomposition of the monolith).

```
Migrate Monolith to Bounded Services
├── A. Domain Boundary Identification (20%)
│   ├── A1. Map current module dependencies (code analysis)
│   ├── A2. Identify bounded contexts (DDD aggregate mapping)
│   └── A3. Define service contracts (API boundaries)
│
├── B. Data Decomposition (30%)
│   ├── B1. Map shared database tables to owning services
│   ├── B2. Design cross-service data access patterns (API vs event)
│   ├── B3. Implement data migration strategy per service
│   └── B4. Handle distributed transactions (saga pattern)
│
├── C. Infrastructure Preparation (15%)
│   ├── C1. Set up service mesh / API gateway
│   ├── C2. Implement distributed tracing and observability
│   ├── C3. Set up per-service CI/CD pipelines
│   └── C4. Design deployment strategy (blue-green, canary)
│
├── D. Incremental Extraction (25%)
│   ├── D1. Extract first service (lowest-risk: notifications)
│   ├── D2. Extract second service (medium-risk: user management)
│   ├── D3. Extract third service (high-risk: payment processing)
│   └── D4. Decommission monolith shared code
│
└── E. Validation and Hardening (10%)
    ├── E1. Chaos testing (fault injection in each service)
    ├── E2. Performance benchmarking (latency, throughput)
    └── E3. Runbook creation for each service
```

**MECE validation:**
- Mutual exclusivity: A (design), B (data), C (infra), D (extraction), E (validation) -- no overlap. Each addresses a different concern.
- Collective exhaustiveness: If A-E are all complete, the monolith is decomposed into independently deployable services with proper data boundaries, infrastructure, and validation. Confirmed: covers the entire original problem.

## Phase 3: SEQUENCE

**Dependency graph:**
```
A1 ──> A2 ──> A3 ──────────> D1 ──> D2 ──> D3 ──> D4
                              │                      │
B1 ──> B2 ──> B3 ────────────┘      │                │
       └──> B4 ──────────────────────┘                │
                                                      v
C1 ──────────────────> D1                            E1
C2 ──────────────────> D1                            E2
C3 ──────────────────> D1                            E3
C4 ──────────────────> D1
```

**Critical path:** A1 (2w) -> A2 (2w) -> A3 (1w) -> D1 (3w) -> D2 (4w) -> D3 (6w) -> D4 (2w) -> E1-E3 (2w) = **22 weeks**

**Parallel work:**
- B1-B4 can run parallel to A1-A3 (different team members)
- C1-C4 can run parallel to A and B (SRE team)
- E1-E3 can partially overlap with D4

**Bottleneck:** D3 (extract payment processing) is 6 weeks, requires senior engineers, sits on the critical path, and has the highest risk. This is the task that deserves the most attention.

## Phase 4: PLAN

| Phase | Tasks | Duration | Team | Milestone |
|---|---|---|---|---|
| Phase 1: Design (weeks 1-5) | A1, A2, A3, B1, B2 | 5 weeks | 4 engineers | Service boundaries defined, data ownership mapped |
| Phase 2: Infrastructure (weeks 3-7) | C1, C2, C3, C4, B3, B4 | 5 weeks | 2 SREs + 2 engineers | Infra ready for first service extraction |
| Phase 3: Extract notifications (weeks 6-8) | D1 | 3 weeks | 2 engineers | First service running independently |
| Phase 4: Extract user mgmt (weeks 9-12) | D2 | 4 weeks | 3 engineers | Second service live, monolith shrinking |
| Phase 5: Extract payments (weeks 13-18) | D3 | 6 weeks | 4 engineers + 1 SRE | Highest-risk extraction complete |
| Phase 6: Cleanup + validate (weeks 19-22) | D4, E1, E2, E3 | 4 weeks | Full team | Monolith decommissioned, chaos tests pass |

**Worst case:** 22 weeks * 1.5 = 33 weeks (if payment extraction hits distributed transaction problems).

**Critical path risk:** D3 (payment extraction). Pre-mortem: "We extracted payments but the saga pattern had a bug that caused double-charges. Rollback required re-coupling payments to the monolith for 4 weeks while we fixed it." Mitigation: Run payment service in shadow mode (dual-write to both old and new) for 2 weeks before cutover.

## Phase 5: VALIDATE

**Completeness check:**
| Success Criterion | Mapped Sub-problems | Covered? |
|---|---|---|
| Deployment < 30 min | C3, C4 | Yes |
| Fault isolation (payment safe) | A2, A3, D3, E1 | Yes |
| Test suite < 10 min per service | C3 (per-service CI/CD) | Yes |
| Zero downtime migration | C4 (blue-green), D1-D3 (incremental) | Yes |

All criteria covered. No gaps.

**Assumptions documented:**
1. Current engineers can learn service mesh and distributed tracing (2-week ramp-up)
2. The database can be partitioned without major schema redesign
3. Mobile clients can handle API versioning during migration
4. Business will tolerate a 22-week timeline (33 weeks worst case)

Each assumption is a risk. Assumption #2 is the most dangerous -- shared tables with cross-domain joins may resist clean decomposition.
