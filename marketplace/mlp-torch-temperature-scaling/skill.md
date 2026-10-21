# Temperature Scaling for a PyTorch Classifier

**One-line description:** Learns one temperature on held-out validation logits by minimizing negative log-likelihood with L-BFGS (Guo et al., 2017, "On Calibration of Modern Neural Networks"), wraps the model so it returns calibrated probabilities, and proves accuracy is unchanged while NLL and ECE improve.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tuned_model` (object, required): From `mlp-optuna-search`; a PyTorch checkpoint and its model config.
- `split_manifest` (object, required): From `mlp-split-integrity-check`.
- `calibration_report` (object, required): From `mlp-calibration-diagnose`; must say `calibrate`.

---

## Outputs

- `torch_calibrated_model` (object): Path to `models/calibrated.pt` (state dict of the wrapper including the temperature buffer), the learned temperature, and before/after NLL, ECE and accuracy on rows not used to fit the temperature.

---

## Phase 1: Collect Validation Logits

### Entry Criteria
- `calibration_report.decision` is `calibrate`. If `skip`, return `tuned_model` as `torch_calibrated_model` with reason "skip".
- The checkpoint was trained on TRAIN rows only, so validation rows are unseen. If the only checkpoint is refit on train + val, **Stop** and use the train-only checkpoint from `mlp-optuna-search`.

### Actions
1. Split validation rows into two halves with a seeded generator: `fit_half` (learn T) and `check_half` (verify). Save both ID lists.
2. Collect logits with the model in eval mode and no grad:
   ```python
   model.eval()
   with torch.no_grad():
       logits = torch.cat([model(xb.to(dev)) for xb, _ in loader]).cpu()
   ```
   Keep logits (pre-softmax). Temperature scaling divides logits, not probabilities.
3. Confirm `model.eval()` was called: dropout and batch norm in training mode change logits between calls.

### Output
`logits_fit`, `labels_fit`, `logits_check`, `labels_check` tensors.

### Quality Gate
- Running the logit collection twice gives `torch.equal(l1, l2) == True`.

---

## Phase 2: Fit the Temperature

### Entry Criteria
- Logits collected.

### Actions
1. Optimize log T so T stays positive:
   ```python
   log_t = torch.zeros(1, requires_grad=True)
   opt = torch.optim.LBFGS([log_t], lr=0.1, max_iter=<user value>)
   nll = torch.nn.CrossEntropyLoss()
   def closure():
       opt.zero_grad()
       loss = nll(logits_fit / log_t.exp(), labels_fit)
       loss.backward()
       return loss
   opt.step(closure)
   T = log_t.exp().item()
   ```
   `lr` and `max_iter` are optimizer settings; check that the loss stops decreasing (print it before and after).
2. Binary model with one logit: use `BCEWithLogitsLoss` on `logit / T` instead.
3. Read T: T greater than 1 softens over-confident predictions (the usual case for deep networks per Guo et al.); T less than 1 sharpens timid ones. Record T.
4. Wrap the model:
   ```python
   class Calibrated(torch.nn.Module):
       def __init__(self, base, T):
           super().__init__()
           self.base = base
           self.register_buffer("temperature", torch.tensor([T]))
       def forward(self, x):
           return self.base(x) / self.temperature
   ```
   A buffer is saved in the `state_dict` and exported to ONNX; a plain Python float attribute is not saved.
5. Save `torch.save(wrapper.state_dict(), "models/calibrated.pt")` and the model config.

### Output
Wrapper with temperature.

### Quality Gate
- NLL on `fit_half` after scaling is lower than or equal to before (printed).
- `"temperature" in wrapper.state_dict()` prints `True`.

---

## Phase 3: Verify on the Check Half

### Entry Criteria
- Wrapper saved.

### Actions
1. On `check_half`, compute before and after: NLL, ECE (same binning as `calibration_report`), accuracy.
2. Accuracy must be identical: dividing all logits of a row by the same positive T does not change the argmax. Any change means the wrapper is not what was evaluated.
3. If NLL on `check_half` did not decrease, keep the uncalibrated model and record "temperature scaling did not help".
4. Log T and the before/after numbers to the tracker.

### Output
`torch_calibrated_model`.

### Quality Gate
- Accuracy before equals accuracy after exactly.
- NLL and ECE before/after on `check_half` are recorded.

---

## Worked Example

Illustrative only.

Input: ResNet-50 classifier, 12 classes, validation 20,000 images split 10,000/10,000.

```
fit_half  NLL before 0.912  after 0.701   T = 1.84
check_half          nll     ece(15,uniform)  accuracy
before              0.905   0.081            0.7712
after               0.703   0.019            0.7712
"temperature" in state_dict: True
```

---

## Exit Criteria

DONE when one positive temperature is learned on unseen validation logits, stored as a buffer, accuracy is unchanged, and NLL improvement is shown on a separate half.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Logits differ between two collections | **Adjust**: call `model.eval()` and disable test-time augmentation. |
| Phase 2 | Accuracy of argmax(`logits_fit`) against `labels_fit` is near the majority-class rate while the model's logged validation accuracy is higher | **Stop**: logits and labels are misaligned (loader order or shuffle); collect with `shuffle=False` and recheck. |
| Phase 2 | L-BFGS returns NaN | **Retry**: with a smaller `lr`; confirm logits contain no inf. |
| Phase 3 | Accuracy changed | **Return**: to Phase 2 step 4; the evaluated model is not the wrapper. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
