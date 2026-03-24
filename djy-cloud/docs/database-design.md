# 短剧园（DJY）— 数据库设计文档

> 基于前端 Demo 数据模型反推，适配 PostgreSQL 16

---

## 一、ER 关系总览

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  character   │ 1───N │ character_phase  │ 1───N │  phase_ref_set   │
│  角色表       │       │  成长阶段表       │       │  参考图集表       │
└──────┬──────┘       └────────┬────────┘       └────────┬────────┘
       │                      │                         │
       │                      │                         │
       │               ┌──────┴──────┐           ┌──────┴──────┐
       │               │ phase_tag   │           │ ref_set_image│
       │               │ 阶段标签表   │           │ 参考图表      │
       │               └─────────────┘           └─────────────┘
       │
       │  N                              N
┌──────┴──────┐                   ┌─────────────┐
│ relationship │ 1───N            │    scene     │
│ 角色关系表    │──────────┐       │   场景表     │
└──────┬──────┘          │       └──────┬──────┘
       │                 │              │
  1────┤────1       ┌────┴─────┐  1────┤────N
       │            │rel_event │       │
┌──────┴──────┐     │关系事件表 │  ┌────┴────────┐
│ rel_history  │     └──────────┘  │scene_character│
│ 关系历史表    │                   │场景角色配置表  │
└─────────────┘                   └──────┬──────┘
                                         │
                                    ┌────┴──────┐
                                    │   video    │
                                    │  视频表     │
                                    └────┬──────┘
                                         │
                                    ┌────┴──────┐
                                    │scene_flow  │
                                    │场景连线表   │
                                    └───────────┘
