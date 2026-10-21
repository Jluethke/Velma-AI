# Ssrf Surface Identification

Identify all user-controllable URL parameters and request inputs that may trigger server-side requests.

## Inputs

- `target-application`: Base URL and sitemap of the authorized target
- `engagement-scope`: Written authorization and scope document

## Outputs

- `ssrf-surface-map`: All endpoints and parameters that accept URL or hostname input
- `request-flow-diagram`: How the application processes and follows URL inputs

## Process

1. Crawl the application and identify parameters accepting URLs, hostnames, or file paths
2. Check API endpoints for URL parameters (webhook URLs, import URLs, preview/fetch features)
3. Identify hidden parameters through parameter brute-forcing
4. Map the request flow from user input to server-side HTTP request

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
