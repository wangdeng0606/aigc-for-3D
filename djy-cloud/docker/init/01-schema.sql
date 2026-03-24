-- ============================================================
-- 短剧园（DJY）数据库初始化 DDL
-- PostgreSQL 16
-- ============================================================

-- 1. 角色表
CREATE TABLE IF NOT EXISTS character (
    id              VARCHAR(64)   PRIMARY KEY,
    name            VARCHAR(100)  NOT NULL,
    gender          VARCHAR(10)   NOT NULL DEFAULT '未设定',
    active_phase_id VARCHAR(64),
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  character IS '角色表';

-- 2. 成长阶段表
CREATE TABLE IF NOT EXISTS character_phase (
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
CREATE INDEX IF NOT EXISTS idx_phase_character ON character_phase(character_id);
COMMENT ON TABLE character_phase IS '角色成长阶段表';

-- 3. 阶段标签表
CREATE TABLE IF NOT EXISTS phase_tag (
    id        BIGSERIAL     PRIMARY KEY,
    phase_id  VARCHAR(64)   NOT NULL REFERENCES character_phase(id) ON DELETE CASCADE,
    tag       VARCHAR(50)   NOT NULL,
    UNIQUE(phase_id, tag)
);
COMMENT ON TABLE phase_tag IS '阶段特征标签表';

-- 4. 参考图集表（形象）
CREATE TABLE IF NOT EXISTS phase_ref_set (
    id          VARCHAR(64)   PRIMARY KEY,
    phase_id    VARCHAR(64)   NOT NULL REFERENCES character_phase(id) ON DELETE CASCADE,
    label       VARCHAR(100)  NOT NULL,
    sort_order  INT           NOT NULL DEFAULT 0,
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refset_phase ON phase_ref_set(phase_id);
COMMENT ON TABLE phase_ref_set IS '参考图集表（角色形象）';

-- 5. 参考图表（多角度）
CREATE TABLE IF NOT EXISTS ref_set_image (
    id          BIGSERIAL     PRIMARY KEY,
    ref_set_id  VARCHAR(64)   NOT NULL REFERENCES phase_ref_set(id) ON DELETE CASCADE,
    angle       VARCHAR(20)   NOT NULL,
    image_url   TEXT          NOT NULL,
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
    UNIQUE(ref_set_id, angle)
);
COMMENT ON TABLE  ref_set_image IS '参考图表（多角度）';
COMMENT ON COLUMN ref_set_image.angle IS 'front=正面, side=侧面, back=背面, quarter=3/4视角';

-- 6. 角色关系表
CREATE TABLE IF NOT EXISTS relationship (
    id              VARCHAR(64)   PRIMARY KEY,
    source_char_id  VARCHAR(64)   NOT NULL REFERENCES character(id) ON DELETE CASCADE,
    target_char_id  VARCHAR(64)   NOT NULL REFERENCES character(id) ON DELETE CASCADE,
    label           VARCHAR(50)   NOT NULL DEFAULT '陌生人',
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    UNIQUE(source_char_id, target_char_id)
);
CREATE INDEX IF NOT EXISTS idx_rel_source ON relationship(source_char_id);
CREATE INDEX IF NOT EXISTS idx_rel_target ON relationship(target_char_id);
COMMENT ON TABLE relationship IS '角色关系表';

-- 7. 关系演变历史表
CREATE TABLE IF NOT EXISTS rel_history (
    id              VARCHAR(64)   PRIMARY KEY,
    relationship_id VARCHAR(64)   NOT NULL REFERENCES relationship(id) ON DELETE CASCADE,
    label           VARCHAR(50)   NOT NULL,
    description     TEXT,
    sort_order      INT           NOT NULL DEFAULT 0,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_relhist_rel ON rel_history(relationship_id);
COMMENT ON TABLE rel_history IS '关系演变历史表';

-- 8. 关系事件表
CREATE TABLE IF NOT EXISTS rel_event (
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
CREATE INDEX IF NOT EXISTS idx_event_rel ON rel_event(relationship_id);
COMMENT ON TABLE  rel_event IS '角色关系事件表';

-- 9. 场景表
CREATE TABLE IF NOT EXISTS scene (
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
CREATE INDEX IF NOT EXISTS idx_scene_project ON scene(project_id);
COMMENT ON TABLE scene IS '场景表';

-- 10. 场景角色配置表
CREATE TABLE IF NOT EXISTS scene_character (
    id            BIGSERIAL     PRIMARY KEY,
    scene_id      VARCHAR(64)   NOT NULL REFERENCES scene(id) ON DELETE CASCADE,
    character_id  VARCHAR(64)   NOT NULL REFERENCES character(id) ON DELETE CASCADE,
    phase_id      VARCHAR(64),
    ref_set_id    VARCHAR(64),
    UNIQUE(scene_id, character_id)
);
COMMENT ON TABLE scene_character IS '场景角色配置表';

-- 11. 视频表
CREATE TABLE IF NOT EXISTS video (
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
CREATE INDEX IF NOT EXISTS idx_video_project ON video(project_id);
COMMENT ON TABLE video IS '视频表';

-- 12. 场景连线表
CREATE TABLE IF NOT EXISTS scene_flow (
    id            VARCHAR(64)   PRIMARY KEY,
    project_id    VARCHAR(64)   NOT NULL,
    source_id     VARCHAR(64)   NOT NULL,
    target_id     VARCHAR(64)   NOT NULL,
    source_handle VARCHAR(20),
    label         VARCHAR(50),
    UNIQUE(source_id, target_id)
);
COMMENT ON TABLE scene_flow IS '场景画布连线表';
