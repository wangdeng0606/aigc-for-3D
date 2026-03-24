# 短剧园（DJY）— 项目概念文档

## 一、项目定位

短剧园是一个基于 AIGC 技术的短剧视频生成平台，核心能力是 **人物持久化（Character Persistence）**，
通过对角色状态的精细化记录与多维度存储，保证在整个短剧生成过程中人物形象的高度一致性。

---

## 二、核心概念：人物持久化

### 2.1 问题背景

AI 生成视频时，同一角色在不同镜头/片段中容易出现外貌不一致的问题（如发型变化、服装颜色偏移等）。
短剧园通过 **成长阶段 + 多套参考图集 + 关系事件驱动** 解决这一痛点。

### 2.2 角色数据模型

```
Character（角色）
├── id, name, gender             ← 固定属性
├── activePhase                  ← 当前激活阶段
└── phases[]                     ← 成长阶段列表
    ├── id, label, role, description, tags[]
    ├── activeRefSet             ← 当前使用的参考图集
    └── refSets[]                ← 多套参考图集（形象）
        ├── id, label
        └── images { front, side, back, quarter }  ← 四角度参考图
```

**示例**：角色"沈逸风" → 阶段"初出江湖"（武当弟子）→ 形象"白衣剑装"（正面/侧面/背面/¾视角各一张）

### 2.3 成长阶段驱动（Phase-Driven）

每个角色通过 **Phase（成长阶段）** 管理外观演进：

```
成长阶段时间线
──────────────────────────────────────────────────────────────────►
  Phase 1            Phase 2              Phase 3
  ┌──────────────┐   ┌──────────────┐    ┌──────────────┐
  │ 初出江湖      │ → │ 受伤期        │ →  │ 觉醒后        │
  │ role: 武当弟子│   │ role: 伤残侠客│    │ role: 江湖高手 │
  │ refSets:     │   │ refSets:     │    │ refSets:      │
  │  └ 白衣剑装   │   │  └ 破损战装   │    │  └ 新战甲       │
  │  └ 便装       │   │  └ 绷带装     │    │  └ 披风战装     │
  └──────────────┘   └──────────────┘    └──────────────┘
```

- 每个阶段可拥有多套 **RefSet（参考图集/形象）**，如同一阶段的"战斗装"和"便装"
- 每套 RefSet 包含 4 个角度的参考图，确保 AI 生成时角色一致性
- 场景配置时可为每个角色指定具体的阶段 + 形象组合

### 2.4 角色关系与事件系统

```
Relationship（关系）
├── source / target              ← 两个角色
├── label                        ← 当前关系标签（如：仇敌、盟友）
├── relationshipHistory[]        ← 关系演变记录
│   └── { label, desc }         ← 每次关系变化的快照
└── events[]                     ← 事件时间线
    └── { title, desc, type, tag, source }
        type: event（普通事件）/ relationship（关系变更）
        tag:  初识 / 冲突 / 合作 / 和解 / 背叛 / 恋爱 / 日常
        source: manual（手动）/ ai-scene（AI 场景分析）
```

**AI 驱动关系演进**：场景分析 → 自动提取人物事件 → 推送到关系时间线 → AI 推演关系变化

---

## 三、场景编排系统

### 3.1 双画布架构

| 画布 | 节点类型 | 核心功能 |
|------|---------|---------|
| **角色管理** | CharacterNode + RelationshipEdge | 角色 CRUD、成长阶段管理、关系图谱、事件时间线 |
| **场景编排** | SceneNode + VideoNode + SceneFlowEdge | 场景配置、AI 生图/编辑、视频生成、帧截取 |

### 3.2 场景 → 视频 流程

```
SceneNode（场景节点）              VideoNode（视频节点）
┌─────────────────────┐          ┌─────────────────────┐
│ 场景图 + 关键词       │          │ 分镜描述              │
│ 参与角色（阶段+形象）  │──生成──→│ 视频预览              │
│ AI 生成/微调场景图    │          │ 帧截取 → 角色形象更新   │
│ AI 事件分析          │          │                      │
└─────────────────────┘          └─────────────────────┘
```

**闭环**：视频帧截取 → 选择角色 → AI 生成新 RefSet → 添加到角色当前阶段，保证后续场景一致性

---

