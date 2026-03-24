# DJY 代码规范与架构手册

> 本文档是短剧园项目的 **代码圣经**，用于减少上下文重复消耗。
> 新开会话时优先阅读本文档，避免重复扫描各模块代码。

---

## 一、代码规范

### 1.1 命名规范

| 类别 | 规则 | 示例 |
|------|------|------|
| **包名** | 全小写，按职责分层 | `com.aigc3d.controller`, `com.djy.common.result` |
| **类名** | 大驼峰，名词 | `TextController`, `AIRouter`, `DashScopeProperties` |
| **方法名** | 小驼峰，动词开头 | `analyzeImage()`, `generateVideo()`, `resolveAdapter()` |
| **常量** | 全大写 + 下划线 | `TEXT_GENERATION`, `IMAGE_ANALYSIS` |
| **变量/字段** | 小驼峰 | `activePhase`, `sourceCharId` |
| **数据库表名** | 全小写 + 下划线 | `character_phase`, `phase_ref_set`, `rel_event` |
| **数据库字段** | 全小写 + 下划线 | `active_phase_id`, `image_url`, `created_at` |
| **API 路径** | 全小写 + 短横线，按输出类型分组 | `/api/text/analyze-image`, `/api/image/generate` |
| **前端组件** | 大驼峰 | `CharacterPanel`, `SceneView`, `VideoNode` |
| **前端文件** | 大驼峰.jsx | `CharacterPanel.jsx`, `SceneView.jsx` |

### 1.2 后端分层结构

每个微服务遵循统一分层：

```
com.aigc3d（或 com.djy.xxx）
├── controller/     ← 控制层：接收请求，调用 service/router，返回 R<T>
├── service/        ← 业务层：核心业务逻辑编排
├── adapter/        ← 适配层：对接外部 AI/三方 SDK（策略模式）
│   └── dashscope/  ← 具体厂商实现
├── router/         ← 路由层：根据任务类型选择 adapter
├── model/          ← 模型层：DTO、枚举、值对象
├── config/         ← 配置层：@ConfigurationProperties、Bean 定义
└── util/           ← 工具层：Prompt 加载、通用工具
```

**核心原则**：
- Controller 只做 **请求接收 + 参数组装 + 调用 service + 返回结果**，不放业务逻辑
- Service 编排业务流程，调用 Router/Adapter
- Adapter 是策略模式，一个接口多个实现（DashScope / OpenAI / ...），通过 `AICapability` 声明能力
- Router 根据 `AITaskType` 自动选择合适的 Adapter，并做能力校验和输入过滤

### 1.3 统一响应格式

所有后端接口统一返回 `R<T>`（`com.djy.common.result.R`）：

```java
{
    "code": 200,        // 200=成功，500=失败，其他自定义
    "message": "success",
    "data": { ... }     // 泛型数据
}
```

- 成功：`R.ok(data)` 或 `R.ok()`
- 失败：`R.fail("错误信息")` 或 `R.fail(code, "错误信息")`
- 业务异常：抛出 `BizException`（`com.djy.common.exception.BizException`）

### 1.4 API 路径设计

```
/api/{输出类型}/{操作}
```

| 前缀 | 输出类型 | 示例 |
|------|---------|------|
| `/api/text/` | 返回文本或 JSON | `/api/text/chat`, `/api/text/analyze-image` |
| `/api/image/` | 返回图片 URL | `/api/image/generate`, `/api/image/edit` |
| `/api/video/` | 返回视频 URL | `/api/video/generate` |
| `/api/test/` | 测试/联调端点 | `/api/test/health`, `/api/test/echo` |

**路径规则**：
- 一律 `/api` 开头，方便网关统一路由
- 第二段按 **输出产物** 分类，不按功能/实体分类
- 操作名用短横线（kebab-case）：`analyze-image`、`edit-base64`
- RESTful 资源操作（后续 CRUD 服务）：`/api/character/{id}`, `/api/relationship/{id}`

