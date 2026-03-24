package com.aigc3d.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "dashscope")
public class DashScopeProperties {

    private String apiKey;

    /** 多模态对话模型（qwen-vl-plus / qwen-vl-max） */
    private String chatModel = "qwen-vl-plus";

    /** 文生图模型 */
    private String imageModel = "wanx-v1";

    /** 图片编辑模型 */
    private String imageEditModel = "qwen-image-edit-plus";

    /** 文生视频模型 */
    private String videoModel = "wan2.1-t2v-turbo";

    /** 温度参数 */
    private Double temperature = 0.1;

    /** top-p 参数 */
    private Double topP = 0.9;

}
