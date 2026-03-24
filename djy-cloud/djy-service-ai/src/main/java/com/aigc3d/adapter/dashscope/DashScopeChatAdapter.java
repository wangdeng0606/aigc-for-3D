package com.aigc3d.adapter.dashscope;

import com.aigc3d.adapter.AIAdapter;
import com.aigc3d.config.DashScopeProperties;
import com.aigc3d.model.AIInput;
import com.aigc3d.model.AIOutput;
import com.aigc3d.model.AITaskType;
import com.alibaba.dashscope.aigc.multimodalconversation.MultiModalConversation;
import com.alibaba.dashscope.aigc.multimodalconversation.MultiModalConversationParam;
import com.alibaba.dashscope.aigc.multimodalconversation.MultiModalConversationResult;
import com.alibaba.dashscope.common.MultiModalMessage;
import com.alibaba.dashscope.common.Role;
import com.alibaba.dashscope.exception.ApiException;
import com.alibaba.dashscope.exception.NoApiKeyException;
import com.alibaba.dashscope.exception.UploadFileException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * DashScope 多模态对话适配器
 * 支持任务：TEXT_GENERATION, IMAGE_ANALYSIS, OBJECT_DETECTION, SCENE_UNDERSTANDING, SCENE_TO_3D
 */
@Component
public class DashScopeChatAdapter implements AIAdapter {

    private static final Logger log = LoggerFactory.getLogger(DashScopeChatAdapter.class);

    private static final Set<AITaskType> SUPPORTED_TASKS = EnumSet.of(
            AITaskType.TEXT_GENERATION,
            AITaskType.IMAGE_ANALYSIS,
            AITaskType.OBJECT_DETECTION,
            AITaskType.SCENE_UNDERSTANDING,
            AITaskType.SCENE_TO_3D
    );

    private final DashScopeProperties properties;
    private final MultiModalConversation conversation;

    public DashScopeChatAdapter(DashScopeProperties properties) {
        this.properties = properties;
        this.conversation = new MultiModalConversation();
    }

    @Override
    public boolean supports(AITaskType task) {
        return SUPPORTED_TASKS.contains(task);
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
            List<Map<String, Object>> contentParts = buildContent(input);

            MultiModalMessage userMessage = MultiModalMessage.builder()
                    .role(Role.USER.getValue())
                    .content(contentParts)
                    .build();

            MultiModalConversationParam param = MultiModalConversationParam.builder()
                    .model(properties.getChatModel())
                    .apiKey(properties.getApiKey())
                    .messages(List.of(userMessage))
                    .topP(properties.getTopP())
                    .build();

            log.info("DashScope chat request: task={}, model={}, hasImages={}",
                    task, properties.getChatModel(), input.getImages() != null && !input.getImages().isEmpty());

            MultiModalConversationResult result = conversation.call(param);

            String responseText = result.getOutput().getChoices().get(0)
                    .getMessage().getContent().get(0).get("text").toString();

            return AIOutput.builder().text(responseText).build();

        } catch (ApiException | NoApiKeyException | UploadFileException e) {
            throw new RuntimeException("DashScope 对话调用失败: " + e.getMessage(), e);
        }
    }

    private List<Map<String, Object>> buildContent(AIInput input) {
        List<Map<String, Object>> parts = new ArrayList<>();

        // 图片内容
        if (input.getImages() != null) {
            for (byte[] img : input.getImages()) {
                String base64 = Base64.getEncoder().encodeToString(img);
                String dataUri = "data:image/png;base64," + base64;
                parts.add(Map.of("image", dataUri));
            }
        }

        // 文本内容（放在最后）
        if (input.getText() != null && !input.getText().isBlank()) {
            parts.add(Map.of("text", input.getText()));
        }

        return parts;
    }
}