### 1.5 前端代码规范

| 规则 | 说明 |
|------|------|
| **组件拆分** | 页面级 → `views/`，功能面板 → `panels/`，节点 → `nodes/`，连线 → `edges/` |
| **状态管理** | 全局状态提升到 `App.jsx`，通过 props 逐层传递 |
| **命名** | 组件大驼峰，事件处理 `handle` 或 `on` 前缀，更新函数 `update` 前缀 |
| **API 调用** | 统一用 `fetch`，集中在各 Panel 组件内，URL 通过 Vite proxy 走 `/api/` |
| **样式** | TailwindCSS 为主，内联 style 对象为辅 |

### 1.6 Git 提交规范

```
<type>(<scope>): <subject>

type:   feat / fix / refactor / docs / style / chore / test
scope:  ai / gateway / common / test / demo / docker / docs
subject: 简明描述（中文或英文均可）
```

示例：
- `feat(ai): 新增 TextController 按输出类型划分端点`
- `refactor(demo): ScenePanel API 路径迁移到 /api/image/*`
- `docs: 新增数据库设计文档 database-design.md`

---

## 二、设计思维与注意事项

### 2.1 ⚠️ 设计反问机制（必读）

**在执行任何涉及架构变更的任务前，必须先反问设计合理性，并提出自己的建议。**

具体场景：
1. **新增 Controller / 新增 API 路径** → 先确认：按输出类型归类是否正确？是否该放在已有 Controller 中？
2. **新增模块 / 微服务** → 先确认：职责边界是否清晰？是否和已有服务有重叠？
3. **数据模型变更** → 先确认：前端数据结构是否同步？数据库表是否需要迁移？
4. **新增依赖** → 先确认：版本是否和 parent POM BOM 兼容？是否有更轻量替代？

**反问模板**：
```
在执行之前，我先确认一下设计：
1. [问题1]？
2. [问题2]？
我的建议是 [xxx]，原因是 [yyy]。
确认后我再开始实现。
```

### 2.2 Controller 设计哲学：按输出类型划分

这是本项目的 **核心设计决策**，理解它能避免大量重构。

**错误方式**（按功能/实体）：
```
❌ AITestController   → 塞满各种分析端点
❌ GenerateController → 混合图片生成、视频生成、图片编辑
```

**正确方式**（按输出产物）：
```
✅ TextController   → 所有返回文本/JSON的端点（chat、analyze-image、detect-objects...）
✅ ImageController  → 所有返回图片URL的端点（generate、edit、edit-base64...）
✅ VideoController  → 所有返回视频URL的端点（generate...）
```

**判断标准**：**这个接口最终给前端返回的核心产物是什么？**
- 返回文本分析结果 → TextController，即使输入是图片
- 返回图片 URL → ImageController，即使需要文本 prompt
- 返回视频 URL → VideoController

**新增端点时的检查清单**：
1. 确定输出产物类型（文本？图片URL？视频URL？其他？）
2. 放入对应 Controller
3. 如果输出类型不属于现有任何 Controller → 考虑是否需要新建 Controller（先反问！）

### 2.3 Adapter 策略模式

AI 服务使用 **Adapter 策略模式** 解耦厂商 SDK：

```
AICapability（接口）         ← 声明支持哪些任务类型和输入类型
    └── AIAdapter（接口）    ← 定义 execute(task, input) → output
        ├── DashScopeChatAdapter   ← 对话/图像分析（text 输出）
        ├── DashScopeImageAdapter  ← 文生图/图片编辑（image 输出）
        └── DashScopeVideoAdapter  ← 文生视频（video 输出）

AIRouter（路由器）
    └── route(task, input) → 自动选择 Adapter + 能力校验 + 输入过滤
```

**扩展新厂商时**：只需新增 Adapter 实现类，不改 Controller / Router。

### 2.4 前端数据模型要点

角色系统的层级关系（后端设计必须尊重这个结构）：

