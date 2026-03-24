# Implementation Plan: 3D Component Editor

## Overview

本实现计划将 3D 组件编辑器的设计转化为可执行的开发任务。实现采用增量式开发方式，每个任务都建立在前一个任务的基础上，确保代码能够无缝集成。

实现顺序：
1. 项目基础设施和核心模块
2. 场景管理和渲染
3. UI 组件和布局
4. 拖拽交互系统
5. 集成和优化

## Tasks

- [x] 1. 项目初始化和基础设施
  - 创建项目目录结构
  - 初始化 npm 项目，安装依赖（Three.js, Vite, Vitest, fast-check）
  - 配置 Vite 构建工具
  - 配置 Vitest 测试框架
  - 创建基础 HTML 模板和入口文件
  - _Requirements: 7.2, 7.3, 7.5_

- [x] 2. 实现 SceneManager 核心功能
  - [x] 2.1 创建 SceneManager 类
    - 初始化 Three.js Scene, WebGLRenderer, PerspectiveCamera
    - 设置白色背景 (0xffffff)
    - 添加环境光和方向光
    - 添加 GridHelper 网格辅助线
    - 创建不可见的地面平面用于射线检测
    - 实现 addObject, removeObject, resize, render 方法
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 2.2 编写 SceneManager 单元测试
    - 测试场景初始化（背景色、灯光、网格）
    - 测试添加/移除物体功能
    - 测试 resize 方法更新渲染器和相机
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. 实现 CameraManager 和 RenderLoop
  - [x] 3.1 创建 CameraManager 类
    - 配置 PerspectiveCamera（FOV: 75°, 位置: (5, 5, 5)）
    - 集成 OrbitControls
    - 设置相机约束（maxPolarAngle 防止穿过地面）
    - 启用阻尼效果
    - 实现 update 和 updateAspect 方法
    - _Requirements: 5.1, 5.4, 5.5_

  - [x] 3.2 创建 RenderLoop 类
    - 实现 requestAnimationFrame 循环
    - 每帧更新 OrbitControls
    - 每帧调用 SceneManager.render()
    - 实现 start 和 stop 方法
    - _Requirements: 2.1_

  - [ ]* 3.3 编写 CameraManager 单元测试
    - 测试相机初始化配置
    - 测试 OrbitControls 设置
    - 测试相机约束
    - _Requirements: 5.1, 5.4, 5.5_

- [x] 4. 实现 UI 层（UIManager 和 ComponentPanel）
  - [x] 4.1 创建 UIManager 类
    - 创建应用容器 DOM 结构
    - 实现左右分栏布局（20% / 80%）
    - 提供 getSceneContainer 和 getPanelContainer 方法
    - _Requirements: 1.2, 1.4, 2.1, 8.4_

  - [x] 4.2 创建 ComponentPanel 类
    - 定义 GEOMETRY_CONFIGS 配置数组（5 种几何体）
    - 渲染组件列表（图标 + 标签）
    - 实现组件项的 mousedown 事件处理
    - 触发 onDragStart 回调传递几何体类型
    - 添加基础样式（悬停效果、抓取光标）
    - _Requirements: 1.1, 1.3, 3.1_

  - [ ]* 4.3 编写 ComponentPanel 单元测试
    - 测试组件列表渲染（5 种几何体）
    - 测试每个组件有图标和标签
    - 测试 mousedown 事件触发 onDragStart
    - _Requirements: 1.1, 1.3, 3.1_

