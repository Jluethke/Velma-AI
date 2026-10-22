# Biomarker Identification Validation

Identify and validate the neural biomarker that reliably tracks the disease state or symptom to serve as the control signal for adaptive stimulation.

## Inputs

- `therapeutic-objective`: Disease or symptom to modulate (Parkinson's tremor/bradykinesia, essential tremor, epileptic seizures, chronic pain, depression)
- `recording-capabilities`: Available neural signals (LFP from implanted leads, ECoG, scalp EEG, peripheral nerve)

## Outputs

- `validated-biomarker`: Selected biomarker (signal type, frequency band, spatial location), its correlation with symptom severity, and detection reliability metrics (sensitivity, specificity, latency)
- `biomarker-characterization-data`: Receiver operating characteristic (ROC) curve for biomarker-based symptom detection, showing the sensitivity-specificity trade-off at different thresholds

## Process

1. Survey candidate biomarkers from clinical literature. Parkinson's disease: beta (13-30 Hz) power in STN LFP correlates with bradykinesia and rigidity (r = 0.5-0.7 with UPDRS III). Gamma (60-90 Hz) activity increases with dyskinesia. Tremor has a specific tremor-frequency oscillation (4-6 Hz) in STN. Essential tremor: cerebellar-thalamic oscillation at tremor frequency. Epilepsy: pre-ictal changes (increased high-frequency oscillations 80-500 Hz, decreased low-frequency power) precede seizure onset by seconds to minutes. Chronic pain: theta (4-8 Hz) power in anterior cingulate cortex. Depression: theta/alpha ratio in prefrontal cortex (less established, still under research).
2. Collect paired biomarker-symptom data. Record the candidate neural signals continuously while simultaneously measuring symptom severity. For Parkinson's: record STN LFP during structured motor tasks (finger tapping, gait) with video-based UPDRS scoring by a blinded rater. For epilepsy: long-term monitoring (days to weeks) with simultaneous EEG/ECoG and seizure diary. For each time segment, extract the biomarker value (e.g., beta band power) and the corresponding symptom score.
3. Validate biomarker performance. Build a ROC curve: at each threshold of the biomarker, calculate sensitivity (true positive rate: correctly identifies high-symptom periods) and specificity (true negative rate: correctly identifies low-symptom periods). The area under the ROC curve (AUC) quantifies overall discriminability: AUC greater than 0.8 is good, greater than 0.9 is excellent. For Parkinson's beta power vs clinical state (ON/OFF medication): typical AUC is 0.8-0.9. For epileptic seizure detection: sensitivity greater than 90% is required clinically, with specificity determining false alarm rate.
4. Characterize biomarker dynamics. Measure the time course: how quickly does the biomarker change after stimulation onset? For Parkinson's beta: suppression begins within 0.5-2 seconds of stimulation onset, recovers within 1-5 seconds after offset. This time constant sets the minimum control loop update rate and influences controller design. Measure biomarker variability: within-session (minutes), across-session (days), across-patient. High inter-patient variability means the threshold must be individualized.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
