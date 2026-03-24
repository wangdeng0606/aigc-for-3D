package com.aigc3d.util;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Component
public class PromptLoader {

    private static final String PROMPT_BASE_PATH = "prompts/";

    public String loadPrompt(String promptName) {
        try {
            ClassPathResource resource = new ClassPathResource(PROMPT_BASE_PATH + promptName + ".txt");
            
            if (!resource.exists()) {
                throw new IllegalArgumentException("Prompt文件不存在: " + promptName);
            }

            StringBuilder content = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    content.append(line).append("\n");
                }
            }
            
            return content.toString().trim();
        } catch (IOException e) {
            throw new RuntimeException("读取Prompt文件失败: " + promptName, e);
        }
    }

    public String loadPromptWithVariables(String promptName, Map<String, String> variables) {
        String prompt = loadPrompt(promptName);
        
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            String placeholder = "{" + entry.getKey() + "}";
            prompt = prompt.replace(placeholder, entry.getValue());
        }
        
        return prompt;
    }
}
