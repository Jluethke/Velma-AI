# Memory Image Acquirer

Acquire a memory image from a live or hibernated system.

## Inputs

- `target-system`: The system to capture memory from
- `capture-tool`: The memory acquisition tool and method

## Outputs

- `memory-image`: The raw memory dump file
- `capture-metadata`: Metadata about the capture including timestamp and system info

## Process

1. Select the acquisition method (live dump, crash dump, hibernation file)
2. Run the capture tool with minimal system impact
3. Record the capture timestamp, OS version, and RAM size
4. Hash the resulting image for integrity

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
