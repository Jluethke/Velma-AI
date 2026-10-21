# Medical Patient Data Transit Test

Check for unencrypted patient health information in network traffic and stored data.

## Inputs

- `traffic-analysis`: Captured network traffic to inspect
- `protocol-inventory`: Protocols carrying patient data

## Outputs

- `phi-exposure-findings`: Unencrypted PHI in transit and storage
- `encryption-assessment`: Assessment of encryption implementations

## Process

1. Inspect captured traffic for unencrypted patient identifiers and health data
2. Test TLS configuration on all endpoints transmitting PHI
3. Check for PHI in log files, temporary storage, and error messages
4. Verify DICOM and HL7 transmission security configurations

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
