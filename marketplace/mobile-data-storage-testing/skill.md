# Mobile Data Storage Testing

Test how the application stores data locally including keychain/keystore usage, shared preferences, SQLite databases, and file system storage.

## Inputs

- `binary-analysis-results`: Code analysis showing storage mechanisms
- `platform`: Target platform

## Outputs

- `storage-findings`: Insecure local data storage findings
- `sensitive-data-map`: Map of where sensitive data is stored on the device

## Process

1. Check iOS Keychain and Android Keystore usage for credential storage.
2. Examine shared preferences and UserDefaults for sensitive data in plaintext.
3. Query SQLite databases for stored credentials, tokens, and personal data.
4. Check the application sandbox for sensitive files, logs, and cached data.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
