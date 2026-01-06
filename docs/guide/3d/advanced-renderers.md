# Specialized 3D Renderers

Learn about the high-performance specialized renderers for complex 3D data.

## Introduction

While the core 3D series cover basic scatter and surface plots, many scientific applications require specialized geometry. SciChart Engine provides six specialized renderers optimized for specific data types.

## 1. Waterfall Renderer
**Type**: `'waterfall'`
**Use Case**: Spectral analysis, Audio signals.

The Waterfall renderer displays 2D slices stacked along the Z-axis. It supports:
- **Real-time streaming**: Push new slices efficiently.
- **Area/Line styles**: Choose between filled surfaces or discrete lines.
- **Depth fading**: Automatically fade older data.

## 2. Vector Field (Quiver)
**Type**: `'quiver'`
**Use Case**: CFD, Electromagnetics, Wind patterns.

Visualizes 3D vectors as arrows. Each arrow's orientation and length are determined by the direction vector.
- **Instanced architecture**: Render 10,000+ arrows at 60 FPS.
- **Magnitude scaling**: Arrows automatically scale by vector length.

## 3. High-Density Point Cloud
**Type**: `'pointcloud'`
**Use Case**: LIDAR, Particle physics, t-SNE clusters.

Optimized to render millions of points.
- **Depth Attenuation**: Points get smaller as they recede into the distance.
- **Marker Shapes**: Choose between high-performance squares or smooth circles.

## 4. Voxel (Volumetric Heatmap)
**Type**: `'voxel'`
**Use Case**: MRI/CT Scans, 3D Scalar fields.

A voxel (volume-pixel) grid for 3D intensity data.
- **GPU Thresholding**: Interactively "peel" through layers of volume.
- **Built-in Lighting**: Surface-based shading for depth perception.

## 5. Ribbon 3D
**Type**: `'ribbon'`
**Use Case**: Flow trajectories, comparison of signals.

Renders paths as extruded "tapes" or ribbons.
- **Calculated Normals**: Segments are lit based on their curvature.
- **Variable Width**: Control the thickness of the ribbon along the path.

## 6. Surface Bar (3D Histogram)
**Type**: `'column'`
**Use Case**: spatial distributions, 3D bar charts.

Optimized for grid-based vertical columns.
- **Base Plane Alignment**: All bars start from a shared ground plane.
- **High performance**: Uses vertex instancing for immediate updates of dense grids.

## Choosing the Right Renderer

| Data Structure | Recommended Renderer |
| :--- | :--- |
| Disordered points | `PointCloud3DRenderer` |
| Directional flow | `VectorField3DRenderer` |
| Time-stacked spectra | `Waterfall3DRenderer` |
| Volumetric grid | `Voxel3DRenderer` |
| Continuous paths | `Ribbon3DRenderer` |
| Grid distribution | `SurfaceBar3DRenderer` |
