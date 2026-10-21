# Supply Chain Security Report

Compile supply chain security findings into a prioritized report with a remediation roadmap.

## Inputs

- `vulnerability-report`: CVE scan findings
- `confusion-findings`: Dependency confusion findings
- `integrity-findings`: Package integrity findings
- `reproducibility-results`: Build reproducibility results

## Outputs

- `supply-chain-report`: Complete software supply chain security audit report
- `remediation-roadmap`: Phased roadmap for supply chain security improvements

## Process

1. Classify findings by SLSA level and supply chain attack taxonomy
2. Prioritize by exploitability and blast radius
3. Build a phased remediation roadmap (immediate patches, tooling adoption, process changes)
4. Produce the final report with executive summary and technical appendix

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
