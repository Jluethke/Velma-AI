# Perception Fine-Tune a YOLO Detector with Ultralytics (Python)

**One-line description:** Converts the COCO train and validation splits to the Ultralytics YOLO label layout, runs each planned fine-tune experiment with the `yolo detect train` CLI, reads `results.csv` to pick the best experiment by validation mAP, and keeps the holdout set untouched.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `training_plan` (object, required): From `perc-train-vs-finetune-decision`, with experiments.
- `train_annotations` (string, required): COCO JSON for training.
- `val_annotations` (string, required): COCO JSON for validation.
- `dataset_dir` (string, required): Root holding the images.

---

## Outputs

- `trained_checkpoint` (string): Path to the selected `best.pt`.
- `training_log` (object): Per experiment: command line, `args.yaml` path, `results.csv` path, best epoch, validation `metrics/mAP50(B)` and `metrics/mAP50-95(B)`, and the git hash or `pip show ultralytics` version.

---

## Phase 1: Prepare the YOLO Dataset

### Entry Criteria
- `training_plan` path is "fine_tune" or "from_scratch".
- A CUDA GPU is visible: `python -c "import torch;print(torch.cuda.is_available())"` prints `True`.

### Actions
1. `pip install ultralytics` in a fresh virtual environment and record `pip show ultralytics` version.
2. Convert labels: Ultralytics expects one `.txt` per image with lines `class cx cy w h`, all normalized to 0..1 by image width and height, and class ids starting at 0. Convert each COCO box `[x, y, w, h]` as `cx=(x+w/2)/W`, `cy=(y+h/2)/H`, `w/W`, `h/H`, class `category_id - 1`. Ultralytics also ships `ultralytics.data.converter.convert_coco`; if you use it, check its signature in the installed version and confirm the class offset it applies.
3. Skip `iscrowd=1` annotations when writing YOLO labels; YOLO labels have no ignore flag.
4. Lay out `images/train`, `images/val`, `labels/train`, `labels/val` in a new folder (symlinks to the images are fine). Labels are found by replacing `images` with `labels` in the path.
5. Write `data.yaml` with keys `path`, `train`, `val`, and `names` (a dict `{0: Car, 1: Pedestrian, ...}` in category order). Do NOT add the holdout set as `val` or `test`.

### Output
A YOLO dataset folder and `data.yaml`.

### Quality Gate
- `yolo detect val model=yolov8s.pt data=data.yaml` (or the planned base model) runs to completion and prints the label count it found; it equals the non-crowd validation box count.
- Five rendered training mosaics (`train_batch0.jpg` written by the first training run) show boxes on objects.

---

## Phase 2: Run the Planned Experiments

### Entry Criteria
- `data.yaml` validated.

### Actions
1. For each experiment run, one at a time:
   `yolo detect train data=data.yaml model=yolov8s.pt imgsz=640 epochs=<E> batch=<B> seed=<S> freeze=<N> device=0 project=runs name=<exp>`
   Use only values from `training_plan`. Omit `freeze` for a full fine-tune.
2. If a CUDA out-of-memory error occurs, lower `batch`; record the change. Do not lower `imgsz`, because that changes the experiment.
3. Each run writes `runs/<exp>/weights/best.pt`, `last.pt`, `results.csv` and `args.yaml`. Keep all of them.
4. Do NOT edit `results.csv` or delete failed runs. A failed run is a result.

### Output
One run folder per experiment.

### Quality Gate
- Every experiment folder has `weights/best.pt` and `results.csv`, or a recorded failure.

---

## Phase 3: Select the Best Experiment on Validation

### Entry Criteria
- All experiments finished or failed with a record.

### Actions
1. Read each `results.csv` with the `csv` module; the columns include `metrics/mAP50(B)` and `metrics/mAP50-95(B)` (column names have leading spaces in some versions; strip them).
2. Pick the experiment with the highest `metrics/mAP50-95(B)` at its best epoch. Ties go to the one with fewer trainable parameters (frozen backbone).
3. Rerun validation on the chosen `best.pt`: `yolo detect val model=runs/<exp>/weights/best.pt data=data.yaml imgsz=640` and confirm it reproduces the logged number.
4. Write `training_log` and set `trained_checkpoint`.

### Output
`trained_checkpoint`, `training_log`.

### Quality Gate
- The rerun validation mAP50-95 matches the `results.csv` best-epoch value to the printed precision.
- `training_log` lists every experiment, including failed ones.

---

## Worked Example

Illustrative only. E1 full fine-tune: best epoch 87, `metrics/mAP50-95(B)` 0.512. E2 `freeze=10`: best epoch 92, 0.497. E1 chosen. `yolo detect val model=runs/E1/weights/best.pt data=data.yaml imgsz=640` prints `all 742 4310 0.861 0.774 0.843 0.512`.

---

## Exit Criteria

DONE when every planned experiment ran or has a recorded failure, the chosen checkpoint reproduces its validation mAP, and holdout was never read.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Label count mismatch in val run | **Return** to the conversion step; check the class offset and normalization. |
| Phase 2 | CUDA out of memory | **Adjust** `batch` and **Retry**; record it. |
| Phase 2 | Loss becomes NaN | **Stop** the run; check for degenerate labels, then **Retry** with the plan's learning rate unchanged. |
| Phase 3 | Rerun does not reproduce logged mAP | **Stop**: compare `args.yaml` of the run with the rerun arguments. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
