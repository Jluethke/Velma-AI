# Ephys Event Detector

Detect neural events (spikes, synaptic potentials, oscillations) in filtered traces.

## Inputs

- `filtered-traces`: Bandpass-filtered recordings
- `detection-parameters`: Threshold, template, or other detection settings

## Outputs

- `detected-events`: Timestamps and waveform snippets for each detected event
- `detection-summary`: Event counts, firing rates, and inter-event interval distributions

## Process

1. Set the detection threshold (absolute voltage, RMS multiple, or template match score)
2. Scan the trace and extract event timestamps and surrounding waveform snippets
3. Reject false positives by waveform shape or refractory period violation
4. Compute event rates and inter-event interval distributions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
