package com.aigc3d.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIInput {

    private String text;
    private List<byte[]> images;
    private List<byte[]> videos;
    private List<String> imageUrls;
    private String audioUrl;
    private String negativePrompt;

}
