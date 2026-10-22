# Biocompatibility Material Selection

Select implant materials from the ISO 10993 framework based on contact type, duration, and body tissue, then define the required testing pathway.

## Inputs

- `implant-functional-requirements`: What the implant must do (record, stimulate, drug delivery), where it is placed (brain, peripheral nerve, spinal cord), and how long it stays (acute under 24h, limited 1-30 days, prolonged over 30 days)
- `implant-form-factor`: Physical size, shape, and mechanical constraints from the surgical approach and target anatomy

## Outputs

- `material-selections`: Selected materials for each implant component (substrate, encapsulation, electrode, conductor, connector) with rationale
- `biocompatibility-test-matrix`: Required ISO 10993 tests mapped to each material and contact category (cytotoxicity, sensitization, irritation, acute systemic toxicity, subchronic toxicity, genotoxicity, implantation, hemocompatibility as applicable)

## Process

1. Classify the implant by ISO 10993-1: contact type (surface, external communicating, or implant device), contact tissue (bone, tissue/tissue fluid, blood), and contact duration (limited, prolonged, permanent). A chronic intracortical neural implant is: implant device, tissue/tissue fluid contact, permanent duration. This is the highest risk category requiring the most extensive testing.
2. Select substrate material. Silicon: well-characterized, standard for Utah and Neuropixels arrays, but brittle and stiff (170 GPa vs brain tissue 1 kPa, 5 orders of magnitude mismatch drives chronic inflammation). Flexible polymers: polyimide (3 GPa, better but still stiff), parylene-C (4 GPa, pinhole-free thin-film conformal coating, USP Class VI), SU-8 (photopatternable but limited biocompatibility data for chronic). For brain implants, compliance matching favors polymer substrates.
3. Select encapsulation. Hermetic titanium: gold standard for active implantable devices (pacemakers, cochlear implants), zero moisture ingress, but adds bulk. Ceramic (alumina): RF transparent for wireless, hermetic, but brittle. Thin-film encapsulation (parylene-C, 5-20 um): lightweight, conformal, but moisture penetration limits lifetime to 1-5 years depending on thickness and defects. Liquid crystal polymer (LCP): emerging alternative with low moisture absorption.
4. Map required biocompatibility tests from ISO 10993-1 Table A.1. For a permanent implant in tissue contact: cytotoxicity (ISO 10993-5, cell culture), sensitization (ISO 10993-10, guinea pig or local lymph node), irritation/intracutaneous reactivity, acute systemic toxicity, subchronic toxicity (90-day implant study), genotoxicity (Ames, chromosomal aberration, mouse lymphoma), implantation study (ISO 10993-6, histological evaluation at the implant site), chronic toxicity, and carcinogenicity. Materials with extensive prior use (titanium, medical-grade silicone, parylene-C) may qualify for reduced testing via biological safety justification.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
