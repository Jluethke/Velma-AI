# Post Market Surveillance Plan

Design the post-market surveillance system for a neural device to monitor long-term safety, track device performance, and comply with reporting requirements.

## Inputs

- `clinical-trial-protocol`: Clinical endpoints and safety monitoring plan
- `device-description`: Device characteristics and risk profile

## Outputs

- `post-market-plan`: Complaint handling, MDR reporting procedures, post-market clinical follow-up study design, and corrective action triggers
- `cybersecurity-post-market-plan`: Vulnerability monitoring, patch management, coordinated disclosure process for connected neural devices

## Process

1. Establish complaint handling per 21 CFR 820.198. Every patient or clinician complaint must be logged, investigated, and classified (device malfunction, adverse event, use error). For neural implants: track electrode impedance trends from follow-up visits (progressive increase may indicate encapsulation failure), stimulation threshold changes (may indicate lead migration), and infection rates (typically 2-5% for cranial implants).
2. Define Medical Device Reporting (MDR) triggers per 21 CFR 803. Report to FDA within 30 days: any death or serious injury where the device may have caused or contributed, and any malfunction that would likely cause or contribute to death or serious injury if it recurred. For neural devices, reportable events include: lead fracture, infection requiring explant, hemorrhage from implant procedure, unexpected stimulation effects, device malfunction requiring surgical intervention. Track complaint trends to detect emerging signals.
3. Design post-market clinical follow-up (PMCF). For PMA devices: FDA may require a post-approval study as a condition of approval. Typical: enroll 100-500 additional subjects at multiple sites, follow for 3-5 years. Track the same primary endpoint as the pivotal trial plus long-term safety (5-year infection rate, lead integrity, battery longevity). For devices marketed in the EU under MDR: PMCF is mandatory, with periodic safety update reports (PSUR) submitted to the notified body annually.
4. For connected/wireless neural devices: implement a cybersecurity post-market plan. Monitor for vulnerabilities in the device software, wireless communication protocol, and connected systems (clinician programmer, patient controller). Establish a coordinated vulnerability disclosure process. Design and validate a secure firmware update mechanism for the implanted device (if applicable) or external components. Test updates on bench before deployment. Maintain a software bill of materials (SBOM) and monitor for CVEs in third-party components.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
