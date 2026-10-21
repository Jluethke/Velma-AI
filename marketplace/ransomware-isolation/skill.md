# Ransomware Isolation

Isolate affected systems to prevent the ransomware from spreading to additional hosts.

## Inputs

- `confirmation-report`: Confirmed ransomware determination
- `affected-system-info`: Details of confirmed affected systems

## Outputs

- `isolation-log`: Record of all isolation actions taken with timestamps
- `scope-assessment`: Preliminary scope of affected vs unaffected systems

## Process

1. Disconnect affected systems from the network (disable ports, remove from VLAN, or use EDR isolation)
2. Disable any shared drives or mapped network paths accessible from infected hosts
3. Block lateral movement by restricting SMB and RDP at the firewall for affected subnets
4. Document each isolation action and the time it was performed

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
