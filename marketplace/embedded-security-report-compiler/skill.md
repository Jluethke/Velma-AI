# Embedded Security Report Compiler

Compile all embedded systems security findings into a final assessment report.

## Inputs

- `rf-findings`: Wireless interface findings
- `side-channel-findings`: Side-channel analysis findings
- `memory-protection-findings`: Memory protection findings
- `bootloader-findings`: Bootloader security findings

## Outputs

- `embedded-security-report`: Full embedded systems security assessment report
- `remediation-priority-list`: Prioritized remediation for hardware and firmware

## Process

1. Aggregate findings across debug, firmware, boot, wireless, side-channel, and memory
2. Score each finding considering physical access requirements and remote exploitability
3. Write remediation guidance covering both hardware revision and firmware updates
4. Produce the final report with attack tree diagrams and remediation timeline

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
