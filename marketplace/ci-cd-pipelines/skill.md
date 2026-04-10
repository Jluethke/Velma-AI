# CI/CD Pipelines

Build production CI/CD pipelines by inventorying a project's stack, designing pipeline stages, generating CI configuration, validating security, and optimizing for speed.

## Execution Pattern: Phase Pipeline

```
PHASE 1: INVENTORY     --> Scan project (language, framework, test runner, deploy target)
PHASE 2: DESIGN        --> Select pipeline stages, deployment strategy
PHASE 3: GENERATE      --> Produce CI config (GitHub Actions/GitLab/etc)
PHASE 4: VALIDATE      --> Dry-run check, security review (no secrets in logs)
PHASE 5: OPTIMIZE      --> Caching, parallelization, affected-only builds
```

## Inputs

- `project_language`: string -- Primary language(s) of the project
- `framework`: string -- Framework(s) used (React, FastAPI, Gin, etc.)
- `test_runner`: string -- Test framework (pytest, vitest, cargo test, etc.)
- `deploy_target`: string -- Where the application deploys (AWS, Vercel, K8s, bare metal)
- `task_description`: string -- Specific CI/CD need or general pipeline setup request

## Outputs

- `ci_config`: string -- Complete CI/CD configuration file (GitHub Actions YAML, GitLab CI, etc.)
- `dockerfile`: string -- Multi-stage Dockerfile optimized for the project
- `deployment_strategy`: object -- Chosen deployment pattern (blue-green, canary, rolling) with configuration
- `optimization_report`: object -- Identified bottlenecks and applied optimizations with before/after estimates

---

## Execution

### Phase 1: INVENTORY -- Scan Project

**Entry criteria:** Project source code or description is accessible.

**Actions:**
1. Identify primary language(s) and version requirements
2. Identify framework(s) and their build requirements
3. Identify test runner and test structure (unit, integration, E2E)
4. Identify package manager and dependency installation method (npm ci, pip install, cargo build)
5. Identify deployment target and current deployment method (if any)
6. Check for existing CI configuration to understand current state
7. Check for Docker files, docker-compose, or container requirements
8. Identify monorepo vs single-repo structure
9. Check for required services in CI (PostgreSQL, Redis, etc.)

**Output:** A project inventory listing language, framework, test runner, package manager, deploy target, repo structure, and required services.

**Quality gate:** Language and framework are identified. Test runner is known (or confirmed absent). Deploy target is specified.

---

### Phase 2: DESIGN -- Select Pipeline Stages and Deployment Strategy

**Entry criteria:** Project inventory is complete.

**Actions:**
1. Design pipeline stage order (see Reference: Stage Order and Gates):
   - Lint (fastest gate, <30s)
   - Unit tests (fast, parallel, <2min)
   - Integration tests (with services, <5min)
   - Build (only if tests pass, <3min)
   - Deploy to staging (auto on main)
   - E2E tests against staging
   - Deploy to production (manual gate or canary)
2. Select deployment strategy (see Reference: Deployment Strategies):
   - Blue-green for instant rollback needs
   - Canary for gradual rollout with monitoring
   - Rolling update for Kubernetes
3. Design environment promotion flow (see Reference: Environment Promotion):
   - dev -> staging -> production
   - Approval requirements per environment
4. Design rollback strategy (see Reference: Rollback Patterns):
   - Automated health check rollback
   - Database migration rollback plan
5. Choose Docker build strategy if applicable (see Reference: Docker Best Practices):
   - Multi-stage builds
   - Layer caching optimization
   - Non-root user, health checks

**Output:** Pipeline design document listing stages, deployment strategy, environment promotion, rollback plan, and Docker strategy.

**Quality gate:** Stage order follows the lint -> test -> build -> deploy pattern. Deployment strategy is chosen with justification. Rollback plan exists.

---

### Phase 3: GENERATE -- Produce CI Configuration

**Entry criteria:** Pipeline design is complete.

**Actions:**
1. Generate the primary CI/CD configuration file (see Reference: GitHub Actions Patterns):
   - Trigger configuration (push, PR, manual)
   - Concurrency control (cancel superseded runs)
   - Permissions (principle of least privilege)
   - Job definitions with dependencies (needs)
   - Matrix builds for multi-version testing
2. Generate caching configuration (see Reference: Caching Dependencies):
   - Language-specific caching (npm, pip, cargo)
   - Docker layer caching
   - Custom caches for build artifacts
