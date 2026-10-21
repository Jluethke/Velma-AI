# Xxe Endpoint Identify

Identify all endpoints that parse XML input including direct XML, SOAP, SVG, and Office file uploads.

## Inputs

- `target-application`: Target application URL
- `engagement-scope`: Authorized test scope

## Outputs

- `xml-endpoints`: List of all XML parsing endpoints
- `parser-fingerprints`: Fingerprints of XML parsers in use

## Process

1. Identify endpoints accepting XML content types
2. Identify file upload endpoints that process XML-based formats
3. Fingerprint the XML parser from error messages and behavior

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
