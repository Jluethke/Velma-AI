# Iot Certification Preparation

Prepare an IoT device for security certification: map requirements from relevant standards, perform gap analysis, remediate findings, and compile the evidence package.

## Inputs

- `vulnerability-findings`: Security testing results with severity and remediation status
- `fuzzing-results`: Protocol fuzzing outcomes and crash triage

## Outputs

- `certification-gap-analysis`: Requirements from target standard mapped to current device implementation, with pass/fail/gap for each requirement
- `evidence-package`: Compiled evidence: test reports, design documents, remediation records, ready for submission to certification body

## Process

1. Select target certification: ETSI EN 303 645 (European IoT baseline), NIST IR 8259A (US IoT baseline), ioXt Alliance, UL 2900, or sector-specific (IEC 62443 for industrial). Map each requirement to a testable assertion.
2. Common requirements across standards: (1) No default passwords (device must require password change on first use or use unique per-device credentials). (2) Vulnerability disclosure policy published. (3) Software updates: secure update mechanism with authentication. (4) Secure communication: all external communications encrypted (TLS 1.2+ or equivalent). (5) Minimize attack surface: disable unused ports and services. (6) Data protection: personal data encrypted at rest.
3. Gap analysis: test each requirement against the device. For requirement 1: attempt login with common default credentials. For requirement 3: attempt to load an unsigned firmware image. For requirement 4: capture all network traffic and verify encryption (no plaintext credentials, no HTTP where HTTPS is expected). Document each requirement as pass, fail, or not-applicable with evidence.
4. Remediate failures: prioritize by certification requirement (mandatory requirements must pass) and severity. For each remediation: implement the fix, re-test to verify, document the before-and-after evidence. Track remediation in a findings register with dates and responsible engineers.
5. Compile the evidence package: cover letter, device description, architecture diagram, security testing report (penetration test, fuzzing results, vulnerability scan), remediation register, design documents (secure boot chain, update mechanism, key management), and manufacturer declaration of conformity. Submit to the certification body or authorized test laboratory.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
