# Versioning Policy Writer

Define the versioning policy: how versions work and what constitutes a breaking change.

## Inputs

- `api-maturity`: Current state of the API (pre-launch, v1 stable, multiple versions in production)
- `consumer-base`: Who consumes the API and how sensitive they are to changes

## Outputs

- `versioning-policy`: The versioning policy: versioning scheme (URL path, header, query param), what is breaking vs. non-breaking, deprecation timeline
- `breaking-change-definitions`: Catalog of what counts as a breaking change (field removal, type change, required field addition, behavior change)

## Process

1. Choose the versioning scheme (URL path /v1/, header Accept-Version, query parameter ?version=1) and justify the choice.
2. Define what constitutes a breaking change (removing a field, changing a field type, adding a required field, changing error codes).
3. Define what is non-breaking (adding optional fields, adding new endpoints, adding new enum values).
4. Set the deprecation timeline (minimum notice period, sunset date, migration support).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
