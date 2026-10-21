# Firmware Web Interface Test

Test the device web management interface for command injection, authentication bypass, and CSRF.

## Inputs

- `device-model`: Device model and network address
- `credential-findings`: Known credentials from the firmware search

## Outputs

- `web-interface-findings`: Vulnerabilities found in the web management UI
- `command-injection-paths`: Confirmed command injection entry points

## Process

1. Map all web endpoints, forms, and API calls in the management interface
2. Test each input field for OS command injection, path traversal, and SQL injection
3. Check for authentication bypass through direct URL access or session prediction
4. Test for cross-site request forgery on state-changing operations

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
