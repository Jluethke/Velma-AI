# Web App Attack Surface Mapping

Map the web application's attack surface including endpoints, parameters, authentication flows, and technologies.

## Inputs

- `target-url`: Base URL of the web application under test
- `test-credentials`: Authorized test accounts at various privilege levels
- `scope-document`: Authorized scope and rules of engagement

## Outputs

- `application-map`: Complete map of endpoints, parameters, and functionality
- `technology-stack`: Identified server, framework, and client-side technologies
- `authentication-flows`: Documented authentication and session management mechanisms

## Process

1. Crawl the application to discover all endpoints and parameters
2. Identify the technology stack from HTTP headers, cookies, and page source
3. Map authentication flows including login, registration, and password reset
4. Document all input vectors including forms, APIs, file uploads, and WebSocket endpoints

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
