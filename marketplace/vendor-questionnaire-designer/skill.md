# Vendor Questionnaire Designer

Design a security questionnaire and evidence request list scoped to the vendor and the services they provide.

## Inputs

- `vendor-profile`: Vendor name, services provided, data accessed, and integration points.
- `assessment-scope`: Depth of review, applicable frameworks, and the sensitivity of data in play.

## Outputs

- `security-questionnaire`: Set of control questions grouped by domain and weighted by relevance to the scope.
- `evidence-request-list`: Supporting documents and artifacts the vendor must supply to back their answers.

## Process

1. Map the vendor services and data access to the control domains that apply.
2. Select or tailor questions for each domain and drop questions that do not fit the scope.
3. Weight questions by the data sensitivity and the blast radius of the integration.
4. List the evidence needed to verify each high-weight answer, such as policies, reports, and certificates.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
