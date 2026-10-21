# Voicemail System Test

Test voicemail system security including default PINs, message access, and greeting manipulation.

## Inputs

- `extension-list`: Valid extensions with voicemail
- `voip-topology`: Voicemail system architecture

## Outputs

- `voicemail-findings`: Voicemail security weaknesses found
- `default-pin-results`: Extensions found with default or weak PINs

## Process

1. Test for default voicemail PINs (1234, 0000, matching extension number)
2. Check for remote voicemail access without PIN requirements
3. Test for voicemail-to-email forwarding to unauthorized addresses
4. Verify auto-attendant and IVR input handling for unexpected inputs

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
