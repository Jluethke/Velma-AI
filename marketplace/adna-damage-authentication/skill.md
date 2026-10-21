# Adna Damage Authentication

Authenticate the ancient DNA by verifying characteristic damage patterns (C-to-T deamination at fragment ends) and fragment length distribution.

## Inputs

- `filtered-alignments`: Quality-filtered alignments to the reference genome
- `library-metrics`: Library preparation details (UDG treatment status)

## Outputs

- `damage-profile`: Misincorporation patterns at read ends showing the expected C-to-T enrichment
- `authentication-verdict`: Assessment of whether the DNA is authentically ancient based on damage and fragment patterns

## Process

1. Run mapDamage or DamageProfiler to compute misincorporation rates at each position from the read ends
2. Verify the expected C-to-T elevation at the 5-prime end (and G-to-A at 3-prime for non-UDG libraries)
3. Check that the fragment length distribution peaks in the 30-80 bp range typical of ancient DNA
4. Assess contamination estimates from the mitochondrial reads if sufficient coverage exists

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
