# Extension Manifest Permission Review

Analyze the extension manifest and catalog all requested permissions, host permissions, and content security policy directives.

## Inputs

- `extension-source`: Path or URL to the unpacked extension source
- `browser-target`: Target browser (Chrome, Firefox, Edge)

## Outputs

- `permission-inventory`: Categorized list of all permissions with risk ratings
- `manifest-findings`: Issues found in the manifest configuration

## Process

1. Parse the manifest.json and extract all permission declarations
2. Classify each permission by risk level (low, medium, high, critical)
3. Check content security policy for unsafe directives (unsafe-eval, unsafe-inline)
4. Document excessive or unnecessary permissions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
