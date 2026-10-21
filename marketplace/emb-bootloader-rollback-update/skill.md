# Bootloader Update with Rollback

**One-line description:** Sets up a two-slot firmware update with signed images and automatic rollback (MCUboot for Zephyr and bare-metal Cortex-M, the ESP-IDF OTA rollback feature for ESP chips), where a new image runs in a trial state and is confirmed only after a self-test, and proves rollback, signature rejection and power loss during swap on the bench.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Firmware source tree.
- `stack` (string, required): `zephyr`, `arm-gcc`, `platformio` or `esp-idf`.
- `memory_usage_report` (object, required): Region and section sizes from the linker map audit, used to size slots.
- `watchdog_record` (object, required): Watchdog configuration from the watchdog flow; a hung trial image must be reset by it.
- `test_report` (object, required): Host unit test result; must show zero failures before an update path is built.
- `signing_key_path` (string, required): Path to the private signing key, stored outside the repository.

---

## Outputs

- `update_test_record` (object): Slot layout, bootloader and image tool versions, confirm-call location, and results of the four bench tests: good update, unconfirmed image rollback, bad signature rejection, power loss during swap.

---

## Phase 1: Slot Layout and Bootloader Choice

### Entry Criteria
- `test_report` shows FAILED: 0.
- `watchdog_record` shows the hang test passed.

### Actions
1. Choose by `stack`:

| `stack` | Bootloader | Where configured |
|---|---|---|
| zephyr | MCUboot via sysbuild | `west build --sysbuild`, `SB_CONFIG_BOOTLOADER_MCUBOOT=y`; key in `SB_CONFIG_BOOT_SIGNATURE_KEY_FILE` (check the Zephyr MCUboot docs for your release) |
| arm-gcc, platformio | MCUboot built for the board (its `boot/` ports), or the vendor's documented secure bootloader | Flash partition map in MCUboot config; application linked at the primary slot after the image header |
| esp-idf | ESP-IDF bootloader with app rollback | `CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE=y`; partition table with `otadata`, `ota_0`, `ota_1` |

2. Size slots: primary and secondary equal; each holds the largest expected image plus header and trailer; MCUboot swap modes also need a scratch area or a spare sector (read the MCUboot "Design" document for the mode you pick). Use flash sizes from `memory_usage_report`, and sector sizes from the reference manual flash chapter; slots must start and end on sector boundaries.
3. Generate a key if none exists, outside the repo: `imgtool keygen -k <signing_key_path> -t ecdsa-p256`. Add the key path to `.gitignore` checks: `git ls-files | grep -i pem` must print nothing.

### Output
Slot table and bootloader choice.

### Quality Gate
- Every slot start and size is a multiple of its sector size (arithmetic shown).
- `git ls-files | grep -i -E "pem|key"` prints no private key.

---

## Phase 2: Sign, Trial and Confirm

### Entry Criteria
- Bootloader builds and boots the current application.

### Actions
1. Sign (MCUboot, non-Zephyr): `imgtool sign --key <signing_key_path> --header-size <hdr> --align <write alignment> --version <x.y.z> --slot-size <slot size> --pad-header app.bin app_signed.bin`. Header size must match the offset the application is linked at; alignment is the flash write granularity from the reference manual. Verify: `imgtool verify --key <signing_key_path> app_signed.bin`.
2. Confirm logic in the new application: run a self-test (peripherals initialize, main loop reaches steady state, communications up), then confirm:
   - MCUboot with Zephyr: `boot_write_img_confirmed()`.
   - MCUboot elsewhere: `boot_set_confirmed()` from bootutil (check the header of your MCUboot version).
   - ESP-IDF: `esp_ota_mark_app_valid_cancel_rollback()`; on self-test failure `esp_ota_mark_app_invalid_rollback_and_reboot()`.
3. Upload new images as a test (trial) upgrade, not permanent: MCUboot `boot_request_upgrade(BOOT_UPGRADE_TEST)` or `mcumgr image test <hash>`; ESP-IDF OTA marks a new image pending verification automatically when rollback is enabled.
4. If the self-test hangs, the watchdog from `watchdog_record` resets the device and the bootloader reverts because the image was never confirmed.

### Output
Signed image and confirm path.

### Quality Gate
- `imgtool verify` prints a success result (copied into the record), or the ESP-IDF build prints the signed or unsigned app status as configured.
- The confirm call appears exactly once, after the self-test (file and line recorded).

---

## Phase 3: Bench Tests

### Entry Criteria
- Bench setup only; any actuator the device controls is disconnected or behind an independent hardware emergency stop.
- A controllable power switch for the power-loss test.

### Actions
1. Good update: install version N+1 as a test image, reboot, self-test passes, confirm. After another reboot the device still reports N+1.
2. Rollback: build N+2 with the confirm call removed. Install as test, reboot (runs N+2), reboot again: the device must report N+1.
3. Bad signature: sign N+3 with a different key; install. The bootloader must reject it and keep running N+1 (read the bootloader log).
4. Power loss during swap: start an update and cut power during the swap (repeat at several points in the swap duration). After each power-up, the device must boot either N+1 or the new image, never neither.
5. Record version reported after each step.

### Output
`update_test_record`.

### Quality Gate
- Each of the four tests has the expected version reported after reboot (log lines recorded).
- Zero power-loss trials ended in a device that does not boot.

---

## Worked Example

Illustrative. `stack` = esp-idf, ESP32-S3, 8 MB flash.

- Phase 1: partition table `otadata` 0x2000, `ota_0` and `ota_1` 0x300000 each at 64 KB aligned offsets; `CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE=y`.
- Phase 2: `app_main` runs `selftest()` then `esp_ota_mark_app_valid_cancel_rollback()` (main/app.c:57).
- Phase 3: v1.4.0 updates and stays. v1.4.1 without confirm: after second reboot log shows `Rollback to previously worked partition` and `version 1.4.0`. Secure boot not enabled on this bench unit, so the bad-signature test is recorded as not applicable with that reason. Ten power cuts during OTA write and boot: all ten booted.

---

## Exit Criteria

DONE when images are signed, a new image must confirm itself after a self-test, and the bench shows confirmed update, automatic rollback, signature rejection (or a stated reason it does not apply) and survival of power loss during swap.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `test_report` shows failures | **Stop**: fix tests first; an update path for failing code ships the failure. |
| Phase 1 | Slot not sector aligned | **Adjust**: move slot boundaries to sector multiples. |
| Phase 2 | Bootloader reports bad image header | **Adjust**: header size in `imgtool sign` must equal the application's link offset. |
| Phase 3 | Unconfirmed image stays after reboot | **Stop**: the image was installed as permanent or confirm still runs; fix before release. |
| Phase 3 | Device does not boot after power loss | **Stop**: the swap mode or scratch sizing is wrong; review the MCUboot design document. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