```

---

## 二、表结构详细设计

### 2.1 character — 角色表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `VARCHAR(64)` | PK | 角色唯一标识，如 `char-1` |
| `name` | `VARCHAR(100)` | NOT NULL | 角色名称 |
| `gender` | `VARCHAR(10)` | NOT NULL DEFAULT '未设定' | 性别：男 / 女 / 未设定 |
| `active_phase_id` | `VARCHAR(64)` | FK → character_phase.id | 当前激活的成长阶段 |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() | 创建时间 |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() | 更新时间 |

```sql
CREATE TABLE character (
    id              VARCHAR(64)   PRIMARY KEY,
    name            VARCHAR(100)  NOT NULL,
    gender          VARCHAR(10)   NOT NULL DEFAULT '未设定',
    active_phase_id VARCHAR(64),
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  character IS '角色表';
COMMENT ON COLUMN character.active_phase_id IS '当前激活的成长阶段ID';
```

---

### 2.2 character_phase — 成长阶段表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `VARCHAR(64)` | PK | 阶段唯一标识 |
| `character_id` | `VARCHAR(64)` | FK → character.id, NOT NULL | 所属角色 |
| `label` | `VARCHAR(100)` | NOT NULL | 阶段标签，如"初出江湖" |
| `role` | `VARCHAR(200)` | | 身份定位，如"武当弟子" |
| `description` | `TEXT` | | 阶段描述 |
| `audio_url` | `TEXT` | | 角色音频文件 URL（OSS 地址） |
| `audio_name` | `VARCHAR(200)` | | 音频原始文件名 |
| `active_ref_set_id` | `VARCHAR(64)` | FK → phase_ref_set.id | 当前使用的参考图集 |
| `sort_order` | `INT` | NOT NULL DEFAULT 0 | 排序序号 |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() | 创建时间 |

```sql
CREATE TABLE character_phase (
    id                VARCHAR(64)   PRIMARY KEY,
    character_id      VARCHAR(64)   NOT NULL REFERENCES character(id) ON DELETE CASCADE,
    label             VARCHAR(100)  NOT NULL,
    role              VARCHAR(200),
    description       TEXT,
    audio_url         TEXT,
    audio_name        VARCHAR(200),
    active_ref_set_id VARCHAR(64),
    sort_order        INT           NOT NULL DEFAULT 0,
    created_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_phase_character ON character_phase(character_id);
COMMENT ON TABLE  character_phase IS '角色成长阶段表';
COMMENT ON COLUMN character_phase.audio_url IS '角色音频文件地址，支持 mp3/wav/m4a';
```

---

### 2.3 phase_tag — 阶段标签表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `BIGSERIAL` | PK | 自增主键 |
| `phase_id` | `VARCHAR(64)` | FK → character_phase.id, NOT NULL | 所属阶段 |
| `tag` | `VARCHAR(50)` | NOT NULL | 标签值，如"勇敢""剑术" |

```sql
CREATE TABLE phase_tag (
    id        BIGSERIAL     PRIMARY KEY,
    phase_id  VARCHAR(64)   NOT NULL REFERENCES character_phase(id) ON DELETE CASCADE,
    tag       VARCHAR(50)   NOT NULL,
    UNIQUE(phase_id, tag)
);

COMMENT ON TABLE phase_tag IS '阶段特征标签表';
```

---

### 2.4 phase_ref_set — 参考图集表（形象）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `VARCHAR(64)` | PK | 图集唯一标识 |
| `phase_id` | `VARCHAR(64)` | FK → character_phase.id, NOT NULL | 所属阶段 |
| `label` | `VARCHAR(100)` | NOT NULL | 形象标签，如"白衣剑装" |
| `sort_order` | `INT` | NOT NULL DEFAULT 0 | 排序序号 |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() | 创建时间 |

```sql
CREATE TABLE phase_ref_set (
    id          VARCHAR(64)   PRIMARY KEY,
    phase_id    VARCHAR(64)   NOT NULL REFERENCES character_phase(id) ON DELETE CASCADE,
    label       VARCHAR(100)  NOT NULL,
    sort_order  INT           NOT NULL DEFAULT 0,
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refset_phase ON phase_ref_set(phase_id);
COMMENT ON TABLE phase_ref_set IS '参考图集表（角色形象）';
```

---

### 2.5 ref_set_image — 参考图表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `BIGSERIAL` | PK | 自增主键 |
| `ref_set_id` | `VARCHAR(64)` | FK → phase_ref_set.id, NOT NULL | 所属图集 |
| `angle` | `VARCHAR(20)` | NOT NULL | 角度：front / side / back / quarter |
| `image_url` | `TEXT` | NOT NULL | 图片 URL（OSS 地址） |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() | 创建时间 |

```sql
CREATE TABLE ref_set_image (
    id          BIGSERIAL     PRIMARY KEY,
    ref_set_id  VARCHAR(64)   NOT NULL REFERENCES phase_ref_set(id) ON DELETE CASCADE,
    angle       VARCHAR(20)   NOT NULL,
    image_url   TEXT          NOT NULL,
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
    UNIQUE(ref_set_id, angle)
);

COMMENT ON TABLE  ref_set_image IS '参考图表（多角度）';
COMMENT ON COLUMN ref_set_image.angle IS '角度：front=正面, side=侧面, back=背面, quarter=3/4视角';
```

---

### 2.6 relationship — 角色关系表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `VARCHAR(64)` | PK | 关系唯一标识 |
| `source_char_id` | `VARCHAR(64)` | FK → character.id, NOT NULL | 源角色 |
| `target_char_id` | `VARCHAR(64)` | FK → character.id, NOT NULL | 目标角色 |
| `label` | `VARCHAR(50)` | NOT NULL DEFAULT '陌生人' | 当前关系标签 |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() | 创建时间 |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() | 更新时间 |

```sql
CREATE TABLE relationship (
    id              VARCHAR(64)   PRIMARY KEY,
    source_char_id  VARCHAR(64)   NOT NULL REFERENCES character(id) ON DELETE CASCADE,
    target_char_id  VARCHAR(64)   NOT NULL REFERENCES character(id) ON DELETE CASCADE,
    label           VARCHAR(50)   NOT NULL DEFAULT '陌生人',
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    UNIQUE(source_char_id, target_char_id)
);

CREATE INDEX idx_rel_source ON relationship(source_char_id);
CREATE INDEX idx_rel_target ON relationship(target_char_id);
COMMENT ON TABLE relationship IS '角色关系表';
```

---

### 2.7 rel_history — 关系历史表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `VARCHAR(64)` | PK | 历史记录标识 |
| `relationship_id` | `VARCHAR(64)` | FK → relationship.id, NOT NULL | 所属关系 |
| `label` | `VARCHAR(50)` | NOT NULL | 关系标签快照 |
| `description` | `TEXT` | | 变化原因描述 |
| `sort_order` | `INT` | NOT NULL DEFAULT 0 | 排序序号 |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() | 创建时间 |

```sql
CREATE TABLE rel_history (
    id              VARCHAR(64)   PRIMARY KEY,
    relationship_id VARCHAR(64)   NOT NULL REFERENCES relationship(id) ON DELETE CASCADE,
    label           VARCHAR(50)   NOT NULL,
    description     TEXT,
    sort_order      INT           NOT NULL DEFAULT 0,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_relhist_rel ON rel_history(relationship_id);
COMMENT ON TABLE rel_history IS '关系演变历史表';
```

---

### 2.8 rel_event — 关系事件表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `VARCHAR(64)` | PK | 事件唯一标识 |
| `relationship_id` | `VARCHAR(64)` | FK → relationship.id, NOT NULL | 所属关系 |
| `title` | `VARCHAR(200)` | NOT NULL | 事件标题 |
| `description` | `TEXT` | | 事件描述 |
| `event_type` | `VARCHAR(20)` | NOT NULL DEFAULT 'event' | 类型：event / relationship |
| `tag` | `VARCHAR(30)` | | 标签：初识/冲突/合作/和解/背叛/恋爱/关系变化/日常 |
| `source` | `VARCHAR(30)` | | 来源：manual / ai-scene |
| `scene_title` | `VARCHAR(200)` | | AI 场景分析来源场景名 |
| `sort_order` | `INT` | NOT NULL DEFAULT 0 | 排序序号 |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() | 创建时间 |

```sql
CREATE TABLE rel_event (
    id              VARCHAR(64)   PRIMARY KEY,
    relationship_id VARCHAR(64)   NOT NULL REFERENCES relationship(id) ON DELETE CASCADE,
    title           VARCHAR(200)  NOT NULL,
    description     TEXT,
    event_type      VARCHAR(20)   NOT NULL DEFAULT 'event',
    tag             VARCHAR(30),
    source          VARCHAR(30),
    scene_title     VARCHAR(200),
    sort_order      INT           NOT NULL DEFAULT 0,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_rel ON rel_event(relationship_id);
COMMENT ON TABLE  rel_event IS '角色关系事件表';
COMMENT ON COLUMN rel_event.event_type IS 'event=普通事件, relationship=关系变更事件';
COMMENT ON COLUMN rel_event.tag IS '初识/冲突/合作/和解/背叛/恋爱/关系变化/日常';
COMMENT ON COLUMN rel_event.source IS 'manual=手动, ai-scene=AI场景分析';
```

---

### 2.9 scene — 场景表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `VARCHAR(64)` | PK | 场景唯一标识 |
| `project_id` | `VARCHAR(64)` | NOT NULL | 所属项目（预留） |
| `title` | `VARCHAR(200)` | NOT NULL | 场景标题 |
| `image_url` | `TEXT` | | 场景图 URL |
| `keywords` | `TEXT` | | 生成关键词 |
| `edit_keywords` | `TEXT` | | AI 微调关键词 |
| `position_x` | `DOUBLE PRECISION` | NOT NULL DEFAULT 0 | 画布 X 坐标 |
| `position_y` | `DOUBLE PRECISION` | NOT NULL DEFAULT 0 | 画布 Y 坐标 |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() | 创建时间 |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() | 更新时间 |

```sql
CREATE TABLE scene (
    id            VARCHAR(64)       PRIMARY KEY,
    project_id    VARCHAR(64)       NOT NULL,
    title         VARCHAR(200)      NOT NULL,
    image_url     TEXT,
    keywords      TEXT,
    edit_keywords TEXT,
    position_x    DOUBLE PRECISION  NOT NULL DEFAULT 0,
    position_y    DOUBLE PRECISION  NOT NULL DEFAULT 0,
    created_at    TIMESTAMP         NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scene_project ON scene(project_id);
COMMENT ON TABLE scene IS '场景表';
```

---

### 2.10 scene_character — 场景角色配置表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `BIGSERIAL` | PK | 自增主键 |
| `scene_id` | `VARCHAR(64)` | FK → scene.id, NOT NULL | 所属场景 |
| `character_id` | `VARCHAR(64)` | FK → character.id, NOT NULL | 参与角色 |
| `phase_id` | `VARCHAR(64)` | | 指定阶段（NULL=使用当前） |
| `ref_set_id` | `VARCHAR(64)` | | 指定图集（NULL=使用默认） |

```sql
CREATE TABLE scene_character (
    id            BIGSERIAL     PRIMARY KEY,
    scene_id      VARCHAR(64)   NOT NULL REFERENCES scene(id) ON DELETE CASCADE,
    character_id  VARCHAR(64)   NOT NULL REFERENCES character(id) ON DELETE CASCADE,
    phase_id      VARCHAR(64),
    ref_set_id    VARCHAR(64),
    UNIQUE(scene_id, character_id)
);

COMMENT ON TABLE scene_character IS '场景角色配置表（多对多 + 阶段/形象选择）';
```

---

### 2.11 video — 视频表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `VARCHAR(64)` | PK | 视频唯一标识 |
| `project_id` | `VARCHAR(64)` | NOT NULL | 所属项目（预留） |
| `title` | `VARCHAR(200)` | NOT NULL | 视频标题 |
| `script` | `TEXT` | | 剧本 / 台词 |
| `background_setting` | `TEXT` | | 背景设定（场景氛围描述） |
| `storyboard` | `TEXT` | | 分镜描述 |
| `video_url` | `TEXT` | | 视频 URL |
| `status` | `VARCHAR(20)` | NOT NULL DEFAULT 'idle' | 状态：idle / generating / done |
| `position_x` | `DOUBLE PRECISION` | NOT NULL DEFAULT 0 | 画布 X 坐标 |
| `position_y` | `DOUBLE PRECISION` | NOT NULL DEFAULT 0 | 画布 Y 坐标 |
| `created_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() | 创建时间 |
| `updated_at` | `TIMESTAMP` | NOT NULL DEFAULT NOW() | 更新时间 |

```sql
CREATE TABLE video (
    id          VARCHAR(64)       PRIMARY KEY,
    project_id  VARCHAR(64)       NOT NULL,
    title       VARCHAR(200)      NOT NULL,
    script      TEXT,
    background_setting TEXT,
    storyboard  TEXT,
    video_url   TEXT,
    status      VARCHAR(20)       NOT NULL DEFAULT 'idle',
    position_x  DOUBLE PRECISION  NOT NULL DEFAULT 0,
    position_y  DOUBLE PRECISION  NOT NULL DEFAULT 0,
    created_at  TIMESTAMP         NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_video_project ON video(project_id);
COMMENT ON TABLE  video IS '视频表';
COMMENT ON COLUMN video.script IS '剧本 / 台词内容';
COMMENT ON COLUMN video.background_setting IS '背景设定，场景氛围描述';
COMMENT ON COLUMN video.status IS 'idle=待生成, generating=生成中, done=已完成';
```

---

### 2.12 scene_flow — 场景连线表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `VARCHAR(64)` | PK | 连线唯一标识 |
| `project_id` | `VARCHAR(64)` | NOT NULL | 所属项目 |
| `source_id` | `VARCHAR(64)` | NOT NULL | 源节点 ID（scene/video） |
| `target_id` | `VARCHAR(64)` | NOT NULL | 目标节点 ID（scene/video） |
| `source_handle` | `VARCHAR(20)` | | 源锚点，如 bottom |
| `label` | `VARCHAR(50)` | | 连线标签 |

```sql
CREATE TABLE scene_flow (
    id            VARCHAR(64)   PRIMARY KEY,
    project_id    VARCHAR(64)   NOT NULL,
    source_id     VARCHAR(64)   NOT NULL,
    target_id     VARCHAR(64)   NOT NULL,
    source_handle VARCHAR(20),
    label         VARCHAR(50),
    UNIQUE(source_id, target_id)
);

COMMENT ON TABLE scene_flow IS '场景画布连线表（场景→视频等流转关系）';
```

---

## 三、前端 → 数据库字段映射速查

| 前端数据 | 对应表 | 关键字段映射 |
|----------|--------|-------------|
| `characters[]` | `character` | id, name, gender, activePhase → active_phase_id |
| `character.phases[]` | `character_phase` | id, label, role, description, audio → audio_url, audioName → audio_name, activeRefSet → active_ref_set_id |
| `phase.tags[]` | `phase_tag` | phase_id, tag |
| `phase.refSets[]` | `phase_ref_set` | id, label |
| `refSet.images{front,side,...}` | `ref_set_image` | ref_set_id, angle, image_url |
| `relationships[]` | `relationship` | id, source → source_char_id, target → target_char_id, label |
| `relationship.relationshipHistory[]` | `rel_history` | id, label, desc → description |
| `relationship.events[]` | `rel_event` | id, title, desc, type → event_type, tag, source, sceneTitle |
| `demoSceneNodes[type=scene]` | `scene` | id, title, image, keywords, editKeywords, position |
| `scene.characterIds + characterConfigs` | `scene_character` | scene_id, character_id, phase_id, ref_set_id |
| `demoSceneNodes[type=video]` | `video` | id, title, script, backgroundSetting → background_setting, storyboard, videoUrl, status, position |
| `demoSceneEdges[]` | `scene_flow` | id, source_id, target_id, source_handle, label |

---

## 四、初始化 SQL

完整初始化脚本见 `docker/init/01-schema.sql`。
