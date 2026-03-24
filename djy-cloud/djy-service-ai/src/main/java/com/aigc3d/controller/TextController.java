package com.aigc3d.controller;

import com.aigc3d.service.AIService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * ============================================================
 * AI 文本输出接口 — 所有返回文本/结构化文本的能力
 * base path: /api/text
 * ------------------------------------------------------------
 * GET  /api/text/health                  — 健康检查
 * POST /api/text/chat                    — 纯文本对话
 * POST /api/text/analyze-image           — 图片内容描述分析
 * POST /api/text/detect-objects          — 图片物品识别
 * POST /api/text/scene-json              — 图片 → 3D 场景 JSON
 * POST /api/text/scene-coordinates       — 图片 + 物品数据 → 空间坐标
 * POST /api/text/face-description        — 面部特征描述生成
 * POST /api/text/analyze-scene           — 文本场景分析
 * ============================================================
 */
@RestController
@RequestMapping("/api/text")
@CrossOrigin(origins = "*")
public class TextController {

    private final AIService aiService;

    public TextController(AIService aiService) {
        this.aiService = aiService;
    }

    // ----------------------------------------------------------
    // 健康检查
    // ----------------------------------------------------------

    /** GET /api/text/health — 服务存活检测 */
    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "message", "AI服务运行正常");
    }

    // ----------------------------------------------------------
    // 纯文本对话
    // ----------------------------------------------------------

    /**
     * POST /api/text/chat
     * Body: { "message": "你好" }
     * 返回: { "response": "..." }
     */
    @PostMapping("/chat")
    public Map<String, String> chat(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        if (message == null || message.trim().isEmpty()) {
            throw new IllegalArgumentException("消息不能为空");
        }
        String response = aiService.chat(message);
        return Map.of("response", response);
    }

    // ----------------------------------------------------------
    // 图片多模态分析
    // ----------------------------------------------------------

    /**
     * POST /api/text/analyze-image  (multipart/form-data)
     * 参数: image=<文件>
     * 返回: { "description": "图片详细描述" }
     */
    @PostMapping(value = "/analyze-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> analyzeImage(@RequestParam("image") MultipartFile image) {
        if (image.isEmpty()) throw new IllegalArgumentException("图片不能为空");
        try {
            String description = aiService.analyzeImage(image.getBytes());
            return Map.of("description", description);
        } catch (IOException e) {
            throw new RuntimeException("图片读取失败: " + e.getMessage(), e);
        }
    }

    /**
     * POST /api/text/detect-objects  (multipart/form-data)
     * 参数: image=<文件>
     * 返回: { "success": true, "data": "识别结果 JSON 字符串" }
     */
    @PostMapping(value = "/detect-objects", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> detectObjects(@RequestParam("image") MultipartFile image) {
        if (image.isEmpty()) throw new IllegalArgumentException("图片不能为空");
        try {
            String result = aiService.detectObjects(image.getBytes());
            return Map.of("success", true, "data", result);
        } catch (IOException e) {
            throw new RuntimeException("图片读取失败: " + e.getMessage(), e);
        }
    }

    // ----------------------------------------------------------
    // 3D 场景生成（文本输出）
    // ----------------------------------------------------------

    /**
     * POST /api/text/scene-json  (multipart/form-data)
     * 参数: image=<文件>
     * 流程: 图片 → 描述 → 3D 场景 JSON
     * 返回: { "description": "...", "sceneJSON": "{...}" }
     */
    @PostMapping(value = "/scene-json", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> generateSceneJSON(@RequestParam("image") MultipartFile image) {
        if (image.isEmpty()) throw new IllegalArgumentException("图片不能为空");
        try {
            byte[] imageBytes = image.getBytes();
            String description = aiService.analyzeImage(imageBytes);
            String sceneJSON = aiService.generateSceneJSON(description);
            return Map.of("description", description, "sceneJSON", sceneJSON);
        } catch (IOException e) {
            throw new RuntimeException("图片读取失败: " + e.getMessage(), e);
        }
    }

    /**
     * POST /api/text/scene-coordinates  (multipart/form-data)
     * 参数: image=<文件>, objectsData=<物品识别结果 JSON 字符串>
     * 返回: { "success": true, "sceneJSON": "{...}" }
     */
    @PostMapping(value = "/scene-coordinates", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> generateSceneCoordinates(
            @RequestParam("image") MultipartFile image,
            @RequestParam("objectsData") String objectsData) {
        if (image.isEmpty()) throw new IllegalArgumentException("图片不能为空");
        if (objectsData == null || objectsData.trim().isEmpty()) throw new IllegalArgumentException("物品数据不能为空");
        try {
            String sceneJSON = aiService.generateSceneCoordinates(image.getBytes(), objectsData);
            return Map.of("success", true, "sceneJSON", sceneJSON);
        } catch (IOException e) {
            throw new RuntimeException("图片读取失败: " + e.getMessage(), e);
        }
    }

    // ----------------------------------------------------------
    // 面部 & 场景描述
    // ----------------------------------------------------------

    /**
     * POST /api/text/face-description
     * Body: { "眼睛": "大眼睛", "嘴巴": "薄唇" ... }  key=部位, value=描述
     * 返回: { "success": true, "description": "完整面部描述" }
     */
    @PostMapping("/face-description")
    public Map<String, Object> generateFaceDescription(@RequestBody Map<String, String> selectedFeatures) {
        if (selectedFeatures == null || selectedFeatures.isEmpty()) {
            throw new IllegalArgumentException("请至少选择一个部位的描述");
        }
        String description = aiService.generateFaceDescription(selectedFeatures);
        return Map.of("success", true, "description", description);
    }

    /**
     * POST /api/text/analyze-scene
     * Body: { "sceneDescription": "客厅里有沙发和茶几..." }
     * 返回: { "analysis": "空间布局建议..." }
     */
    @PostMapping("/analyze-scene")
    public Map<String, String> analyzeScene(@RequestBody Map<String, String> request) {
        String sceneDescription = request.get("sceneDescription");
        if (sceneDescription == null || sceneDescription.trim().isEmpty()) {
            throw new IllegalArgumentException("场景描述不能为空");
        }
        String analysis = aiService.analyzeScene(sceneDescription);
        return Map.of("analysis", analysis);
    }
}