## 四、核心流程：Character Agent Pipeline（角色生成 Agent 流水线）

整个系统的核心是一条 **可执行的 AI 流水线**，时间轴是流水线的 **驱动源**。

```
【输入】单张参考图 / 文本描述
              │
              ▼
┌─────────────────────────────┐
│  Step1  角色解析（AI）        │  提取：性别、发型、服装、风格等
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  Step2  多角度生成（AI）      │  正面 / 侧面 / 背面 / 3/4
│                             │  输出：RefSet 参考图集
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  Step3  结构化存储（系统）     │  创建 Character + Phase + RefSet
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  Step4  场景图生成（AI）      │  根据关键词 + 角色参考图生成场景图
│                             │  支持 AI 微调已有场景图
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  Step5  视频生成（AI）        │  注入场景图 + 分镜描述
│                             │  生成分镜视频
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  Step6  视频反向解析（系统）    │  帧截取 → 识别角色
│                             │  AI 生成新 RefSet（形象一致性）
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  Step7  事件分析（AI）        │  AI 分析场景事件
│                             │  推演角色关系变化
│                             │  推送到关系时间线
└─────────────────────────────┘
               │
               └──→ 回到 Step4（循环，下一场景）
```

### 关键设计原则

| 原则 | 说明 |
|------|------|
| **阶段驱动** | 角色通过 Phase 管理外观演进，每个阶段可有多套形象 |
| **形象一致性** | RefSet 四角度参考图确保 AI 生成时角色外观统一 |
| **关系事件化** | 所有角色关系变化都通过事件驱动，可追溯、可 AI 推演 |
| **闭环反馈** | 视频帧截取 → 新形象 → 场景一致性，形成自校正闭环 |

---

## 五、系统架构（Spring Cloud 微服务）

```
                    ┌──────────────┐
                    │  前端 Demo    │  React + React Flow
                    │    :3000     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  djy-gateway │  API 网关（路由、鉴权、限流）
                    │    :9000     │
                    └──────┬───────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
┌───▼──────────┐  ┌────────▼────────┐  ┌──────────▼──────┐
│djy-service   │  │ djy-service     │  │  djy-test       │
│    -ai       │  │  -character     │  │   :8090         │
│   :8080      │  │    :8081        │  │  联调测试服务     │
└──────────────┘  └─────────────────┘  └─────────────────┘
  AI 能力层          角色持久化            网关联调 / 冒烟测试
  ├ /api/text       状态版本管理
  ├ /api/image      多角度图存储
  └ /api/video      时间轴管理
```

### 5.1 服务划分

| 服务 | 端口 | 职责 | 状态 |
|------|------|------|------|
| **djy-gateway** | 9000 | API 网关，统一入口，路由转发 | ✅ 已搭建 |
| **djy-common** | — | 公共模块：R 统一响应、工具类、异常定义 | ✅ 已搭建 |
| **djy-service-ai** | 8080 | AI 能力层：文本分析、文生图、图片编辑、文生视频 | ✅ 已搭建 |
| **djy-test** | 8090 | 联调测试服务：网关路由验证、冒烟测试 | ✅ 已搭建 |
| **djy-service-character** | 8081 | 角色管理：CRUD、阶段、形象、关系、事件 | 🔜 待开发 |
| **djy-service-pipeline** | 8082 | 流水线编排：Agent Pipeline 调度 | 🔜 待开发 |

### 5.2 AI 服务 Controller 设计（按输出类型划分）

| Controller | 路径 | 输出类型 | 端点 |
|------------|------|---------|------|
| **TextController** | `/api/text/*` | 文本/JSON | health, chat, analyze-image, detect-objects, scene-json, scene-coordinates, face-description, analyze-scene |
| **ImageController** | `/api/image/*` | 图片 URL | generate, edit (multipart), edit-base64 (JSON) |
| **VideoController** | `/api/video/*` | 视频 URL | generate |

### 5.3 服务间协作

```
djy-service-pipeline（流水线调度）
    │
    ├──→ 调用 djy-service-ai        （角色解析、多角度生成、场景生图、视频生成）
    ├──→ 调用 djy-service-character  （结构化存储、关系事件、时间轴更新）
    └──→ 自身逻辑                    （Pipeline 编排、Step 流转、失败重试）
```

