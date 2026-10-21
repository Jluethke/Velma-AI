# File Upload Extension Bypass

Test for file extension validation bypass using double extensions, null bytes, and alternate encodings.

## Inputs

- `upload-endpoints`: Upload endpoints
- `validation-mechanisms`: Validation mechanisms in place

## Outputs

- `extension-bypass-results`: Extension bypass test results
- `successful-bypasses`: Extension bypass techniques that succeeded

## Process

1. Test double extensions (file.php.jpg, file.asp;.jpg)
2. Test null byte injection in filenames (file.php%00.jpg)
3. Test case variations and alternate extensions (.pHp, .php5, .phtml)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
