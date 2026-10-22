# Firmware Update Mechanism

Design the firmware update mechanism: A/B partitioning for atomic updates, differential updates for bandwidth-constrained links, and update state machine.

## Inputs

- `flash-partition-map`: Flash layout with bootloader, app slots, and config regions
- `secure-boot-architecture`: Signature verification flow that the update must integrate with

## Outputs

- `update-state-machine`: States: idle, downloading, verifying, committing, rolling-back. Transitions and persistent flags for each state.
- `update-protocol`: Transport protocol (UART/USB/BLE/cellular), chunk size, error handling, resume capability, and total update time estimate

## Process

1. Choose the update strategy. A/B partitioning: the running application writes the new image to the inactive slot, the bootloader validates and swaps on next boot. This is atomic (power loss at any point is safe) but requires 2x the flash for application code.
2. If flash is too small for A/B, use in-place update with a recovery image: the bootloader copies the new image over the running application, with a factory recovery image in a protected region. This is not atomic, but the recovery image handles interrupted updates.
3. Design the update state machine with persistent flags stored in a dedicated flash sector (or the last page of each slot). States: IDLE (boot normally), DOWNLOAD_IN_PROGRESS (resume if interrupted), VERIFY_PENDING (new image received, needs validation), BOOT_NEW (bootloader should try the new slot), CONFIRMED (new image booted and confirmed by application), ROLLBACK (new image failed, revert to previous).
4. For bandwidth-constrained links (BLE, LoRa), implement delta updates: generate a binary diff (bsdiff or similar) between old and new firmware. The device applies the patch to produce the new image. This reduces transfer size by 60% to 90% for typical firmware changes but requires RAM for the patching algorithm.
5. Handle power loss at every transition. The golden rule: never erase the current working image until the new image is fully written and verified. With A/B, this is automatic. With in-place update, copy the current image to backup before erasing.
6. The application must confirm the new firmware within a timeout (e.g., 3 successful boot cycles or an explicit confirm command). If confirmation does not arrive, the bootloader rolls back to the previous version on the next reset.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
