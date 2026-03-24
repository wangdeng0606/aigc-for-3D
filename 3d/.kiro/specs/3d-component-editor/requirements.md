# Requirements Document

## Introduction

本文档定义了一个基于 Three.js 的简单 3D 组件编辑器的需求。该编辑器允许用户从左侧组件面板拖拽基础几何体到右侧 3D 场景中，重点关注物体的功能性和行为而非复杂的 3D 建模。

## Glossary

- **Component_Panel**: 左侧的组件面板，显示可拖拽的基础几何体列表
- **Scene_Canvas**: 右侧的 3D 场景画布，用于渲染和交互
- **Geometry_Component**: 基础几何体组件（立方体、球体、圆柱体等）
- **Drag_System**: 拖拽交互系统，处理从组件面板到场景的拖拽操作
- **Three_Renderer**: Three.js 渲染器，负责 3D 场景的渲染
- **Camera_Controller**: 相机控制器，允许用户查看场景的不同角度

## Requirements

### Requirement 1: 组件面板显示

**User Story:** 作为用户，我希望在左侧看到可用的基础几何体组件列表，以便我可以选择并拖拽它们到场景中。

#### Acceptance Criteria

1. THE Component_Panel SHALL display a list of basic geometry components including cube, sphere, cylinder, cone, and torus
2. WHEN the application loads, THE Component_Panel SHALL be positioned on the left side of the viewport
3. THE Component_Panel SHALL display each geometry component with a visual preview and label
4. THE Component_Panel SHALL occupy no more than 20% of the viewport width
5. THE Component_Panel SHALL have a scrollable area if the component list exceeds the viewport height

### Requirement 2: 3D 场景初始化

**User Story:** 作为用户，我希望右侧有一个简洁的 3D 场景，以便我可以在其中放置和查看 3D 组件。

#### Acceptance Criteria

1. THE Scene_Canvas SHALL be positioned on the right side of the viewport occupying the remaining space
2. WHEN the application loads, THE Three_Renderer SHALL initialize with a white background
3. THE Scene_Canvas SHALL include a perspective camera with appropriate field of view
4. THE Scene_Canvas SHALL include basic ambient lighting and directional lighting
5. THE Scene_Canvas SHALL display a subtle grid helper on the ground plane for spatial reference

### Requirement 3: 拖拽交互

**User Story:** 作为用户，我希望能够从组件面板拖拽几何体到场景中，以便我可以构建 3D 场景。

#### Acceptance Criteria

1. WHEN a user clicks and holds on a geometry component in the Component_Panel, THE Drag_System SHALL initiate a drag operation
2. WHILE dragging, THE Drag_System SHALL display a visual indicator following the mouse cursor
3. WHEN the user releases the mouse over the Scene_Canvas, THE Drag_System SHALL create a new geometry instance in the scene
4. WHEN placing a geometry, THE Drag_System SHALL calculate the 3D position based on the mouse cursor position using raycasting
5. IF the raycast does not intersect with the ground plane, THEN THE Drag_System SHALL place the geometry at a default position

### Requirement 4: 场景中的物体放置

**User Story:** 作为用户，我希望拖拽的几何体能够准确地放置在我鼠标指向的位置，以便我可以精确控制物体的位置。

#### Acceptance Criteria

1. WHEN a geometry is dropped onto the Scene_Canvas, THE Drag_System SHALL use raycasting to determine the intersection point with the ground plane
2. THE Drag_System SHALL place the geometry at the calculated 3D position
3. WHEN a geometry is placed, THE Scene_Canvas SHALL immediately render the new geometry
4. THE placed geometry SHALL have default material properties provided by Three.js
5. THE placed geometry SHALL have a reasonable default size appropriate for the scene scale

### Requirement 5: 相机控制

**User Story:** 作为用户，我希望能够旋转、缩放和平移相机视角，以便我可以从不同角度查看场景中的物体。

#### Acceptance Criteria

1. THE Camera_Controller SHALL support orbit controls for rotating the camera around the scene center
2. WHEN the user drags with the right mouse button or middle mouse button, THE Camera_Controller SHALL rotate the camera
3. WHEN the user scrolls the mouse wheel, THE Camera_Controller SHALL zoom the camera in or out
4. THE Camera_Controller SHALL prevent the camera from going below the ground plane
5. THE Camera_Controller SHALL maintain smooth camera movements with damping

### Requirement 6: 基础几何体属性

**User Story:** 作为开发者，我希望每个基础几何体都有标准的 Three.js 属性，以便后续可以扩展功能性和行为。

#### Acceptance Criteria

1. THE Geometry_Component SHALL be created using Three.js standard geometry classes
2. WHEN a geometry is created, THE Drag_System SHALL assign it a unique identifier
3. THE Geometry_Component SHALL use MeshStandardMaterial as the default material
4. THE Geometry_Component SHALL have default dimensions appropriate for the scene scale
5. THE Geometry_Component SHALL be added to the Three.js scene graph upon placement

### Requirement 7: 应用程序结构

**User Story:** 作为开发者，我希望应用程序使用原生 JavaScript 和 Three.js，以便保持简单性和直接的 API 访问。

#### Acceptance Criteria

1. THE application SHALL be built using vanilla JavaScript without frontend frameworks
2. THE application SHALL use Three.js as the only external 3D library dependency
3. THE application SHALL use ES6 modules for code organization
4. THE application SHALL have a modular architecture separating UI, scene management, and drag logic
5. THE application SHALL use a modern build tool for development and bundling

### Requirement 8: 响应式布局

**User Story:** 作为用户，我希望应用程序能够适应不同的窗口大小，以便我可以在不同尺寸的屏幕上使用。

#### Acceptance Criteria

1. WHEN the browser window is resized, THE Scene_Canvas SHALL update its dimensions to maintain the layout
2. WHEN the window is resized, THE Three_Renderer SHALL update its size and aspect ratio
3. WHEN the window is resized, THE Camera_Controller SHALL update the camera aspect ratio
4. THE Component_Panel SHALL maintain its relative width during window resize
5. THE layout SHALL remain functional on screens with minimum width of 1024 pixels
