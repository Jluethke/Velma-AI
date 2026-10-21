# Web Version Disclosure Remover

Remove server version information from HTTP responses and error pages.

## Inputs

- `web-server-type`: Web server software
- `tls-config`: TLS configuration already applied

## Outputs

- `disclosure-config`: Configuration changes to suppress version information
- `disclosure-test`: Verification that version info is no longer exposed

## Process

1. Set ServerTokens to Prod (Apache) or server_tokens off (Nginx)
2. Configure custom error pages that do not reveal server details
3. Remove or modify any X-Powered-By or similar headers
4. Test by requesting invalid URLs and checking the response

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
