package com.aigc3d.adapter;

import com.aigc3d.model.AIInput;
import com.aigc3d.model.AIOutput;
import com.aigc3d.model.AITaskType;

public interface AIAdapter extends AICapability {

    AIOutput execute(AITaskType task, AIInput input);

}