```
Character（角色）
  └── Phase（成长阶段）        ← 一个角色有多个阶段（初出江湖、觉醒、受伤...）
       ├── Tag（标签）         ← 一个阶段有多个特征标签
       └── RefSet（参考图集）   ← 一个阶段有多套形象（白衣剑装、便装...）
            └── Image（四角度） ← front / side / back / quarter

Relationship（角色关系）
  ├── RelHistory（关系演变）    ← 关系标签变化记录
  └── Event（事件）            ← 事件时间线（支持 AI 自动生成）

Scene（场景）
  ├── SceneCharacter（角色配置）← 指定角色的阶段+形象
  └── Video（视频）            ← 关联视频节点
```

### 2.5 网关路由规则

网关（djy-gateway :9000）根据路径前缀转发到对应服务：

| 路径前缀 | 转发目标 |
|---------|---------|
| `/api/text/**`, `/api/image/**`, `/api/video/**` | `lb://djy-service-ai` |
| `/api/test/**` | `lb://djy-test` |
| `/api/character/**`（未来） | `lb://djy-service-character` |
| `/api/pipeline/**`（未来） | `lb://djy-service-pipeline` |

**注意**：新增服务时必须同步更新 `djy-gateway/src/main/resources/application.yml` 路由配置。

### 2.6 避免踩的坑

| 坑 | 说明 | 正确做法 |
|----|------|---------|
| **Nacos 未启动就起服务** | 服务启动会报连接失败 | 先 `docker-compose up -d`，或在 `application.yml` 设 `nacos.discovery.enabled: false` |
| **端口冲突** | gateway=9000, ai=8080, test=8090 | 新服务分配端口前先查看已占用 |
| **前后端 API 路径不同步** | 前端调 `/api/generate/*` 但后端已改为 `/api/image/*` | 改后端路径时 **必须同步改前端 fetch URL** |
| **parent POM 未注册新模块** | Maven 构建跳过新模块 | 新增模块后必须在 `pom.xml` 的 `<modules>` 中注册 |
| **gateway 路由未更新** | 请求 404 | 新服务/新路径前缀必须更新 gateway 路由 |
| **docker 初始化脚本不执行** | PG 容器已有数据时不重新执行 init | 需要重新初始化时先 `docker-compose down -v` 删除 volume |

---

## 三、模块概览

### 3.1 djy-common — 公共模块

**职责**：跨服务共享的通用代码，所有业务服务都依赖它。

| 包 | 内容 | 说明 |
|----|------|------|
| `result/R.java` | 统一响应包装 | `R.ok(data)`, `R.fail(msg)`，code + message + data |
| `exception/BizException.java` | 业务异常 | 携带 code，抛出后由全局异常处理器捕获 |

**后续可扩展**：常量类、枚举、通用 DTO、分页工具、全局异常处理器。

---

### 3.2 djy-gateway — API 网关（:9000）

**职责**：统一入口，路由转发，跨域处理。

| 文件 | 说明 |
|------|------|
| `GatewayApplication.java` | 启动类，`@EnableDiscoveryClient` |
| `application.yml` | 路由规则、CORS 配置、Nacos 地址 |

**关键配置**：
- 路由使用 `lb://` 前缀（通过 Nacos 负载均衡）
- 全局 CORS 允许所有来源（开发阶段）
- 新服务必须在 `routes` 下新增条目

---

### 3.3 djy-service-ai — AI 能力服务（:8080）

**职责**：封装所有 AI 调用能力，对上层暴露统一 HTTP 接口。

**包结构**：

