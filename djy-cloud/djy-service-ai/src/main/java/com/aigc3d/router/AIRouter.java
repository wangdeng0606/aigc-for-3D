package com.aigc3d.router;

import com.aigc3d.adapter.AIAdapter;
import com.aigc3d.model.AIInput;
import com.aigc3d.model.AIOutput;
import com.aigc3d.model.AITaskType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * AI 路由器
 * 根据任务类型选择合适的 Adapter，校验能力，执行调用
 */
@Component
public class AIRouter {

    private static final Logger log = LoggerFactory.getLogger(AIRouter.class);

    private final List<AIAdapter> adapters;

    public AIRouter(List<AIAdapter> adapters) {
        this.adapters = adapters;
    }

    /**
     * 执行流程：
     * 1. 根据 task 找到支持的 adapter
     * 2. 校验 adapter 是否支持当前 input 类型（capability 层）
     * 3. 过滤不支持的输入
     * 4. 调用 adapter
     */
    public AIOutput route(AITaskType task, AIInput input) {
        AIAdapter adapter = resolveAdapter(task);

        // 能力校验 — 过滤不支持的输入
        AIInput filtered = filterInput(adapter, input);

        log.info("路由: task={} → adapter={}", task, adapter.getClass().getSimpleName());

        return adapter.execute(task, filtered);
    }

    private AIAdapter resolveAdapter(AITaskType task) {
        return adapters.stream()
                .filter(a -> a.supports(task))
                .findFirst()
                .orElseThrow(() -> new UnsupportedOperationException(
                        "没有适配器支持任务类型: " + task));
    }

    /**
     * 能力校验 + 输入过滤
     * 如果 adapter 不支持图片/视频输入，自动移除
     */
    private AIInput filterInput(AIAdapter adapter, AIInput input) {
        AIInput.AIInputBuilder builder = AIInput.builder()
                .text(input.getText())
                .imageUrls(input.getImageUrls())
                .audioUrl(input.getAudioUrl())
                .negativePrompt(input.getNegativePrompt());

        if (adapter.supportsImageInput()) {
            builder.images(input.getImages());
        } else if (input.getImages() != null && !input.getImages().isEmpty()) {
            log.warn("当前适配器不支持图片输入，已自动过滤 {} 张图片", input.getImages().size());
        }

        if (adapter.supportsVideoInput()) {
            builder.videos(input.getVideos());
        } else if (input.getVideos() != null && !input.getVideos().isEmpty()) {
            log.warn("当前适配器不支持视频输入，已自动过滤 {} 个视频", input.getVideos().size());
        }

        return builder.build();
    }
}
