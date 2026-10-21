# Web Server Hardening Reporter

Produce the web server hardening report with all changes and test results.

## Inputs

- `web-server-type`: Web server software
- `tls-test-results`: TLS scan results

## Outputs

- `hardening-report`: Full web server hardening report
- `compliance-score`: TLS grade and header compliance score

## Process

1. Compile all change logs and test results
2. Run a final scan (SSL Labs, securityheaders.com equivalent checks)
3. Document any exceptions with justification
4. Produce the report with the compliance grade

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