| 包/类 | 职责 |
|-------|------|
| `controller/TextController` | `/api/text/*` — 返回文本/JSON 的端点：health、chat、analyze-image、detect-objects、generate-scene-json、generate-scene-coordinates、generate-face-description、analyze-scene |
| `controller/ImageController` | `/api/image/*` — 返回图片 URL 的端点：generate（文生图）、edit（multipart 图片编辑）、edit-base64（JSON base64 图片编辑） |
| `controller/VideoController` | `/api/video/*` — 返回视频 URL 的端点：generate（文生视频） |
| `service/AIService` | AI 业务编排层，调用 Router 执行 AI 任务 |
| `router/AIRouter` | AI 路由器，根据 `AITaskType` 选择 Adapter，校验能力，过滤输入 |
| `adapter/AIAdapter` | Adapter 策略接口：`execute(task, input) → output` |
| `adapter/AICapability` | 能力声明接口：`supports(task)`, `supportsImageInput()`, `supportsVideoInput()` |
| `adapter/dashscope/DashScopeChatAdapter` | DashScope 多模态对话实现（qwen-vl-plus） |
| `adapter/dashscope/DashScopeImageAdapter` | DashScope 文生图/图编辑实现（wanx-v1, qwen-image-edit-plus） |
| `adapter/dashscope/DashScopeVideoAdapter` | DashScope 文生视频实现（wan2.1-t2v-turbo） |
| `model/AITaskType` | 任务类型枚举：TEXT_GENERATION、IMAGE_ANALYSIS、OBJECT_DETECTION、SCENE_UNDERSTANDING、SCENE_TO_3D、IMAGE_GENERATION、VIDEO_GENERATION |
| `model/AIInput` | 统一输入模型：text + images(byte[]) + videos(byte[]) |
| `model/AIOutput` | 统一输出模型：text + imageUrls + videoUrl |
| `config/DashScopeProperties` | DashScope 配置：apiKey、各模型名称、temperature、topP |
| `util/PromptLoader` | Prompt 模板加载工具 |

---

### 3.4 djy-test — 联调测试服务（:8090）

**职责**：轻量级冒烟测试服务，验证网关路由和 Cloud 基础设施是否正常。

| 端点 | 说明 |
|------|------|
| `GET /api/test/health` | 健康检查，返回 service、status、time |
| `GET /api/test/echo?msg=xxx` | 回声测试，返回传入的消息 |
| `GET /api/test/info` | 服务信息，返回所有可用端点 |

**使用方式**：启动 Nacos → djy-test → djy-gateway，访问 `http://localhost:9000/api/test/health` 验证链路。

---

### 3.5 demo — 前端 Demo（React + Vite :3000）

**职责**：可视化原型，展示角色管理和场景编排的完整交互流程。

| 目录/文件 | 内容 | 职责 |
|-----------|------|------|
| `App.jsx` | 入口组件 | 全局状态管理（characters、relationships），页面切换 |
| `views/CharacterView.jsx` | 角色管理画布 | React Flow 画布，角色节点 + 关系连线，CRUD 操作 |
| `views/SceneView.jsx` | 场景编排画布 | React Flow 画布，场景节点 + 视频节点 + 连线 |
| `components/panels/CharacterPanel.jsx` | 角色编辑面板 | 固定信息、成长阶段、标签、多套参考图集（四角度上传） |
| `components/panels/ScenePanel.jsx` | 场景编辑面板 | 场景图、关键词、角色配置、AI 生图/微调、AI 事件分析 |
| `components/panels/VideoPanel.jsx` | 视频编辑面板 | 分镜描述、视频生成、帧截取、截取帧→角色新形象 |
| `components/CharacterTimeline.jsx` | 关系时间线 | 事件列表、关系演变、手动添加、AI 关系推演 |
| `components/CharacterSidebar.jsx` | 角色侧边栏 | 角色列表、添加角色 |
| `components/SceneSidebar.jsx` | 场景侧边栏 | 场景/视频节点列表、添加节点 |
| `components/NavBar.jsx` | 顶部导航 | 角色管理 ↔ 场景编排 切换 |
| `components/NodeMenu.jsx` | 节点右键菜单 | 删除节点等操作 |
| `components/nodes/CharacterNode.jsx` | 角色节点 | React Flow 自定义节点 |
| `components/nodes/SceneNode.jsx` | 场景节点 | React Flow 自定义节点 |
| `components/nodes/VideoNode.jsx` | 视频节点 | React Flow 自定义节点 |
| `components/edges/RelationshipEdge.jsx` | 关系连线 | 双击查看时间线 |
| `components/edges/SceneEdge.jsx` | 场景连线 | 场景→视频流转连线 |
| `components/edges/FlowEdge.jsx` | 通用连线 | 基础连线样式 |

