# Cross Session Data Leakage Test

Test for data leakage between user sessions, tenants, or conversation contexts.

## Inputs

- `application-endpoint`: URL or interface for the LLM application
- `agency-findings`: Agency findings for cross-session context

## Outputs

- `leakage-findings`: Cross-session or cross-tenant data leakage found
- `isolation-score`: Score for session and tenant isolation

## Process

1. Send unique canary data in one session and attempt to retrieve it from another
2. Test whether conversation history from one user is accessible to another
3. Check for shared context or cached responses between different tenant environments
4. Verify that RAG retrieval is properly scoped to the current user's documents

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