- [x] 5. 实现拖拽交互系统
  - [x] 5.1 创建 RaycastHelper 类
    - 实现 screenToNDC 方法（屏幕坐标转 NDC）
    - 实现 getIntersectionPoint 方法（射线检测）
    - 处理无交点情况，返回默认位置 (0, 0, 0)
    - _Requirements: 3.4, 4.1_

  - [ ]* 5.2 编写 RaycastHelper 单元测试
    - 测试 NDC 坐标转换
    - 测试射线检测计算
    - 测试无交点边缘情况
    - _Requirements: 3.4, 4.1, 3.5_

  - [ ]* 5.3 编写 RaycastHelper 属性测试
    - **Property 3: 射线检测位置计算**
    - **Validates: Requirements 3.4, 4.1, 4.2**
    - 对于任意鼠标位置，验证返回的位置是有效的 Vector3
    - 配置 100+ 迭代

  - [x] 5.4 创建 DragSystem 类
    - 实现 startDrag 方法（记录几何体类型，设置拖拽状态）
    - 实现 onDragMove 方法（可选的视觉反馈）
    - 实现 onDragEnd 方法（创建并放置几何体）
    - 实现 createGeometry 方法（根据类型创建 Three.js 几何体）
    - 为每个几何体分配唯一 ID（userData.id）
    - 实现 placeGeometry 方法（使用 RaycastHelper 计算位置）
    - 绑定和清理 mousemove/mouseup 事件监听器
    - _Requirements: 3.1, 3.3, 3.4, 4.1, 4.2, 6.1, 6.2, 6.3, 6.5_

  - [ ]* 5.5 编写 DragSystem 单元测试
    - 测试拖拽状态管理
    - 测试几何体创建逻辑（5 种类型）
    - 测试事件绑定和清理
    - 测试 ID 生成
    - _Requirements: 3.1, 3.3, 6.1, 6.2, 6.3_

  - [ ]* 5.6 编写 DragSystem 属性测试 - 拖拽启动
    - **Property 1: 拖拽启动状态转换**
    - **Validates: Requirements 3.1**
    - 对于任意几何体类型，验证 startDrag 后状态正确
    - 配置 100+ 迭代

  - [ ]* 5.7 编写 DragSystem 属性测试 - 创建几何体
    - **Property 2: 拖拽完成创建几何体**
    - **Validates: Requirements 3.3**
    - 对于任意几何体类型，验证拖拽结束后场景中新增几何体
    - 配置 100+ 迭代

  - [ ]* 5.8 编写 DragSystem 属性测试 - ID 唯一性
    - **Property 6: 几何体 ID 唯一性**
    - **Validates: Requirements 6.2**
    - 对于任意数量的几何体，验证所有 ID 唯一
    - 配置 100+ 迭代

  - [ ]* 5.9 编写几何体属性完整性属性测试
    - **Property 5: 几何体属性完整性**
    - **Validates: Requirements 6.1, 6.3, 6.5, 4.4**
    - 对于任意几何体类型，验证使用标准类、标准材质、有 ID、已添加到场景
    - 配置 100+ 迭代

- [x] 6. 实现 Application 主类和集成
  - [x] 6.1 创建 Application 类
    - 初始化 UIManager
    - 初始化 SceneManager
    - 初始化 CameraManager
    - 初始化 RenderLoop
    - 初始化 RaycastHelper
    - 初始化 DragSystem
    - 连接 ComponentPanel 的 onDragStart 到 DragSystem
    - 实现 handleResize 方法（带防抖）
    - 监听 window resize 事件
    - 实现 destroy 方法清理资源
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 6.2 编写 Application 集成测试
    - 测试所有模块正确初始化
    - 测试模块间通信
    - 测试 resize 事件处理
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 6.3 编写窗口调整响应属性测试
    - **Property 7: 窗口调整响应**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
    - 对于任意窗口尺寸，验证场景、渲染器、相机、面板都正确更新
    - 配置 100+ 迭代

- [x] 7. 创建入口文件和样式
  - [x] 7.1 创建 main.js 入口文件
    - 导入 Application 类
    - 创建应用实例并初始化
    - 处理初始化错误（WebGL 不可用）
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 7.2 创建 CSS 样式文件
    - 实现应用容器布局（flex）
    - 实现组件面板样式（20% 宽度，滚动）
    - 实现场景容器样式（flex: 1）
    - 实现组件项样式（悬停效果，抓取光标）
    - 确保响应式布局
    - _Requirements: 1.2, 1.4, 1.5, 2.1, 8.4_

  - [x] 7.3 创建 index.html
    - 设置基础 HTML 结构
    - 引入样式和脚本
    - 创建应用根容器
    - _Requirements: 7.1_

- [x] 8. Checkpoint - 基础功能验证
  - 确保所有核心功能正常工作
  - 验证拖拽流程完整
  - 验证场景渲染正确
  - 如有问题，询问用户

- [ ]* 9. 端到端集成测试
  - [ ]* 9.1 编写完整拖拽流程测试
    - 模拟从组件面板拖拽到场景
    - 验证几何体创建和放置
    - 验证场景渲染更新
    - _Requirements: 3.1, 3.3, 3.4, 4.1, 4.2, 4.3_

  - [ ]* 9.2 编写边缘情况测试
    - 测试射线检测失败场景
    - 测试最小窗口尺寸（1024px）
    - 测试组件列表滚动
    - _Requirements: 3.5, 8.5, 1.5_

- [ ]* 10. 立即渲染属性测试
  - **Property 4: 几何体立即渲染**
  - **Validates: Requirements 4.3**
  - 对于任意新放置的几何体，验证在下一帧中可见
  - 配置 100+ 迭代

- [x] 11. 最终优化和清理
  - 检查所有错误处理逻辑
  - 优化性能（渲染循环、事件处理）
  - 清理未使用的代码和注释
  - 验证代码符合 ES6 规范
  - _Requirements: 7.3_

- [x] 12. Final Checkpoint - 完整性检查
  - 确保所有测试通过
  - 验证所有需求已实现
  - 检查代码质量和可维护性
  - 如有问题，询问用户

## Notes

- 标记 `*` 的任务为可选任务，可以跳过以加快 MVP 开发
- 每个任务都引用了具体的需求编号，确保可追溯性
- Checkpoint 任务确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证具体示例和边缘情况
- 所有代码必须使用原生 JavaScript（ES6 模块）
- 严格遵循模块化架构，确保职责分离
