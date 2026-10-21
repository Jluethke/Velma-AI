# Mobile Binary Analysis

Decompile and analyze the mobile application binary for hardcoded secrets, obfuscation level, and code structure.

## Inputs

- `application-binary`: APK (Android) or IPA (iOS) file to analyze
- `platform`: Target platform (iOS, Android, or both)

## Outputs

- `binary-analysis-results`: Decompiled code analysis findings
- `obfuscation-assessment`: Assessment of code obfuscation and anti-tampering protections

## Process

1. Decompile the binary (jadx for Android, class-dump/Hopper for iOS).
2. Search for hardcoded API keys, secrets, tokens, and credentials.
3. Assess obfuscation level and identify any anti-tampering or root/jailbreak detection.
4. Map the application's internal structure, libraries, and third-party SDKs.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
