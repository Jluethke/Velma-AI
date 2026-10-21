# Win Dll Hijack Check

Test for DLL hijacking opportunities in application and service search order.

## Inputs

- `service-path-findings`: Vulnerable service paths identified
- `installed-software-list`: Installed applications list

## Outputs

- `dll-hijack-findings`: List of DLL hijacking opportunities with target paths
- `hijack-impact-assessment`: Impact rating for each hijack opportunity

## Process

1. Monitor DLL load order for high-privilege processes using procmon data
2. Identify missing DLLs searched in writable directories
3. Check for DLL side-loading opportunities in signed applications
4. Document the privilege context each hijack would yield

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