3. Generate secrets management setup (see Reference: Secrets Management in Actions):
   - Environment secrets for deploy targets
   - OIDC for cloud providers where possible
4. Generate Docker files if applicable (see Reference: Docker Best Practices):
   - Multi-stage Dockerfile
   - .dockerignore
   - Health check configuration
5. Generate test configuration:
   - Unit test job with coverage (see Reference: Unit Tests in CI)
   - Integration test job with services (see Reference: Integration Tests in CI)
   - E2E test job if applicable (see Reference: E2E Tests)
6. Generate deployment configuration:
   - Staging auto-deploy
   - Production deploy with approval gate
7. For monorepos: add affected-only build detection (see Reference: Monorepo CI)

**Output:** Complete CI/CD configuration files ready to commit. Includes CI config, Dockerfile, docker-compose (if needed), and .dockerignore.

**Quality gate:** CI config is valid YAML. All secrets are referenced via `${{ secrets.* }}` (not hardcoded). Docker runs as non-root. Tests run before deploy.

---

### Phase 4: VALIDATE -- Dry-Run Check and Security Review

**Entry criteria:** CI configuration files are generated.

**Actions:**
1. Validate CI config syntax (YAML structure, valid action references)
2. Security review:
   - No secrets logged or echoed in steps
   - OIDC used instead of long-lived credentials where possible
   - Permissions follow least privilege (not `permissions: write-all`)
   - No `pull_request_target` without careful context handling
3. Verify stage dependencies prevent deploying without tests passing
4. Verify concurrency control prevents duplicate runs
5. Check Docker:
   - Image runs as non-root
   - .dockerignore excludes .env, .git, node_modules
   - Health check is configured
   - Image is scanned for vulnerabilities (Trivy/Snyk step present)
