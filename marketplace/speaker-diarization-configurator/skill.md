# Speaker Diarization Configurator

Configure speaker diarization to identify who is speaking when.

## Inputs

- `engine-selection`: The transcription engine configuration
- `preprocessing-steps`: Audio preprocessing pipeline

## Outputs

- `diarization-config`: Speaker diarization configuration (number of speakers, voice enrollment, clustering parameters)
- `diarization-accuracy`: Diarization accuracy on sample audio (speaker confusion rate)

## Process

1. Determine whether the number of speakers is known or unknown per recording.
2. If speakers are known, configure voice enrollment for speaker identification.
3. If speakers are unknown, configure clustering-based diarization.
4. Test on sample audio and measure the speaker confusion rate.
5. Tune the parameters to minimize speaker confusion.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
