package com.aigc3d.controller;

import com.aigc3d.model.AIOutput;
import com.aigc3d.service.AIService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.StringJoiner;

/**
 * ============================================================
 * AI 视频输出接口 — 所有返回视频 URL 的能力
 * base path: /api/video
 * ------------------------------------------------------------
 * POST /api/video/generate       — 文生视频（wan2.6-t2v，官方 SDK 同步调用）
 * ============================================================
 */
@RestController
@RequestMapping("/api/video")
@CrossOrigin(origins = "*")
public class VideoController {

    private static final Logger log = LoggerFactory.getLogger(VideoController.class);

    private final AIService aiService;

    public VideoController(AIService aiService) {
        this.aiService = aiService;
    }

    // ----------------------------------------------------------
    // 文生视频
    // ----------------------------------------------------------

    /**
     * POST /api/video/generate
     * 使用 wan2.6-t2v 模型，根据结构化上下文生成视频（同步调用，约 1-5 分钟）
     *
     * Body JSON:
     * {
     *   "script":            "剧本/台词",
     *   "backgroundSetting": "背景设定",
     *   "storyboard":        "分镜描述",
     *   "audioUrl":          "角色音频 URL（可选）",
     *   "characters": [
     *     { "name": "沈逸风", "role": "武当弟子", "description": "白衣长剑青年", "tags": ["正义", "坚韧"] }
     *   ]
     * }
     * 返回: { "success": true, "videoUrl": "https://..." }
     */
    @SuppressWarnings("unchecked")
    @PostMapping("/generate")
    public Map<String, Object> generateVideo(@RequestBody Map<String, Object> req) {

        String prompt = buildPrompt(req);
        if (prompt.isBlank()) throw new IllegalArgumentException("prompt 不能为空，请至少填写剧本或背景设定");

        String audioUrl = (String) req.get("audioUrl");

        log.info("视频生成请求 — prompt 长度={}, audioUrl={}", prompt.length(), audioUrl != null ? "有" : "无");
        log.info("完整 prompt:\n{}", prompt);

        AIOutput output = aiService.generateVideo(prompt, audioUrl);
        return Map.of("success", true, "videoUrl", output.getVideoUrl());
    }

    /**
     * 从前端提交的结构化数据构建完整 prompt
     */
    @SuppressWarnings("unchecked")
    private String buildPrompt(Map<String, Object> req) {
        StringJoiner sj = new StringJoiner("\n");

        // 1. 场景环境
        String bg = (String) req.get("backgroundSetting");
        if (bg != null && !bg.isBlank()) {
            sj.add("【场景环境】" + bg.trim());
        }

        // 2. 角色描述
        List<Map<String, Object>> characters = (List<Map<String, Object>>) req.get("characters");
        if (characters != null && !characters.isEmpty()) {
            StringBuilder charDesc = new StringBuilder("【角色描述】");
            for (Map<String, Object> c : characters) {
                String name = (String) c.getOrDefault("name", "");
                String role = (String) c.getOrDefault("role", "");
                String desc = (String) c.getOrDefault("description", "");
                List<String> tags = (List<String>) c.get("tags");

                StringBuilder sb = new StringBuilder();
                if (!name.isBlank()) sb.append(name);
                if (!role.isBlank()) sb.append("（").append(role).append("）");
                if (!desc.isBlank()) sb.append("，").append(desc);
                if (tags != null && !tags.isEmpty()) sb.append("，特征：").append(String.join("、", tags));

                if (!sb.isEmpty()) charDesc.append("\n  · ").append(sb);
            }
            sj.add(charDesc.toString());
        }

        // 3. 剧情动作
        String script = (String) req.get("script");
        if (script != null && !script.isBlank()) {
            sj.add("【剧情动作】" + script.trim());
        }

        // 4. 镜头语言
        String storyboard = (String) req.get("storyboard");
        if (storyboard != null && !storyboard.isBlank()) {
            sj.add("【镜头语言】" + storyboard.trim());
        }

        // 5. 风格指令（固定后缀）
        sj.add("【风格】电影感，高质量，细节丰富，光影自然");

        return sj.toString();
    }
}
