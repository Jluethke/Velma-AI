# Single Cell Qc Preprocessing

Process raw single-cell count matrices through quality control, doublet removal, and normalization. Filter cells by minimum gene count (200-500 genes), maximum mitochondrial percentage (species-dependent: 5-20%), and minimum UMI count. Detect doublets with Scrublet (simulates doublets by averaging random cell pairs and scores each cell by nearest-neighbor overlap with simulated doublets).

## Inputs

- `raw-count-matrix`: Genes-by-cells sparse count matrix from Cell Ranger or STARsolo
- `sample-metadata`: Sample identifiers, experimental conditions, batch information

## Outputs

- `filtered-adata`: Quality-filtered AnnData object with normalized and log-transformed counts
- `qc-metrics`: Per-cell QC metrics, filtering thresholds applied, cells removed per filter

## Process

1. Load count matrix into AnnData (Scanpy) or Seurat object. Calculate per-cell QC metrics: total UMI count (nCount_RNA), number of detected genes (nFeature_RNA), percentage mitochondrial reads (percent.mt from MT- prefixed genes), percentage ribosomal reads.
2. Set QC thresholds adaptively: use median absolute deviation (MAD) from the median for each metric. Flag cells more than 3 MAD below median gene count (empty droplets) or more than 3 MAD above median gene count (potential doublets or multiplets). For mitochondrial percentage, cells above 20% (human) or 10% (mouse) are typically dying/damaged cells with compromised membranes.
3. Run Scrublet for doublet detection: scrublet.Scrublet(counts_matrix).scrub_doublets(). Scrublet simulates doublets from the data, projects them into the cell embedding, and scores real cells by proximity to simulated doublets. Expected doublet rate depends on cell loading: approximately 0.8% per 1000 cells loaded (10x Chromium). Set threshold at the bimodal distribution minimum between singlet and doublet score peaks.
4. Remove ambient RNA contamination with SoupX or CellBender. Ambient RNA from lysed cells is captured in all droplets and inflates counts of highly expressed genes. SoupX estimates the contamination fraction from the empty droplet profile and corrects counts.
5. Normalize with SCTransform (Seurat) or scran pooling (Scanpy): SCTransform uses regularized negative binomial regression to model the relationship between mean expression and variance, removing technical variance while preserving biological variance. Standard log-normalization (NormalizeData with scale.factor=10000) is simpler but assumes a constant size factor.
6. Select highly variable genes (HVGs): 2000-3000 genes for standard analysis. SCTransform selects HVGs based on residual variance from the regularized model. For standard normalization, use the vst method (variance-stabilizing transformation) to select genes with highest residual variance after controlling for mean expression.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
