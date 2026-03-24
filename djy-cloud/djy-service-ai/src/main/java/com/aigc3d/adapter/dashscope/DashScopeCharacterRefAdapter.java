package com.aigc3d.adapter.dashscope;

import com.aigc3d.adapter.AIAdapter;
import com.aigc3d.config.DashScopeProperties;
import com.aigc3d.model.AIInput;
import com.aigc3d.model.AIOutput;
import com.aigc3d.model.AITaskType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * DashScope 角色参考图生成适配器
 * 支持任务：CHARACTER_REF_GENERATION
 *
 * 两种模式：
 * 1. 纯文本（from description）→ 文生图 API (text2image)
 * 2. 带图片 URL（from image / multi-view）→ 图生图 API (image2image)
 */
@Component
public class DashScopeCharacterRefAdapter implements AIAdapter {

    private static final Logger log = LoggerFactory.getLogger(DashScopeCharacterRefAdapter.class);

    private static final String BASE_URL = "https://dashscope.aliyuncs.com/api/v1";
    private static final int POLL_INTERVAL_MS = 3000;
    private static final int MAX_POLL_TIMES = 120;

    private final DashScopeProperties properties;
    private final RestTemplate restTemplate = new RestTemplate();

    public DashScopeCharacterRefAdapter(DashScopeProperties properties) {
        this.properties = properties;
    }

    @Override
    public boolean supports(AITaskType task) {
        return task == AITaskType.CHARACTER_REF_GENERATION;
    }

    @Override
    public boolean supportsImageInput() {
        return true;
    }

    @Override
    public boolean supportsVideoInput() {
        return false;
    }

    @Override
    public AIOutput execute(AITaskType task, AIInput input) {
        try {
            boolean hasImageUrls = input.getImageUrls() != null && !input.getImageUrls().isEmpty();

            if (hasImageUrls) {
                // 图生图模式（from image / multi-view）
                String referenceUrl = input.getImageUrls().get(0);
                return imageToImage(referenceUrl, input.getText());
            } else {
                // 文生图模式（from description）
                return textToImage(input.getText());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("角色参考图生成被中断", e);
        }
    }

    // ===================================================================
    // 文生图 — from description
    // ===================================================================

    private AIOutput textToImage(String prompt) throws InterruptedException {
        Map<String, Object> inputBody = new HashMap<>();
        inputBody.put("prompt", prompt);

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("n", 1);
        parameters.put("size", "1024*1024");

        Map<String, Object> body = new HashMap<>();
        body.put("model", properties.getImageModel());
        body.put("input", inputBody);
        body.put("parameters", parameters);

        log.info("角色参考图(文生图): model={}, prompt长度={}", properties.getImageModel(), prompt.length());

        String taskId = submitTask(BASE_URL + "/services/aigc/text2image/image-synthesis", body);
        Map<String, Object> output = pollTask(taskId);

        return extractImageUrls(output);
    }

    // ===================================================================
    // 图生图 — from image / multi-view
    // ===================================================================

    private AIOutput imageToImage(String referenceImageUrl, String prompt) throws InterruptedException {
        Map<String, Object> inputBody = new HashMap<>();
        inputBody.put("image", referenceImageUrl);
        inputBody.put("prompt", prompt);

        Map<String, Object> body = new HashMap<>();
        body.put("model", properties.getImageEditModel());
        body.put("input", inputBody);

        log.info("角色参考图(图生图): model={}, refUrl={}, prompt长度={}",
                properties.getImageEditModel(), referenceImageUrl, prompt.length());

        String taskId = submitTask(BASE_URL + "/services/aigc/image2image/image-synthesis", body);
        Map<String, Object> output = pollTask(taskId);

        return extractImageUrls(output);
    }

    // ===================================================================
    // 通用方法
    // ===================================================================

    @SuppressWarnings("unchecked")
    private AIOutput extractImageUrls(Map<String, Object> output) {
        List<Map<String, Object>> results = (List<Map<String, Object>>) output.get("results");
        List<String> urls = new ArrayList<>();
        if (results != null) {
            for (Map<String, Object> r : results) {
                Object url = r.get("url");
                if (url != null) urls.add(url.toString());
            }
        }
        if (urls.isEmpty()) {
            throw new RuntimeException("角色参考图生成完成但未返回图片 URL，output: " + output);
        }
        return AIOutput.builder().imageUrls(urls).build();
    }

    @SuppressWarnings("unchecked")
    private String submitTask(String url, Map<String, Object> body) {
        HttpHeaders headers = buildHeaders();
        headers.set("X-DashScope-Async", "enable");
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
        Map<String, Object> resp = response.getBody();
        if (resp == null) throw new RuntimeException("提交角色参考图任务无响应");

        Map<String, Object> output = (Map<String, Object>) resp.get("output");
        if (output == null) throw new RuntimeException("提交任务响应缺少 output：" + resp);

        String taskId = (String) output.get("task_id");
        if (taskId == null || taskId.isBlank()) throw new RuntimeException("提交任务响应缺少 task_id：" + output);

        log.info("角色参考图任务已提交: taskId={}", taskId);
        return taskId;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> pollTask(String taskId) throws InterruptedException {
        String queryUrl = BASE_URL + "/tasks/" + taskId;
        HttpHeaders headers = buildHeaders();
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        for (int i = 0; i < MAX_POLL_TIMES; i++) {
            Thread.sleep(POLL_INTERVAL_MS);
            ResponseEntity<Map> response = restTemplate.exchange(queryUrl, HttpMethod.GET, entity, Map.class);
            Map<String, Object> resp = response.getBody();
            if (resp == null) continue;

            Map<String, Object> output = (Map<String, Object>) resp.get("output");
            if (output == null) continue;

            String status = (String) output.get("task_status");
            if ("SUCCEEDED".equals(status)) {
                log.info("角色参考图任务完成: taskId={}", taskId);
                return output;
            } else if ("FAILED".equals(status)) {
                String code = (String) output.getOrDefault("code", "UNKNOWN");
                String msg = (String) output.getOrDefault("message", "任务失败");
                throw new RuntimeException("角色参考图任务失败 [" + code + "]：" + msg);
            }
            // PENDING / RUNNING → 继续轮询
        }
        throw new RuntimeException("角色参考图任务超时（task_id=" + taskId + "）");
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + properties.getApiKey());
        return headers;
    }
}