**前端核心数据结构**（在 `App.jsx` 中定义）：

```
characters[] → { id, name, gender, activePhase, phases[] }
  phases[]   → { id, label, role, description, tags[], activeRefSet, refSets[] }
    refSets[] → { id, label, images: { front, side, back, quarter } }

relationships[] → { id, source, target, type, data: { label, relationshipHistory[], events[] } }
  relationshipHistory[] → { id, label, desc }
  events[] → { id, title, desc, type, tag, source?, sceneTitle? }
```

---

### 3.6 docker — 基础设施编排

| 文件 | 说明 |
|------|------|
| `docker-compose.yml` | Nacos（8848）+ PostgreSQL（5432）编排 |
| `init/01-schema.sql` | 数据库初始化 DDL，12 张表，PG 启动时自动执行 |

**常用命令**：
```bash
cd docker
docker-compose up -d          # 启动
docker-compose down           # 停止
docker-compose down -v        # 停止并清除数据（重新初始化时用）
docker-compose logs -f nacos  # 查看 Nacos 日志
```

---

### 3.7 docs — 项目文档

| 文件 | 说明 |
|------|------|
| `project-concept.md` | 项目概念文档：定位、数据模型、架构、流水线、规划 |
| `database-design.md` | 数据库设计：12 张表详细 DDL + 前端字段映射 |
| `djy-code.md` | 本文档：代码规范 + 设计思维 + 模块概览 |

---

## 四、快速参考

### 4.1 端口分配表

| 服务 | 端口 | 状态 |
|------|------|------|
| djy-gateway | 9000 | ✅ |
| djy-service-ai | 8080 | ✅ |
| djy-test | 8090 | ✅ |
| djy-service-character | 8081 | 🔜 |
| djy-service-pipeline | 8082 | 🔜 |
| Nacos | 8848 / 9848 | Docker |
| PostgreSQL | 5432 | Docker |
| 前端 Demo (Vite) | 3000 | npm run dev |

### 4.2 新增微服务 Checklist

1. [ ] 在 `djy-cloud/` 下新建模块目录
2. [ ] 创建 `pom.xml`（parent 指向 `com.djy:djy-cloud:1.0.0`）
3. [ ] 在 parent `pom.xml` 的 `<modules>` 中注册
4. [ ] 创建 `Application.java` + `application.yml`（分配端口、配置 Nacos）
5. [ ] 在 `djy-gateway/application.yml` 的 `routes` 中新增路由
6. [ ] 更新本文档的端口分配表和模块概览

### 4.3 新增 API 端点 Checklist

1. [ ] 确定输出产物类型 → 选择对应 Controller
2. [ ] 如果新增 Controller → 先反问设计合理性
3. [ ] Controller 内只做请求接收 + 返回 `R<T>`
4. [ ] 前后端 API 路径同步
5. [ ] gateway 路由覆盖新路径前缀

### 4.4 技术栈速查

| 层级 | 选型 | 版本 |
|------|------|------|
| Java | JDK | 17 |
| 框架 | Spring Boot | 3.2.3 |
| 微服务 | Spring Cloud | 2023.0.0 |
| 注册中心 | Nacos (Spring Cloud Alibaba) | 2023.0.1.0 |
| 网关 | Spring Cloud Gateway | — |
| AI SDK | DashScope | 2.19.0 |
| 数据库 | PostgreSQL | 16 |
| 前端 | React + React Flow + TailwindCSS | 18.x |
| 构建 | Vite | — |
| Lombok | — | managed by parent |
