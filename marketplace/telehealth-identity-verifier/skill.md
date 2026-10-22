# Telehealth Identity Verifier

Verify the patient's identity and location for the telemedicine visit.

## Inputs

- `patient-id`: Patient identifier
- `appointment-details`: Scheduled visit information

## Outputs

- `identity-confirmed`: Verification status (confirmed or failed)
- `patient-location`: State or jurisdiction where the patient is located

## Process

1. Verify identity using date of birth and another identifier.
2. Confirm the patient's physical location for licensing compliance.
3. Document the verification in the encounter record.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
