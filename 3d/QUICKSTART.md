# 快速启动指南

## 第一步：安装依赖

在项目根目录运行：

```bash
npm install
```

这将安装以下依赖：
- `three` - Three.js 3D 库
- `vite` - 开发服务器和构建工具
- `vitest` - 测试框架
- `fast-check` - 属性测试库
- `jsdom` - DOM 模拟环境

## 第二步：启动开发服务器

```bash
npm run dev
```

浏览器将自动打开 `http://localhost:3000`

## 第三步：使用编辑器

1. **查看界面**
   - 左侧：组件面板，显示 5 种几何体
   - 右侧：3D 场景，白色背景带网格

2. **拖拽组件**
   - 在左侧选择一个几何体（立方体、球体等）
   - 按住鼠标左键拖拽到右侧场景
   - 释放鼠标，几何体将出现在场景中

3. **控制视角**
   - **旋转**：按住鼠标右键或中键拖动
   - **缩放**：滚动鼠标滚轮
   - **平移**：按住中键拖动

## 常见问题

### Q: 页面显示 "WebGL is not available"
A: 你的浏览器不支持 WebGL。请使用现代浏览器（Chrome, Firefox, Edge, Safari）。

### Q: 拖拽后几何体没有出现
A: 确保你在场景区域（右侧白色区域）释放鼠标。

### Q: 如何删除场景中的物体？
A: 当前版本不支持删除功能。刷新页面可以清空场景。

## 下一步

- 查看 `README.md` 了解完整功能
- 查看 `.kiro/specs/3d-component-editor/` 了解设计文档
- 运行 `npm test` 执行测试（如果已编写）

## 项目结构速览

```
src/
├── Application.js          # 主应用类
├── main.js                 # 入口文件
├── ui/                     # UI 层
│   ├── UIManager.js        # 布局管理
│   └── ComponentPanel.js   # 组件面板
├── scene/                  # 场景层
│   ├── SceneManager.js     # 场景管理
│   ├── CameraManager.js    # 相机管理
│   └── RenderLoop.js       # 渲染循环
├── interaction/            # 交互层
│   ├── DragSystem.js       # 拖拽系统
│   └── RaycastHelper.js    # 射线检测
└── utils/                  # 工具
    └── idGenerator.js      # ID 生成
```

## 技术支持

如有问题，请查看：
1. 浏览器控制台的错误信息
2. 设计文档：`.kiro/specs/3d-component-editor/design.md`
3. 需求文档：`.kiro/specs/3d-component-editor/requirements.md`