6. Verify rollback mechanism works (manual steps documented if automated isn't possible)
7. Cross-reference against the cross-platform CI equivalents if targeting multiple CI systems (see Reference: Cross-Platform CI Equivalents)

**Output:** Validation report listing any issues found. Pass/fail status for each check.

**Quality gate:** Zero security issues. All syntax checks pass. Tests gate deployment. No secrets exposure risks.

---

### Phase 5: OPTIMIZE -- Caching, Parallelization, Affected-Only Builds

**Entry criteria:** Validation passes with zero security issues.

**Actions:**
1. Identify bottlenecks (see Reference: Pipeline Performance Optimization):
   - Dependency installation time
   - Docker build time
   - Test execution time
   - Artifact download/upload time
2. Apply caching optimizations:
   - Ensure dependency caching is configured
   - Add Docker layer caching if build is slow
3. Apply parallelization:
   - Split tests across matrix shards (see Reference: Test Splitting)
   - Run independent jobs in parallel (lint + unit test can run simultaneously)
4. Apply affected-only builds for monorepos:
   - Use path-filter or Turborepo to detect changes
   - Only build/test packages that changed or depend on changed packages
5. Estimate time savings for each optimization applied
6. Set a target: PR pipeline should complete in < 10 minutes

**Output:** Optimized CI configuration with documented improvements. Before/after time estimates.

**Quality gate:** All optimizations are applied without breaking the pipeline. Dependency caching is verified. Test parallelization maintains correctness (no shared state issues).

---

## Exit Criteria

The skill is DONE when:
- CI/CD configuration files are generated and validated
- Pipeline follows lint -> test -> build -> deploy order
- Deployment strategy is defined with rollback plan
- Security review passes (no secret exposure, least privilege)
- Pipeline target is under 10 minutes for PR builds
- Docker is configured with multi-stage builds, non-root user, and health checks (if applicable)

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| INVENTORY | Cannot identify language or framework | **Escalate** -- ask user for project details |
| INVENTORY | No test runner found | **Adjust** -- generate pipeline without test stage, add TODO for test setup |
| DESIGN | Deploy target not supported by chosen CI system | **Adjust** -- recommend alternative CI system or custom deploy script |
| GENERATE | CI system has feature limitations (no matrix, no services) | **Adjust** -- use workarounds (Docker Compose for services, manual parallelization) |
| VALIDATE | Security issue found in generated config | **Retry** -- fix the issue and re-validate, max 3 retries |
| OPTIMIZE | Caching doesn't reduce build time | **Skip** -- remove cache step to reduce complexity, document why |
| ACT | User rejects the generated pipeline configuration or requests significant changes | **Adjust** -- incorporate specific feedback (e.g., different deployment strategy, additional security checks, alternative CI platform), update the affected phases, and regenerate only the changed configuration sections; do not restart from Phase 1 unless the project stack or deployment target has changed |

## State Persistence

Between runs, this skill saves:
- **Project inventory**: language, framework, test runner, deploy target
- **Pipeline design**: stage order, deployment strategy, rollback plan
- **Optimization history**: which optimizations were applied and their measured impact
- **CI system**: which CI platform was targeted (for cross-platform generation)

---

## Reference

### GitHub Actions Patterns

#### Basic Pipeline Structure
```yaml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true  # Cancel superseded runs on same branch

permissions:
  contents: read  # Principle of least privilege

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    needs: lint  # Only run if lint passes
    strategy:
      matrix:
        node-version: [18, 20, 22]  # Test against multiple versions
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-${{ matrix.node-version }}
          path: coverage/

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/

  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment: production  # Requires approval if configured
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/
      - run: echo "Deploy to production"
```

#### Caching Dependencies
```yaml
# Node.js — built into setup-node
- uses: actions/setup-node@v4
  with:
    cache: 'npm'  # Caches ~/.npm automatically

# Python — explicit cache
- uses: actions/setup-python@v5
  with:
    python-version: '3.12'
    cache: 'pip'

# Custom cache (e.g., Rust target directory)
- uses: actions/cache@v4
  with:
    path: |
      ~/.cargo/registry
      ~/.cargo/git
      target
    key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}
    restore-keys: |
      ${{ runner.os }}-cargo-
```

#### Secrets Management in Actions
```yaml
steps:
  - name: Deploy
    env:
      AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
      AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    run: aws s3 sync dist/ s3://my-bucket/

  # BETTER: Use OIDC for cloud providers (no long-lived secrets)
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789:role/github-actions
      aws-region: us-east-1
```

#### Reusable Workflows
```yaml
# .github/workflows/reusable-deploy.yml
name: Deploy
on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
    secrets:
      DEPLOY_KEY:
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - run: echo "Deploying to ${{ inputs.environment }}"

# Caller workflow
jobs:
  deploy-staging:
    uses: ./.github/workflows/reusable-deploy.yml
    with:
      environment: staging
    secrets:
      DEPLOY_KEY: ${{ secrets.STAGING_DEPLOY_KEY }}
```

---

### Pipeline Stages

#### Stage Order and Gates
```
lint ──→ unit-test ──→ integration-test ──→ build ──→ deploy-staging ──→ e2e-test ──→ deploy-prod
  │         │              │                  │           │                │             │
  fast      fast           slow               medium      auto            slow          manual gate
  <30s      <2min          <5min              <3min       auto            <10min        approval
```

#### Stage Rules
1. **Lint first** -- cheapest gate, catches formatting/syntax in seconds
2. **Unit tests second** -- fast, parallel, no external dependencies
3. **Integration tests** -- real database, real services, serial
4. **Build** -- only if all tests pass
5. **Deploy to staging** -- automatic on main branch
6. **E2E tests** -- run against staging
7. **Deploy to production** -- manual approval or automatic with canary

#### Fail Fast
```yaml
# Fail the entire job on first test failure
- run: npm test -- --bail

# Fail matrix jobs if any one fails
strategy:
  fail-fast: true  # Default is true
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
```

---

### Docker Best Practices

#### Multi-Stage Build
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001
USER nextjs

# Copy only production deps and build output
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
```

#### Python Multi-Stage
```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
RUN useradd -m appuser && chown appuser:appuser /app
USER appuser
COPY --from=builder /root/.local /home/appuser/.local
COPY --chown=appuser:appuser . .
ENV PATH=/home/appuser/.local/bin:$PATH
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0"]
```

#### .dockerignore
```
.git
node_modules
dist
*.md
.env*
.vscode
.github
coverage
__pycache__
*.pyc
.pytest_cache
```

#### Layer Caching Rules
1. Copy dependency files (package.json, requirements.txt) BEFORE source code
2. `RUN npm ci` caches if package-lock.json unchanged
3. COPY source code last (changes most frequently)
4. Combine RUN commands to reduce layers:
   ```dockerfile
   # BAD: 3 layers
   RUN apt-get update
   RUN apt-get install -y curl
   RUN rm -rf /var/lib/apt/lists/*

   # GOOD: 1 layer
   RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
   ```

#### Image Security
```yaml
# Scan in CI
- name: Scan image
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: myapp:latest
    severity: 'CRITICAL,HIGH'
    exit-code: '1'  # Fail pipeline on vulnerabilities
```

---

### Testing Strategy in CI

#### Test Pyramid
```
         /  E2E  \          5-10 tests, slow (minutes), run on staging
        / -------- \
       / Integration \      50-100 tests, medium (seconds), real deps
      / -------------- \
     /    Unit Tests     \  500+ tests, fast (ms each), no deps
    / -------------------- \
```

#### Unit Tests in CI
```yaml
test-unit:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: npm ci
    - run: npm test -- --parallel --bail --coverage
    # Parallel: run test files concurrently
    # Bail: stop on first failure
    # Coverage: enforce minimum
    - name: Check coverage threshold
      run: |
        COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
        if (( $(echo "$COVERAGE < 80" | bc -l) )); then
          echo "Coverage $COVERAGE% is below 80% threshold"
          exit 1
        fi
```

#### Integration Tests in CI
```yaml
test-integration:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:16
      env:
        POSTGRES_PASSWORD: test
        POSTGRES_DB: testdb
      ports: ['5432:5432']
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
    redis:
      image: redis:7
      ports: ['6379:6379']
  env:
    DATABASE_URL: postgresql://postgres:test@localhost:5432/testdb
    REDIS_URL: redis://localhost:6379
  steps:
    - uses: actions/checkout@v4
    - run: npm ci
    - run: npm run test:integration
```

#### E2E Tests
```yaml
test-e2e:
  runs-on: ubuntu-latest
  needs: deploy-staging
  steps:
    - uses: actions/checkout@v4
    - name: Install Playwright
      run: npx playwright install --with-deps chromium
    - name: Run E2E
      run: npx playwright test
      env:
        BASE_URL: https://staging.myapp.com
    - uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/
```

---

### Deployment Strategies

#### Blue-Green Deployment
```
[Load Balancer]
      |
      |-- Blue (v1.0) <-- current production
      +-- Green (v1.1) <-- new version, receiving no traffic

Steps:
1. Deploy v1.1 to Green
2. Run smoke tests against Green
3. Switch load balancer to Green
4. Green is now production
5. Blue becomes the next deployment target
6. If problems: switch back to Blue (instant rollback)
```

#### Canary Deployment
```
[Load Balancer]
      |
      |-- Stable (v1.0) <-- 95% of traffic
      +-- Canary (v1.1) <-- 5% of traffic

Steps:
1. Deploy v1.1 to canary pool (5% traffic)
2. Monitor error rate, latency, business metrics for 15-30 min
3. If healthy: increase to 25%, then 50%, then 100%
4. If unhealthy: route 100% back to stable, investigate

Key metrics to watch during canary:
- Error rate (5xx responses)
- P99 latency
- CPU/memory usage
- Business metrics (conversion rate, checkout completion)
```

#### Rolling Update (Kubernetes default)
```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Add 1 new pod before removing old
      maxUnavailable: 0   # Never reduce below desired count
  template:
    spec:
      containers:
        - readinessProbe:    # Don't send traffic until ready
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:     # Restart if unhealthy
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 20
```

#### Feature Flags (Deployment != Release)
```javascript
// Deploy dark code, enable via feature flag
if (featureFlags.isEnabled('new-checkout', { userId: user.id })) {
  return renderNewCheckout();
} else {
  return renderOldCheckout();
}
```

---

### Environment Promotion

```
dev (auto-deploy on PR merge to dev branch)
 +-- staging (auto-deploy on merge to main)
      +-- production (manual approval or canary)
```

#### GitHub Environments with Approval
```yaml
deploy-production:
  runs-on: ubuntu-latest
  needs: [test, build, deploy-staging, e2e]
  environment:
    name: production
    url: https://myapp.com
  # GitHub will require configured reviewers to approve
```

#### Environment-Specific Config
```yaml
# Use GitHub environment secrets (not repo secrets) for env-specific values
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}  # Different per environment
  API_URL: ${{ vars.API_URL }}               # Non-secret config variables
```

---

### Rollback Patterns

#### Automated Rollback
```yaml
deploy:
  steps:
    - name: Deploy
      run: kubectl set image deployment/myapp myapp=myapp:${{ github.sha }}
    - name: Wait for rollout
      run: kubectl rollout status deployment/myapp --timeout=300s
    - name: Health check
      run: |
        for i in {1..10}; do
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://myapp.com/health)
          if [ "$STATUS" == "200" ]; then
            echo "Health check passed"
            exit 0
          fi
          sleep 5
        done
        echo "Health check failed — rolling back"
        kubectl rollout undo deployment/myapp
        exit 1
```

#### Database Rollback
Migrations should always have a `down` method:
```javascript
// Migration: 20260331_add_status_column.js
exports.up = async (knex) => {
  await knex.schema.alterTable('orders', (t) => {
    t.string('status').defaultTo('pending');
  });
};
exports.down = async (knex) => {
  await knex.schema.alterTable('orders', (t) => {
    t.dropColumn('status');
  });
};
```

---

### Monorepo CI

#### Affected-Only Builds
```yaml
# Detect which packages changed
- name: Detect changes
  id: changes
  uses: dorny/paths-filter@v3
  with:
    filters: |
      api:
        - 'packages/api/**'
      web:
        - 'packages/web/**'
      shared:
        - 'packages/shared/**'

# Only build what changed (or depends on what changed)
- name: Build API
  if: steps.changes.outputs.api == 'true' || steps.changes.outputs.shared == 'true'
  run: npm run build --workspace=packages/api

- name: Build Web
  if: steps.changes.outputs.web == 'true' || steps.changes.outputs.shared == 'true'
  run: npm run build --workspace=packages/web
```

#### Nx/Turborepo Pattern
```yaml
# Let the tool figure out what needs to rebuild
- run: npx turbo run build test --filter='...[origin/main]'
  # Only builds/tests packages affected since main branch
```

---

### Cross-Platform CI Equivalents

| GitHub Actions | GitLab CI | CircleCI | Jenkins |
|---|---|---|---|
| `on: push` | `rules: - if: $CI_PIPELINE_SOURCE == "push"` | `filters: branches: only: main` | `triggers { pollSCM('H/5 * * * *') }` |
| `runs-on: ubuntu-latest` | `image: ubuntu:latest` | `docker: - image: ubuntu` | `agent { docker { image 'ubuntu' } }` |
| `needs: [lint]` | `needs: [lint]` | `requires: [lint]` | `stage('Test') { ... }` |
| `actions/cache@v4` | `cache: key / paths` | `save_cache / restore_cache` | `stash/unstash` |
| `services:` | `services:` | Custom Docker executor | Docker agent |
| `secrets.MY_SECRET` | `$MY_SECRET` (CI/CD vars) | `$MY_SECRET` (env vars) | `credentials()` |
| `environment: prod` | `environment: production` | `context: prod` | `input { ... }` |
| `if: github.ref == 'refs/heads/main'` | `rules: - if: $CI_COMMIT_BRANCH == "main"` | `filters: branches: only: main` | `when { branch 'main' }` |

---

### Pipeline Performance Optimization

#### Common Bottlenecks and Fixes
| Bottleneck | Fix |
|---|---|
| `npm install` takes 3 min | Cache `~/.npm`, use `npm ci` (faster), or use `pnpm` |
| Docker build 10+ min | Multi-stage build, layer caching, `.dockerignore` |
| Tests take 15 min | Parallelize with matrix or test splitting |
| E2E flaky | Retry with `retry: 2`, use `wait-on` for readiness |
| Downloading large artifacts | Cache between jobs, use `actions/cache` |
| Waiting for approval | Add auto-approve for staging, manual only for prod |

#### Test Splitting
```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - run: npx jest --shard=${{ matrix.shard }}/4
```

---

### Quick Reference Checklist

- [ ] Pipeline stages: lint -> test -> build -> deploy
- [ ] Concurrency control prevents duplicate runs on same branch
- [ ] Dependencies cached (npm, pip, cargo, Docker layers)
- [ ] Tests parallelized where possible
- [ ] Docker runs as non-root user with health checks
- [ ] Secrets use environment secrets or OIDC, never hardcoded
- [ ] Deployment uses blue-green or canary (not yolo-push)
- [ ] Rollback tested and documented
- [ ] Monorepo only builds affected packages
- [ ] Pipeline finishes in < 10 minutes for PRs
