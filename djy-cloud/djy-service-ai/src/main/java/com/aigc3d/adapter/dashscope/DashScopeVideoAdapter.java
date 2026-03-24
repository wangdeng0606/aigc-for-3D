package com.aigc3d.adapter.dashscope;

import com.aigc3d.adapter.AIAdapter;
import com.aigc3d.config.DashScopeProperties;
import com.aigc3d.model.AIInput;
import com.aigc3d.model.AIOutput;
import com.aigc3d.model.AITaskType;
import com.alibaba.dashscope.aigc.videosynthesis.VideoSynthesis;
import com.alibaba.dashscope.aigc.videosynthesis.VideoSynthesisParam;
import com.alibaba.dashscope.aigc.videosynthesis.VideoSynthesisResult;
import com.alibaba.dashscope.utils.Constants;
import com.alibaba.dashscope.utils.JsonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * DashScope 视频生成适配器（官方 SDK）
 * 支持任务：VIDEO_GENERATION
 * 模型：wan2.6-t2v
 */
@Component
public class DashScopeVideoAdapter implements AIAdapter {

    private static final Logger log = LoggerFactory.getLogger(DashScopeVideoAdapter.class);

    private final DashScopeProperties properties;

    static {
        Constants.baseHttpApiUrl = "https://dashscope.aliyuncs.com/api/v1";
    }

    public DashScopeVideoAdapter(DashScopeProperties properties) {
        this.properties = properties;
    }

    @Override
    public boolean supports(AITaskType task) {
        return task == AITaskType.VIDEO_GENERATION;
    }

    @Override
    public boolean supportsImageInput() {
        return false;
    }

    @Override
    public boolean supportsVideoInput() {
        return false;
    }

    @Override
    public AIOutput execute(AITaskType task, AIInput input) {
        try {
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("prompt_extend", true);
            parameters.put("watermark", false);

            VideoSynthesisParam.VideoSynthesisParamBuilder builder = VideoSynthesisParam.builder()
                    .apiKey(properties.getApiKey())
                    .model(properties.getVideoModel())
                    .prompt(input.getText())
                    .size("1280*720")
                    .duration(5)
                    .parameters(parameters);

            // 音频 URL（角色音频同步）
            if (input.getAudioUrl() != null && !input.getAudioUrl().isBlank()) {
                builder.audioUrl(input.getAudioUrl());
                log.info("附带音频 URL: {}", input.getAudioUrl());
            }

            // 负面提示词
            if (input.getNegativePrompt() != null && !input.getNegativePrompt().isBlank()) {
                builder.negativePrompt(input.getNegativePrompt());
            } else {
                builder.negativePrompt("模糊, 低质量, 变形, 文字水印, 畸形人体");
            }

            VideoSynthesisParam param = builder.build();

            log.info("DashScope 文生视频: model={}, prompt={}", properties.getVideoModel(), input.getText());

            VideoSynthesis vs = new VideoSynthesis();
            VideoSynthesisResult result = vs.call(param);

            log.info("视频生成完成: {}", JsonUtils.toJson(result));

            String videoUrl = result.getOutput().getVideoUrl();
            if (videoUrl == null || videoUrl.isBlank()) {
                throw new RuntimeException("视频生成完成但未返回 video_url，output: " + JsonUtils.toJson(result));
            }

            return AIOutput.builder().videoUrl(videoUrl).build();

        } catch (Exception e) {
            log.error("视频生成失败", e);
            throw new RuntimeException("视频生成失败: " + e.getMessage(), e);
        }
    }
}
