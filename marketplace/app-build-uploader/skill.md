# App Build Uploader

Upload the app build and configure distribution settings.

## Inputs

- `compliance-forms`: All forms completed
- `listing-package`: The store listing

## Outputs

- `uploaded-build`: Build uploaded and associated with the store listing
- `distribution-settings`: Pricing, countries, and release type configured

## Process

1. Build the release version of the app.
2. Upload the build to the app store console.
3. Configure pricing, country availability, and release type (immediate or phased).
4. Associate the build with the prepared listing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
