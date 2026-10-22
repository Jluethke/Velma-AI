# Auth Requirements Gatherer

Gather authentication and authorization requirements from the API consumers and security team.

## Inputs

- `consumer-types`: Types of API consumers (server-to-server, user-facing app, third-party)
- `security-requirements`: Security and compliance requirements

## Outputs

- `auth-requirements`: What needs to be authenticated, what needs to be authorized, what scopes exist
- `threat-model`: Authentication-related threats and mitigations

## Process

1. List each consumer type and how they will authenticate (API key, OAuth, JWT).
2. Define the authorization model: what resources, what actions, what scopes.
3. Identify authentication-related threats: token theft, replay, brute force.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