---

## 六、数据库设计

详见 [database-design.md](./database-design.md)

### 核心表一览

| 表名 | 说明 | 对应前端数据 |
|------|------|------------|
| `character` | 角色表 | characters[] |
| `character_phase` | 成长阶段表 | character.phases[] |
| `phase_tag` | 阶段标签表 | phase.tags[] |
| `phase_ref_set` | 参考图集表 | phase.refSets[] |
| `ref_set_image` | 参考图表（四角度） | refSet.images{} |
| `relationship` | 角色关系表 | relationships[] |
| `rel_history` | 关系演变历史表 | relationship.relationshipHistory[] |
| `rel_event` | 关系事件表 | relationship.events[] |
| `scene` | 场景表 | SceneNode |
| `scene_character` | 场景角色配置表 | scene.characterConfigs |
| `video` | 视频表 | VideoNode |
| `scene_flow` | 场景连线表 | SceneEdge |

---

## 七、基础设施

### 7.1 Docker 环境

文件位于 `docker/` 目录：

```
docker/
├── docker-compose.yml          # 基础设施编排
└── init/
    └── 01-schema.sql           # 数据库初始化 DDL
```

| 组件 | 端口 | 用途 |
|------|------|------|
| **Nacos** | 8848 / 9848 | 服务发现 + 配置中心 |
| **PostgreSQL** | 5432 | 业务数据库（角色、场景、关系等） |

启动命令：`cd docker && docker-compose up -d`

PostgreSQL 启动时会自动执行 `init/01-schema.sql` 初始化表结构。

### 7.2 技术栈

| 层级 | 技术选型 |
|------|----------|
| 基础框架 | Spring Boot 3.2 + Spring Cloud 2023.0 |
| 服务发现/配置 | Nacos（Spring Cloud Alibaba 2023.0.1.0） |
| API 网关 | Spring Cloud Gateway |
| 服务通信 | OpenFeign |
| AI 厂商 SDK | 阿里云 DashScope SDK 2.19.0 |
| 数据库 | PostgreSQL 16 |
| 前端 Demo | React 18 + React Flow + TailwindCSS + Lucide |
| 对象存储 | 待定（OSS / MinIO，存储多角度参考图） |

---

## 八、项目目录结构

```
djy-cloud/
├── demo/                       # 前端 Demo（React + Vite）
│   └── src/
│       ├── views/              # 页面：CharacterView, SceneView
│       ├── components/
│       │   ├── panels/         # 右侧面板：CharacterPanel, ScenePanel, VideoPanel
│       │   ├── nodes/          # React Flow 节点组件
│       │   ├── edges/          # React Flow 连线组件
│       │   └── ...             # Sidebar, Timeline, NavBar 等
│       └── App.jsx             # 入口（全局状态管理）
├── djy-common/                 # 公共模块
├── djy-gateway/                # API 网关 (:9000)
├── djy-service-ai/             # AI 能力服务 (:8080)
│   └── controller/
│       ├── TextController      # /api/text/*  — 文本输出
│       ├── ImageController     # /api/image/* — 图片输出
│       └── VideoController     # /api/video/* — 视频输出
├── djy-test/                   # 联调测试服务 (:8090)
├── docker/                     # Docker 编排 + 初始化脚本
│   ├── docker-compose.yml
│   └── init/
│       └── 01-schema.sql
├── docs/                       # 文档
│   ├── project-concept.md      # 本文档
│   └── database-design.md      # 数据库设计
└── pom.xml                     # Maven 父 POM
```

---

## 九、后续规划

1. **角色服务（djy-service-character）**
   - Character / Phase / RefSet 完整 CRUD
   - Relationship / Event 管理
   - 对接 PostgreSQL 持久化
   - 多角度参考图上传（对接 OSS）

2. **流水线服务（djy-service-pipeline）**
   - Agent Pipeline 定义与执行引擎
   - Step 间数据流转
   - 失败重试与断点续跑

3. **前端 → 后端联调**
   - 替换 Demo 中的 Mock 数据为真实 API 调用
   - 角色/场景/关系数据持久化

4. **基础设施完善**
   - Nacos 配置中心（各服务配置统一管理）
   - 统一异常处理 + 日志链路追踪
   - OSS 对象存储集成
