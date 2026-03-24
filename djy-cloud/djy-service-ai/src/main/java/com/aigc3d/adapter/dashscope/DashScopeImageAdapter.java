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
 * DashScope 图片生成/编辑适配器
 * 支持任务：IMAGE_GENERATION
 * - 纯文本输入 → 文生图（wanx-v1）
 * - 文本+图片输入 → 图片编辑（qwen-image-edit-plus）
 */
@Component
public class DashScopeImageAdapter implements AIAdapter {

    private static final Logger log = LoggerFactory.getLogger(DashScopeImageAdapter.class);

    private static final String BASE_URL = "https://dashscope.aliyuncs.com/api/v1";
    private static final int POLL_INTERVAL_MS = 3000;
    private static final int MAX_POLL_TIMES = 120;

    private final DashScopeProperties properties;
    private final RestTemplate restTemplate = new RestTemplate();

    public DashScopeImageAdapter(DashScopeProperties properties) {
        this.properties = properties;
    }

    @Override
    public boolean supports(AITaskType task) {
        return task == AITaskType.IMAGE_GENERATION;
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
            boolean hasImages = input.getImages() != null && !input.getImages().isEmpty();

            if (hasImages) {
                return editImage(input);
            } else {
                return generateImage(input);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("图片任务被中断", e);
        }
    }

    // ===================================================================
    // 文生图 - wanx-v1
    // ===================================================================

    private AIOutput generateImage(AIInput input) throws InterruptedException {
        Map<String, Object> inputBody = new HashMap<>();
        inputBody.put("prompt", input.getText());

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("n", 1);
        parameters.put("size", "1024*1024");

        Map<String, Object> body = new HashMap<>();
        body.put("model", properties.getImageModel());
        body.put("input", inputBody);
        body.put("parameters", parameters);

        log.info("DashScope 文生图: model={}, prompt={}", properties.getImageModel(), input.getText());

        String taskId = submitTask(BASE_URL + "/services/aigc/text2image/image-synthesis", body);
        Map<String, Object> output = pollTask(taskId);

        return extractImageUrls(output);
    }

    // ===================================================================
    // 图片编辑 - qwen-image-edit-plus
    // ===================================================================

    private AIOutput editImage(AIInput input) throws InterruptedException {
        String base64 = Base64.getEncoder().encodeToString(input.getImages().get(0));
        String dataUri = "data:image/png;base64," + base64;

        Map<String, Object> inputBody = new HashMap<>();
        inputBody.put("image", dataUri);
        inputBody.put("prompt", input.getText());

        Map<String, Object> body = new HashMap<>();
        body.put("model", properties.getImageEditModel());
        body.put("input", inputBody);

        log.info("DashScope 图片编辑: model={}", properties.getImageEditModel());

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
        return AIOutput.builder().imageUrls(urls).build();
    }

    @SuppressWarnings("unchecked")
    private String submitTask(String url, Map<String, Object> body) {
        HttpHeaders headers = buildHeaders();
        headers.set("X-DashScope-Async", "enable");
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
        Map<String, Object> resp = response.getBody();
        if (resp == null) throw new RuntimeException("提交任务无响应");

        Map<String, Object> output = (Map<String, Object>) resp.get("output");
        if (output == null) throw new RuntimeException("提交任务响应缺少 output：" + resp);

        String taskId = (String) output.get("task_id");
        if (taskId == null || taskId.isBlank()) throw new RuntimeException("提交任务响应缺少 task_id：" + output);

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
                return output;
            } else if ("FAILED".equals(status)) {
                String code = (String) output.getOrDefault("code", "UNKNOWN");
                String msg = (String) output.getOrDefault("message", "任务失败");
                throw new RuntimeException("任务失败 [" + code + "]：" + msg);
            }
        }
        throw new RuntimeException("任务超时（task_id=" + taskId + "）");
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + properties.getApiKey());
        return headers;
    }
}
