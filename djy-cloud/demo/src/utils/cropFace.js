/**
 * 体型裁剪配置（与后端 ImageCropService 完全一致）
 *
 * 配合提示词 CANVAS LAYOUT 约束：
 * - 人物头顶在图片顶部 ~3%，脚底在 ~88%
 * - 人物占画面 85% 高度，头部占 12-15%
 *
 * centerYRatio: 头部中心占图高比例
 * cropSizeRatio: 裁剪正方形边长占较短边比例
 */
const CROP_PROFILES = {
  normal: { centerYRatio: 0.10, cropSizeRatio: 0.18 },  // 标准人形
  giant:  { centerYRatio: 0.07, cropSizeRatio: 0.12 },  // 巨人
  child:  { centerYRatio: 0.14, cropSizeRatio: 0.24 },  // 儿童
  beast:  { centerYRatio: 0.15, cropSizeRatio: 0.30 },  // 兽型/非人形
};

/**
 * 从全身角色图中裁剪脸部特写
 *
 * @param {string} imgSrc - 图片 src（import 或 URL 或 base64）
 * @param {string} [bodyType='normal'] - 体型：normal / giant / child / beast
 * @returns {Promise<string>} - 裁剪后的 base64 data URL
 */
export function cropFace(imgSrc, bodyType = 'normal') {
  const profile = CROP_PROFILES[bodyType] || CROP_PROFILES.normal;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const minDim = Math.min(w, h);

        const cropSize = Math.round(minDim * profile.cropSizeRatio);
        let cx = Math.round(w / 2);
        let cy = Math.round(h * profile.centerYRatio);

        let x = cx - Math.round(cropSize / 2);
        let y = cy - Math.round(cropSize / 2);
        // 边界保护
        x = Math.max(0, Math.min(x, w - cropSize));
        y = Math.max(0, Math.min(y, h - cropSize));
        const actualW = Math.min(cropSize, w - x);
        const actualH = Math.min(cropSize, h - y);

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, x, y, actualW, actualH, 0, 0, 512, 512);

        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('图片加载失败: ' + imgSrc));
    img.src = imgSrc;
  });
}

/**
 * 批量裁剪：从 { front, side, back, quarter } 全身图 → 对应脸部特写
 * @param {{ front?: string, side?: string, back?: string, quarter?: string }} bodyImages
 * @param {string} [bodyType='normal'] - 体型
 * @returns {Promise<{ front?: string, side?: string, back?: string, quarter?: string }>}
 */
export async function cropFaceBatch(bodyImages, bodyType = 'normal') {
  const result = {};
  const entries = Object.entries(bodyImages).filter(([, v]) => v);
  const crops = await Promise.all(entries.map(([, src]) => cropFace(src, bodyType)));
  entries.forEach(([key], i) => {
    result[key] = crops[i];
  });
  return result;
}
