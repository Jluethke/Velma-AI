# Attack Surface Enumeration

Enumerate the web application attack surface including endpoints, parameters, authentication flows, and technology stack.

## Inputs

- `engagement-scope`: Defined boundaries of the test
- `rules-of-engagement`: Testing constraints and prohibited actions

## Outputs

- `endpoint-inventory`: Complete list of discovered endpoints and their HTTP methods
- `technology-fingerprint`: Identified server software, frameworks, and libraries

## Process

1. Spider the application to discover all reachable endpoints and parameters.
2. Identify authentication and session management mechanisms.
3. Fingerprint the technology stack (web server, framework, languages, databases).
4. Map input vectors including forms, headers, cookies, and URL parameters.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
