# Container Image Scan

Scan container base images and application images for known vulnerabilities (CVEs) and outdated packages.

## Inputs

- `image-registry`: Container registry URL and access credentials
- `image-list`: List of container images to scan

## Outputs

- `image-vulnerabilities`: List of CVEs found in each image with severity
- `base-image-report`: Base image freshness and update status

## Process

1. Pull each image and extract the package manifest.
2. Scan against CVE databases (NVD, vendor advisories) for known vulnerabilities.
3. Check base image age and whether newer patched versions exist.
4. Classify findings by severity and exploitability.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
