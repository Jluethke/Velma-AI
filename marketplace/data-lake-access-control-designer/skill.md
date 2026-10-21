# Data Lake Access Control Designer

Design access controls and audit logging for the security data lake.

## Inputs

- `storage-architecture`: Storage platform and tiers
- `query-layer-design`: Query interfaces

## Outputs

- `access-control-policy`: Role-based access controls for data lake read, write, and admin operations
- `data-lake-architecture-document`: Complete architecture document covering all components

## Process

1. Define roles: analyst (read), detection engineer (read/write rules), admin (full)
2. Implement row-level or field-level security for sensitive data (PII, credentials)
3. Configure audit logging for all queries and data access
4. Produce the complete architecture document

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
