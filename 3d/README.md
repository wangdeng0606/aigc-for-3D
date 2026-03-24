# 3D Component Editor

一个基于 Three.js 的简单 3D 组件编辑器，支持从左侧组件面板拖拽基础几何体到右侧 3D 场景中。

## 功能特性

- ✅ 左侧组件面板：5 种基础几何体（立方体、球体、圆柱体、圆锥体、圆环）
- ✅ 右侧 3D 场景：白色背景，带网格辅助线
- ✅ 拖拽交互：从面板拖拽到场景，根据鼠标位置放置
- ✅ 相机控制：支持旋转、缩放、平移视角（OrbitControls）
- ✅ 响应式布局：适应窗口大小变化

## 技术栈

- **核心库**：Three.js (r160)
- **构建工具**：Vite
- **语言**：原生 JavaScript (ES6 模块)
- **测试框架**：Vitest + fast-check

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动。

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

### 预览生产版本

```bash
npm run preview
```

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch
```

## 项目结构

```
3d-component-editor/
├── src/
│   ├── main.js                 # 应用入口
│   ├── Application.js          # 应用主类
│   ├── ui/
│   │   ├── UIManager.js        # UI 布局管理
│   │   └── ComponentPanel.js   # 组件面板
│   ├── scene/
│   │   ├── SceneManager.js     # 场景管理
│   │   ├── CameraManager.js    # 相机管理
│   │   └── RenderLoop.js       # 渲染循环
│   ├── interaction/
│   │   ├── DragSystem.js       # 拖拽系统
│   │   └── RaycastHelper.js    # 射线检测
│   ├── utils/
│   │   └── idGenerator.js      # ID 生成器
│   └── styles/
│       └── main.css            # 样式文件
├── test/                       # 测试文件
├── public/
│   └── index.html              # HTML 模板
├── package.json
├── vite.config.js
└── vitest.config.js
```

## 使用说明

1. **选择组件**：在左侧组件面板中选择一个几何体
2. **拖拽**：按住鼠标左键拖拽到右侧场景
3. **放置**：释放鼠标，几何体将被放置在鼠标指向的位置
4. **查看**：使用鼠标右键旋转视角，滚轮缩放，中键平移

## 架构设计

项目采用模块化架构，职责清晰分离：

- **UI 层**：UIManager, ComponentPanel
- **场景层**：SceneManager, CameraManager, RenderLoop
- **交互层**：DragSystem, RaycastHelper
- **核心层**：Application（协调所有模块）

## 扩展性

设计预留了以下扩展点：

- 物体行为系统
- 物体选择和编辑
- 属性面板
- 场景序列化和保存
- 撤销/重做功能

## 许可证

MIT
