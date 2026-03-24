package com.aigc3d.controller;

import com.aigc3d.model.AIOutput;
import com.aigc3d.service.AIService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * ============================================================
 * AI 图片输出接口 — 所有返回图片 URL 的能力
 * base path: /api/image
 * ------------------------------------------------------------
 * POST /api/image/generate       — 文生图（wanx-v1，异步轮询）
 * POST /api/image/edit           — 图片编辑，上传文件（multipart）
 * POST /api/image/edit-base64    — 图片编辑，JSON base64 方式
 * ============================================================
 */
@RestController
@RequestMapping("/api/image")
@CrossOrigin(origins = "*")
public class ImageController {

    private final AIService aiService;

    public ImageController(AIService aiService) {
        this.aiService = aiService;
    }

    // ----------------------------------------------------------
    // 文生图
    // ----------------------------------------------------------

    /**
     * POST /api/image/generate
     * 使用 wanx-v1 模型，根据提示词生成图片（异步任务，自动轮询结果）
     *
     * Body JSON:
     * {
     *   "prompt": "一只金色柴犬在雪地里奔跑"  // 必填
     * }
     * 返回: { "success": true, "images": ["https://...", ...] }
     */
    @PostMapping("/generate")
    public Map<String, Object> generateImage(@RequestBody Map<String, Object> req) {
        String prompt = (String) req.getOrDefault("prompt", "");
        if (prompt.isBlank()) throw new IllegalArgumentException("prompt 不能为空");

        AIOutput output = aiService.generateImage(prompt);
        List<String> urls = output.getImageUrls() != null ? output.getImageUrls() : List.of();
        return Map.of("success", true, "images", urls);
    }

    // ----------------------------------------------------------
    // 图片编辑（multipart 方式）
    // ----------------------------------------------------------

    /**
     * POST /api/image/edit  (multipart/form-data)
     * 使用 qwen-image-edit-plus 模型，上传图片文件进行 AI 编辑
     *
     * 参数:
     *   image  — 图片文件（form-data）
     *   prompt — 编辑指令，如「将背景换成星空」
     * 返回: { "success": true, "images": ["https://..."] }
     */
    @PostMapping(value = "/edit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> editImage(
            @RequestParam("image") MultipartFile image,
            @RequestParam("prompt") String prompt) {
        if (image.isEmpty()) throw new IllegalArgumentException("图片不能为空");
        if (prompt.isBlank()) throw new IllegalArgumentException("prompt 不能为空");

        try {
            AIOutput output = aiService.editImage(image.getBytes(), prompt);
            List<String> urls = output.getImageUrls() != null ? output.getImageUrls() : List.of();
            return Map.of("success", true, "images", urls);
        } catch (IOException e) {
            throw new RuntimeException("图片读取失败: " + e.getMessage(), e);
        }
    }

    // ----------------------------------------------------------
    // 图片编辑（JSON base64 方式）
    // ----------------------------------------------------------

    /**
     * POST /api/image/edit-base64  (application/json)
     * 使用 qwen-image-edit-plus 模型，接受 base64 图片进行 AI 编辑
     *
     * Body JSON:
     * {
     *   "image": "data:image/png;base64,iVBOR..."  // base64 data URI 或纯 base64
     *   "prompt": "将背景换成星空"
     * }
     * 返回: { "success": true, "images": ["https://..."] }
     */
    @PostMapping("/edit-base64")
    public Map<String, Object> editImageBase64(@RequestBody Map<String, String> req) {
        String imageData = req.getOrDefault("image", "");
        String prompt = req.getOrDefault("prompt", "");
        if (imageData.isBlank()) throw new IllegalArgumentException("image 不能为空");
        if (prompt.isBlank()) throw new IllegalArgumentException("prompt 不能为空");

        // 去掉 data URI 前缀，提取纯 base64
        String base64 = imageData;
        if (base64.contains(",")) {
            base64 = base64.substring(base64.indexOf(",") + 1);
        }

        byte[] imageBytes = java.util.Base64.getDecoder().decode(base64);
        AIOutput output = aiService.editImage(imageBytes, prompt);
        List<String> urls = output.getImageUrls() != null ? output.getImageUrls() : List.of();
        return Map.of("success", true, "images", urls);
    }
}
