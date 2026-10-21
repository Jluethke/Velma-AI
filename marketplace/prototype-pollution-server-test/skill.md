# Prototype Pollution Server Test

Test for server-side prototype pollution in Node.js applications using Express, Lodash, and similar libraries.

## Inputs

- `merge-operations`: Object merge operations identified
- `input-vectors`: Input vectors to test

## Outputs

- `server-pollution-results`: Server-side pollution test results
- `polluted-properties`: Properties successfully polluted on the prototype

## Process

1. Inject __proto__ and constructor.prototype payloads into JSON inputs
2. Test for pollution through query string and URL parameters
3. Confirm pollution by observing changed behavior in subsequent requests

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
