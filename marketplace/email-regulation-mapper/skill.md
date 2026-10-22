# Email Regulation Mapper

Map applicable email regulations based on audience geography and data type.

## Inputs

- `audience-geography`: Where subscribers are located (countries, states, regions)
- `data-collected`: What data is collected from subscribers (email, name, preferences, behavior)

## Outputs

- `applicable-regulations`: Regulations that apply: CAN-SPAM, GDPR, CCPA, CASL, PECR, with key requirements
- `compliance-checklist`: Checklist of requirements to meet for each regulation

## Process

1. Identify which regulations apply based on subscriber locations.
2. For each regulation, list the specific requirements (consent, unsubscribe, physical address, data rights).
3. Note the strictest requirement where regulations overlap.
4. Produce the compliance checklist.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
