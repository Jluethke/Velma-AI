# Web Tls Configurator

Configure TLS with strong cipher suites and certificate settings.

## Inputs

- `web-server-type`: Web server software
- `header-config`: HSTS header already configured

## Outputs

- `tls-config`: Applied TLS configuration (protocols, ciphers, OCSP)
- `tls-test-results`: Results from a TLS configuration scanner

## Process

1. Disable TLS 1.0 and 1.1, enable only TLS 1.2 and 1.3
2. Configure cipher suite preference to use AEAD ciphers first
3. Enable OCSP stapling for certificate validation
4. Test the configuration with an external TLS scanner

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
