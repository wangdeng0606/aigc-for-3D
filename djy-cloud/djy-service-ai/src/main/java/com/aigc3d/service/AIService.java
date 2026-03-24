package com.aigc3d.service;

import com.aigc3d.model.AIInput;
import com.aigc3d.model.AIOutput;
import com.aigc3d.model.AITaskType;
import com.aigc3d.router.AIRouter;
import com.aigc3d.util.PromptLoader;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class AIService {

    private final AIRouter router;
    private final PromptLoader promptLoader;

    public AIService(AIRouter router, PromptLoader promptLoader) {
        this.router = router;
        this.promptLoader = promptLoader;
    }

    /**
     * 通用执行入口
     */
    public AIOutput execute(AITaskType task, AIInput input) {
        return router.route(task, input);
    }

    /**
     * 纯文本对话
     */
    public String chat(String message) {
        AIInput input = AIInput.builder().text(message).build();
        AIOutput output = router.route(AITaskType.TEXT_GENERATION, input);
        return output.getText();
    }

    /**
     * 图片分析 - 多模态
     */
    public String analyzeImage(byte[] imageBytes) {
        String prompt = promptLoader.loadPrompt("analyze-image");
        AIInput input = AIInput.builder()
                .text(prompt)
                .images(List.of(imageBytes))
                .build();
        AIOutput output = router.route(AITaskType.IMAGE_ANALYSIS, input);
        return output.getText();
    }

    /**
     * 场景分析
     */
    public String analyzeScene(String sceneDescription) {
        String prompt = String.format(
                "作为3D场景分析专家，请分析以下场景描述并提供空间布局建议：\n%s\n\n" +
                "请提供：\n1. 主要物体识别\n2. 空间关系分析\n3. 建议的锚点物体",
                sceneDescription
        );
        AIInput input = AIInput.builder().text(prompt).build();
        AIOutput output = router.route(AITaskType.SCENE_UNDERSTANDING, input);
        return output.getText();
    }

    /**
     * 物品识别 - 多模态
     */
    public String detectObjects(byte[] imageBytes) {
        String prompt = promptLoader.loadPrompt("detect-objects");
        AIInput input = AIInput.builder()
                .text(prompt)
                .images(List.of(imageBytes))
                .build();
        AIOutput output = router.route(AITaskType.OBJECT_DETECTION, input);
        return output.getText();
    }

    /**
     * 生成场景坐标 - 多模态（图片+物品数据）
     */
    public String generateSceneCoordinates(byte[] imageBytes, String objectsDataJson) {
        String prompt = promptLoader.loadPromptWithVariables(
                "generate-scene-coordinates",
                Map.of("objectsData", objectsDataJson)
        );
        AIInput input = AIInput.builder()
                .text(prompt)
                .images(List.of(imageBytes))
                .build();
        AIOutput output = router.route(AITaskType.SCENE_TO_3D, input);
        return output.getText();
    }

    /**
     * 生成面部表情描述
     */
    public String generateFaceDescription(Map<String, String> selectedFeatures) {
        StringBuilder featuresText = new StringBuilder();
        for (Map.Entry<String, String> entry : selectedFeatures.entrySet()) {
            featuresText.append("【").append(entry.getKey()).append("】").append(entry.getValue()).append("\n");
        }
        String prompt = promptLoader.loadPromptWithVariables(
                "generate-face-description",
                Map.of("selectedFeatures", featuresText.toString().trim())
        );
        AIInput input = AIInput.builder().text(prompt).build();
        AIOutput output = router.route(AITaskType.TEXT_GENERATION, input);
        return output.getText();
    }

    /**
     * 根据图片描述生成3D场景JSON
     */
    public String generateSceneJSON(String imageDescription) {
        String prompt = promptLoader.loadPromptWithVariables(
                "generate-scene-json",
                Map.of("imageDescription", imageDescription)
        );
        AIInput input = AIInput.builder().text(prompt).build();
        AIOutput output = router.route(AITaskType.SCENE_TO_3D, input);
        return output.getText();
    }

    /**
     * 文生图
     */
    public AIOutput generateImage(String prompt) {
        AIInput input = AIInput.builder().text(prompt).build();
        return router.route(AITaskType.IMAGE_GENERATION, input);
    }

    /**
     * 图片编辑
     */
    public AIOutput editImage(byte[] imageBytes, String prompt) {
        AIInput input = AIInput.builder()
                .text(prompt)
                .images(List.of(imageBytes))
                .build();
        return router.route(AITaskType.IMAGE_GENERATION, input);
    }

    /**
     * 文生视频
     */
    public AIOutput generateVideo(String prompt, String audioUrl) {
        AIInput.AIInputBuilder builder = AIInput.builder().text(prompt);
        if (audioUrl != null && !audioUrl.isBlank()) {
            builder.audioUrl(audioUrl);
        }
        return router.route(AITaskType.VIDEO_GENERATION, builder.build());
    }

    // ===================================================================
    // 角色参考图生成
    // ===================================================================

    /**
     * 正面图 — 从参考图片生成
     */
    public AIOutput characterRefFrontFromImage(String imageUrl) {
        String prompt = promptLoader.loadPrompt("character-ref-front-from-image");
        AIInput input = AIInput.builder()
                .text(prompt)
                .imageUrls(List.of(imageUrl))
                .build();
        return router.route(AITaskType.CHARACTER_REF_GENERATION, input);
    }

    /**
     * 正面图 — 从描述标签生成
     * @param attributes 结构化属性 map，key=gender/style/hair/outfit/body/vibe，value=标签列表
     */
    public AIOutput characterRefFrontFromDescription(Map<String, List<String>> attributes) {
        Map<String, String> vars = new java.util.HashMap<>();
        for (String key : List.of("gender", "style", "hair", "outfit", "body", "vibe")) {
            List<String> tags = attributes.getOrDefault(key, List.of());
            vars.put(key, tags.isEmpty() ? "not specified" : String.join(", ", tags));
        }
        String prompt = promptLoader.loadPromptWithVariables("character-ref-front-from-description", vars);
        AIInput input = AIInput.builder().text(prompt).build();
        return router.route(AITaskType.CHARACTER_REF_GENERATION, input);
    }

    /**
     * 多角度视图 — 从正面参考图生成 left / right / back
     * @param frontImageUrl 正面图 URL
     * @param view 视角: "left" / "right" / "back"
     */
    public AIOutput characterRefView(String frontImageUrl, String view) {
        String promptName = "character-ref-view-" + view;
        String prompt = promptLoader.loadPrompt(promptName);
        AIInput input = AIInput.builder()
                .text(prompt)
                .imageUrls(List.of(frontImageUrl))
                .build();
        return router.route(AITaskType.CHARACTER_REF_GENERATION, input);
    }
}