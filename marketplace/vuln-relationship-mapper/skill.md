# Vuln Relationship Mapper

Map relationships between vulnerabilities that could form attack chains.

## Inputs

- `vuln-inventory`: All known vulnerabilities
- `system-context`: Architectural context

## Outputs

- `relationship-graph`: Graph of vulnerability relationships and data flow connections
- `candidate-chains`: Preliminary list of possible multi-step attack paths

## Process

1. Identify vulnerabilities on the same system or connected systems
2. Map data flows between vulnerable components
3. Identify where one vulnerability's output becomes another's prerequisite

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
