# Perception Lidar Ground Removal with PCL SACSegmentation (C++)

**One-line description:** Implements lidar ground removal in C++ with the Point Cloud Library: crop, `VoxelGrid` downsample, `SACSegmentation` with `SACMODEL_PERPENDICULAR_PLANE` constrained to the vertical axis, and `ExtractIndices` to keep non-ground points, with per-sweep plane checks and timing.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `point_cloud_dir` (string, required): Folder of lidar sweeps recorded from the user's own sensor or a public dataset.
- `lidar_mount` (object, required): Mounting height in meters and axis convention, from the vehicle setup or dataset calibration.

---

## Outputs

- `cpp_nonground_clouds` (string): Folder of non-ground `.pcd` files.
- `cpp_ground_report` (object): Per sweep: plane coefficients, inlier count, normal angle, plane height at origin, time per stage, and parameters with sources.

---

## Phase 1: Build Setup and Loading

### Entry Criteria
- PCL installed (`apt install libpcl-dev` on Ubuntu, or vcpkg `pcl` on Windows); record the version from `pcl_config.h` (`PCL_VERSION_PRETTY`).
- This flow processes recorded data only and sends nothing to any vehicle.

### Actions
1. CMake: `find_package(PCL REQUIRED COMPONENTS common io filters segmentation sample_consensus)`; `target_include_directories(app PRIVATE ${PCL_INCLUDE_DIRS})`; `target_link_libraries(app ${PCL_LIBRARIES})`. Build in Release (`-DCMAKE_BUILD_TYPE=Release`); PCL in Debug is many times slower and timing is meaningless.
2. Load `.pcd` with `pcl::io::loadPCDFile<pcl::PointXYZI>(path, *cloud)`. For KITTI `.bin`, read float32 quadruples with `std::ifstream` in binary mode into `pcl::PointXYZI`.
3. Crop with `pcl::CropBox<pcl::PointXYZI>` (`setMin`, `setMax` as `Eigen::Vector4f`) to the user's region, and a second `CropBox` with `setNegative(true)` to remove the vehicle body.
4. Downsample with `pcl::VoxelGrid<pcl::PointXYZI>` and `setLeafSize(lx, ly, lz)` from the user.

### Output
Prepared clouds.

### Quality Gate
- Release build exits 0; raw and downsampled counts printed for five sweeps.

---

## Phase 2: Segment the Ground Plane

### Entry Criteria
- Prepared clouds.

### Actions
1. Configure: `pcl::SACSegmentation<pcl::PointXYZI> seg; seg.setOptimizeCoefficients(true); seg.setModelType(pcl::SACMODEL_PERPENDICULAR_PLANE); seg.setAxis(Eigen::Vector3f(0,0,1)); seg.setEpsAngle(eps_rad); seg.setMethodType(pcl::SAC_RANSAC); seg.setDistanceThreshold(dist_thr); seg.setMaxIterations(iters);` with `eps_rad`, `dist_thr` and `iters` from the user. `SACMODEL_PERPENDICULAR_PLANE` only accepts planes whose normal is within `eps_rad` of the axis, so walls are rejected by the model.
2. Optionally prefilter candidates with `pcl::PassThrough` on `z` around `-mount_height` before `seg.segment(*inliers, *coeffs)`.
3. If `inliers->indices.empty()`, record a failed sweep; do not pass the raw cloud on as "non-ground".
4. Remove ground from the full cloud by plane distance (`pcl::pointToPlaneDistance` from `pcl/common/distances.h`, or compute it directly) so ground outside the prefilter band is also removed. Use `pcl::ExtractIndices<pcl::PointXYZI>` with `setNegative(true)` to keep the rest.

### Output
Non-ground clouds and plane coefficients.

### Quality Gate
- Each sweep prints coefficient values and inlier count, or is listed as failed.

---

## Phase 3: Verify, Time and Save

### Entry Criteria
- Segmentation finished.

### Actions
1. Plane height at origin `|d / c|` vs mount height; print the difference.
2. Time each stage with `std::chrono::steady_clock`; report median and p99 over all sweeps.
3. Save with `pcl::io::savePCDFileBinary(out, *ng)`.
4. Compare with the Python Open3D result on the same five sweeps if both stacks exist: non-ground point counts and plane coefficients. Differences come from RANSAC randomness and voxel grid conventions; record them, do not force equality.

### Output
`cpp_nonground_clouds`, `cpp_ground_report`.

### Quality Gate
- Height difference per sweep printed; stage timing table with median and p99 printed.

---

## Worked Example

Illustrative only. PCL 1.14, Release. Sweep 000010: VoxelGrid 0.1 m leaf, 54,410 points. `SACMODEL_PERPENDICULAR_PLANE`, axis z, eps 5 degrees in radians, distance 0.15 m, 200 iterations (all user values). Coefficients `(0.007, -0.003, 0.99997, 1.715)`, height diff 0.015 m. Stage medians: crop 0.8 ms, voxel 3.1 ms, RANSAC 2.4 ms, extract 0.6 ms.

---

## Exit Criteria

DONE when every sweep has a constrained ground plane or a recorded failure, non-ground clouds are saved, and Release-build stage times are measured.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Linker errors for PCL components | **Adjust** `find_package` COMPONENTS to include the missing module and **Retry**. |
| Phase 2 | Empty inliers | **Adjust** the prefilter band or `eps_rad` with the user, **Retry**; else record failure. |
| Phase 3 | Very slow timing | **Stop**: confirm Release build before any other change. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
