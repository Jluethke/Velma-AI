# Carrier Matcher

Search the carrier network for available capacity.

## Inputs

- `validated-load`: Validated load details
- `rate-estimate`: Market rate estimate

## Outputs

- `carrier-options`: List of available carriers with rates, equipment, and service history
- `carrier-scores`: Carrier scores based on reliability, price, and compliance

## Process

1. Search the carrier database for available trucks in the origin area matching the equipment requirements.
2. Check load boards for additional carrier options.
3. Score each carrier on reliability (on-time percentage), price, insurance, and safety rating.
4. Shortlist the top candidates for negotiation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
