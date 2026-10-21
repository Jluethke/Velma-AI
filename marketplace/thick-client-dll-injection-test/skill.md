# Thick Client Dll Injection Test

Test for DLL hijacking, injection, and other binary manipulation vulnerabilities.

## Inputs

- `binary-analysis-results`: Loaded libraries and search paths identified
- `permission-issues`: Writable paths in the DLL search order

## Outputs

- `dll-hijack-findings`: Confirmed DLL hijacking or injection vulnerabilities
- `privilege-escalation-vectors`: Local privilege escalation paths through the application

## Process

1. Analyze the DLL search order for writable directories
2. Test for DLL side-loading with crafted test libraries
3. Check for insecure service configurations that allow privilege escalation
4. Test for COM object hijacking opportunities

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
