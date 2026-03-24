package com.aigc3d.adapter;

import com.aigc3d.model.AITaskType;

public interface AICapability {

    boolean supports(AITaskType task);

    boolean supportsImageInput();

    boolean supportsVideoInput();

}
