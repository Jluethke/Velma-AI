# Example: GitHub Actions CI/CD for a Node.js API

## Task
Set up a complete CI/CD pipeline that lints, tests, builds a Docker image, and deploys to staging automatically on merge to main.

## Solution

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read
  id-token: write  # For OIDC

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: test, POSTGRES_DB: testdb }
        ports: ['5432:5432']
        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm test -- --coverage --bail
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/testdb
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: coverage, path: coverage/ }

  build-and-push:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1
      - uses: aws-actions/amazon-ecr-login@v2
      - run: |
          docker build -t $ECR_REGISTRY/myapp:${{ github.sha }} .
          docker push $ECR_REGISTRY/myapp:${{ github.sha }}

  deploy-staging:
    runs-on: ubuntu-latest
    needs: build-and-push
    environment: staging
    steps:
      - run: |
          kubectl set image deployment/myapp myapp=$ECR_REGISTRY/myapp:${{ github.sha }}
          kubectl rollout status deployment/myapp --timeout=300s
```

## Key Patterns Used
- **Concurrency control**: Cancels superseded runs on same branch
- **Dependency caching**: `cache: 'npm'` in setup-node
- **Service containers**: Real PostgreSQL for integration tests
- **OIDC auth**: No long-lived AWS keys stored as secrets
- **Fail fast**: `--bail` stops tests on first failure
- **Environment gates**: `environment: staging` enables approval workflows
- **Stage dependencies**: lint -> test -> build -> deploy (each gates the next)
