# Guest Network Segmentation Test

Test guest wireless network segmentation to verify it cannot reach internal networks, management interfaces, or other VLANs.

## Inputs

- `isolation-findings`: Client isolation results
- `access-point-inventory`: Network configuration context

## Outputs

- `guest-segmentation-findings`: Guest network segmentation failures
- `reachable-internal-resources`: Internal resources accessible from the guest network

## Process

1. From the guest network, scan for reachable internal IP ranges.
2. Attempt to access management interfaces (AP controllers, switches, printers).
3. Test DNS resolution of internal hostnames from the guest network.
4. Verify that captive portal bypass does not grant access to internal resources.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
