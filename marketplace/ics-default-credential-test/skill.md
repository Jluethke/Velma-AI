# Ics Default Credential Test

Test for default and weak credentials on ICS devices and management interfaces.

## Inputs

- `ics-device-inventory`: Devices to test for default credentials
- `ics-scope`: Authorization for credential testing

## Outputs

- `credential-findings`: Devices found with default, weak, or no credentials
- `access-level-map`: Access levels achievable with discovered credentials

## Process

1. Test web interfaces and management ports for vendor default credentials
2. Check for PLCs and RTUs that allow unauthenticated programming access
3. Test SCADA server and HMI application logins
4. Document each finding with the access level obtained

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
