package com.aigc3d.controller;

import com.aigc3d.model.AIOutput;
import com.aigc3d.service.AIService;
import com.aigc3d.service.ImageCropService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 角色参考图生成接口
 *
 * 接口一览：
 * POST /api/character-ref/front-from-image       — 从参考图生成正面全身图
 * POST /api/character-ref/front-from-description  — 从描述标签生成正面全身图
 * POST /api/character-ref/multi-view              — 从正面图生成 left/right/back 多角度
 * POST /api/character-ref/face-closeups            — 从全身图批量裁剪脸部特写
 */
@RestController
@RequestMapping("/api/character-ref")
public class CharacterRefController {

    private static final Logger log = LoggerFactory.getLogger(CharacterRefController.class);
    private static final Set<String> VALID_VIEWS = Set.of("left", "right", "back");

    private final AIService aiService;
    private final ImageCropService imageCropService;

    public CharacterRefController(AIService aiService, ImageCropService imageCropService) {
        this.aiService = aiService;
        this.imageCropService = imageCropService;
    }

    // =================================================================
    // 1. 正面图 — 从参考图片生成（图生图）
    // =================================================================

    /**
     * 请求体：
     * {
     *   "imageUrl": "https://xxx/reference.png"
     * }
     *
     * 响应：
     * {
     *   "success": true,
     *   "imageUrl": "https://xxx/generated-front.png"
     * }
     */
    @PostMapping("/front-from-image")
    public Map<String, Object> frontFromImage(@RequestBody Map<String, String> req) {
        String imageUrl = req.get("imageUrl");
        if (imageUrl == null || imageUrl.isBlank()) {
            throw new IllegalArgumentException("imageUrl 不能为空");
        }

        log.info("角色参考图(图→正面): imageUrl={}", imageUrl);
        AIOutput output = aiService.characterRefFrontFromImage(imageUrl);

        String resultUrl = extractFirstUrl(output);
        return Map.of("success", true, "imageUrl", resultUrl);
    }

    // =================================================================
    // 2. 正面图 — 从描述标签生成（文生图）
    // =================================================================

    /**
     * 请求体（标签数组形式）：
     * {
     *   "gender":  ["女"],
     *   "style":   ["仙侠", "古风"],
     *   "hair":    ["长发", "银色"],
     *   "outfit":  ["白色长裙", "玉佩"],
     *   "body":    ["纤细", "高挑"],
     *   "vibe":    ["冷艳", "高傲"]
     * }
     *
     * 响应：
     * {
     *   "success": true,
     *   "imageUrl": "https://xxx/generated-front.png"
     * }
     */
    @SuppressWarnings("unchecked")
    @PostMapping("/front-from-description")
    public Map<String, Object> frontFromDescription(@RequestBody Map<String, Object> req) {
        Map<String, List<String>> attributes = new LinkedHashMap<>();
        for (String key : List.of("gender", "style", "hair", "outfit", "body", "vibe")) {
            Object val = req.get(key);
            if (val instanceof List) {
                attributes.put(key, (List<String>) val);
            } else if (val instanceof String) {
                attributes.put(key, List.of((String) val));
            } else {
                attributes.put(key, List.of());
            }
        }

        log.info("角色参考图(描述→正面): attributes={}", attributes);
        AIOutput output = aiService.characterRefFrontFromDescription(attributes);

        String resultUrl = extractFirstUrl(output);
        return Map.of("success", true, "imageUrl", resultUrl);
    }

    // =================================================================
    // 3. 多角度视图 — 从正面图生成 left / right / back
    // =================================================================

    /**
     * 请求体：
     * {
     *   "imageUrl": "https://xxx/front-view.png",
     *   "views": ["left", "right", "back"]       // 可选，默认全部三个角度
     * }
     *
     * 响应：
     * {
     *   "success": true,
     *   "results": {
     *     "left":  "https://xxx/left.png",
     *     "right": "https://xxx/right.png",
     *     "back":  "https://xxx/back.png"
     *   }
     * }
     */
    @SuppressWarnings("unchecked")
    @PostMapping("/multi-view")
    public Map<String, Object> multiView(@RequestBody Map<String, Object> req) {
        String imageUrl = (String) req.get("imageUrl");
        if (imageUrl == null || imageUrl.isBlank()) {
            throw new IllegalArgumentException("imageUrl 不能为空");
        }

        // 解析要生成的视角列表，默认全部
        List<String> views;
        Object viewsObj = req.get("views");
        if (viewsObj instanceof List) {
            views = (List<String>) viewsObj;
        } else {
            views = List.of("left", "right", "back");
        }

        // 校验视角合法性
        for (String v : views) {
            if (!VALID_VIEWS.contains(v)) {
                throw new IllegalArgumentException("不支持的视角: " + v + "，可选: left, right, back");
            }
        }

        log.info("角色参考图(多角度): imageUrl={}, views={}", imageUrl, views);

        Map<String, String> results = new LinkedHashMap<>();
        for (String view : views) {
            AIOutput output = aiService.characterRefView(imageUrl, view);
            results.put(view, extractFirstUrl(output));
            log.info("角色参考图 {} 视角生成完成", view);
        }

        return Map.of("success", true, "results", results);
    }

    // =================================================================
    // 4. 脸部特写 — 从全身图批量裁剪
    // =================================================================

    /**
     * 请求体：
     * {
     *   "imageUrls": {
     *     "front":   "https://xxx/front.png",
     *     "side":    "https://xxx/side.png",
     *     "back":    "https://xxx/back.png",
     *     "quarter": "https://xxx/quarter.png"
     *   },
     *   "bodyType": "normal"    // 可选，默认 normal。可选值: normal / giant / child / beast
     * }
     *
     * 响应：
     * {
     *   "success": true,
     *   "faceCloseups": {
     *     "front":   "data:image/png;base64,...",
     *     "side":    "data:image/png;base64,...",
     *     "back":    "data:image/png;base64,...",
     *     "quarter": "data:image/png;base64,..."
     *   }
     * }
     */
    @SuppressWarnings("unchecked")
    @PostMapping("/face-closeups")
    public Map<String, Object> faceCloseups(@RequestBody Map<String, Object> req) {
        Object urlsObj = req.get("imageUrls");
        if (!(urlsObj instanceof Map)) {
            throw new IllegalArgumentException("imageUrls 必须是 { angle: url } 格式的对象");
        }
        Map<String, String> imageUrls = (Map<String, String>) urlsObj;
        if (imageUrls.isEmpty()) {
            throw new IllegalArgumentException("imageUrls 不能为空");
        }

        String bodyType = req.get("bodyType") instanceof String bt ? bt : "normal";

        log.info("脸部特写裁剪: {} 张, bodyType={}", imageUrls.size(), bodyType);

        Map<String, String> faceCloseups = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : imageUrls.entrySet()) {
            String angle = entry.getKey();
            String url = entry.getValue();
            if (url != null && !url.isBlank()) {
                String faceBase64 = imageCropService.cropFaceFromUrl(url, bodyType);
                faceCloseups.put(angle, faceBase64);
                log.info("脸部特写 {} 裁剪完成", angle);
            }
        }

        return Map.of("success", true, "faceCloseups", faceCloseups);
    }

    // =================================================================
    // 辅助
    // =================================================================

    private String extractFirstUrl(AIOutput output) {
        if (output.getImageUrls() == null || output.getImageUrls().isEmpty()) {
            throw new RuntimeException("图片生成完成但未返回 URL");
        }
        return output.getImageUrls().get(0);
    }
}
