package com.aigc3d.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.util.Base64;
import java.util.Map;

/**
 * 图片裁剪服务
 * 从全身角色图中裁剪脸部特写区域
 *
 * 配合提示词 CANVAS LAYOUT 约束：
 * - 人物头顶在图片顶部 ~3%
 * - 脚底在 ~88%
 * - 人物占画面 85% 高度
 * - 头部(发顶到下巴)占画面 12-15%
 *
 * 通过 bodyType 参数适配不同体型角色：
 * - normal: 标准人形（默认）
 * - giant:  巨人体型（头小、身高比例更大）
 * - child:  儿童体型（头大、身高比例更小）
 * - beast:  兽型/非人形（头部位置不固定，裁剪更大区域）
 */
@Service
public class ImageCropService {

    private static final Logger log = LoggerFactory.getLogger(ImageCropService.class);

    /**
     * 体型裁剪配置
     * centerYRatio: 头部中心占图高比例
     * cropSizeRatio: 裁剪正方形边长占图片较短边比例
     */
    private record CropProfile(double centerYRatio, double cropSizeRatio) {}

    private static final Map<String, CropProfile> PROFILES = Map.of(
            "normal", new CropProfile(0.10, 0.18),   // 标准人形：头顶3%+头高12%→头中心≈9-10%
            "giant",  new CropProfile(0.07, 0.12),   // 巨人：头更小更靠上
            "child",  new CropProfile(0.14, 0.24),   // 儿童：头大比例高
            "beast",  new CropProfile(0.15, 0.30)    // 兽型：取更大区域
    );

    private static final CropProfile DEFAULT_PROFILE = PROFILES.get("normal");

    // ===================================================================
    // 公开方法 — 支持 bodyType 参数
    // ===================================================================

    /**
     * 从图片 URL 裁剪脸部特写（使用默认 normal 体型）
     */
    public String cropFaceFromUrl(String imageUrl) {
        return cropFaceFromUrl(imageUrl, "normal");
    }

    /**
     * 从图片 URL 裁剪脸部特写
     * @param bodyType 体型：normal / giant / child / beast
     */
    public String cropFaceFromUrl(String imageUrl, String bodyType) {
        try {
            log.info("下载并裁剪脸部: url={}, bodyType={}", imageUrl, bodyType);
            URL url = URI.create(imageUrl).toURL();
            BufferedImage original;
            try (InputStream is = url.openStream()) {
                original = ImageIO.read(is);
            }
            if (original == null) {
                throw new RuntimeException("无法解析图片: " + imageUrl);
            }
            return cropFaceFromImage(original, resolveProfile(bodyType));
        } catch (Exception e) {
            log.error("脸部裁剪失败: url={}, bodyType={}", imageUrl, bodyType, e);
            throw new RuntimeException("脸部裁剪失败: " + e.getMessage(), e);
        }
    }

    /**
     * 从 byte[] 图片裁剪脸部特写
     */
    public String cropFaceFromBytes(byte[] imageBytes, String bodyType) {
        try {
            BufferedImage original = ImageIO.read(new java.io.ByteArrayInputStream(imageBytes));
            if (original == null) {
                throw new RuntimeException("无法解析图片字节");
            }
            return cropFaceFromImage(original, resolveProfile(bodyType));
        } catch (Exception e) {
            log.error("脸部裁剪失败, bodyType={}", bodyType, e);
            throw new RuntimeException("脸部裁剪失败: " + e.getMessage(), e);
        }
    }

    // ===================================================================
    // 核心裁剪逻辑
    // ===================================================================

    private String cropFaceFromImage(BufferedImage original, CropProfile profile) throws Exception {
        int w = original.getWidth();
        int h = original.getHeight();
        int minDim = Math.min(w, h);

        // 裁剪正方形边长
        int cropSize = (int) (minDim * profile.cropSizeRatio());

        // 裁剪中心坐标
        int centerX = w / 2;
        int centerY = (int) (h * profile.centerYRatio());

        // 裁剪区域左上角，确保不越界
        int x = Math.max(0, centerX - cropSize / 2);
        int y = Math.max(0, centerY - cropSize / 2);
        if (x + cropSize > w) x = w - cropSize;
        if (y + cropSize > h) y = h - cropSize;
        x = Math.max(0, x);
        y = Math.max(0, y);
        int actualW = Math.min(cropSize, w - x);
        int actualH = Math.min(cropSize, h - y);

        log.info("裁剪参数: original={}x{}, profile=({}, {}), crop=({},{} {}x{})",
                w, h, profile.centerYRatio(), profile.cropSizeRatio(), x, y, actualW, actualH);

        // 裁剪
        BufferedImage cropped = original.getSubimage(x, y, actualW, actualH);

        // 缩放到 512×512
        int outputSize = 512;
        BufferedImage scaled = new BufferedImage(outputSize, outputSize, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = scaled.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.drawImage(cropped, 0, 0, outputSize, outputSize, null);
        g2d.dispose();

        // 转 base64
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(scaled, "png", baos);
        String base64 = Base64.getEncoder().encodeToString(baos.toByteArray());

        log.info("脸部裁剪完成: 输出 {}x{}, base64长度={}", outputSize, outputSize, base64.length());
        return "data:image/png;base64," + base64;
    }

    private CropProfile resolveProfile(String bodyType) {
        if (bodyType == null || bodyType.isBlank()) return DEFAULT_PROFILE;
        return PROFILES.getOrDefault(bodyType.toLowerCase().trim(), DEFAULT_PROFILE);
    }
}
