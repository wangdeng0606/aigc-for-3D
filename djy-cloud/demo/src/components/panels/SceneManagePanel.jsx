import { useState, useRef, useCallback } from 'react';
import { X, ImageIcon, Upload, Sparkles, Loader2, Send, Camera, Trash2, ChevronDown, ChevronLeft, ChevronRight, Check, Tag } from 'lucide-react';

const API_BASE = 'http://localhost:8080';

/* 常见镜头角度预设 */
const ANGLE_PRESETS = [
  '正面全景', '俯瞰鸟瞰', '左侧45°', '右侧45°',
  '近景特写', '远景', '低角度仰拍', '中景',
  '背面', '室内正面', '室内侧面', '过肩视角',
];

export default function SceneManagePanel({ scene, onUpdate, onClose }) {
  const d = scene;
  const update = (field, value) => onUpdate({ [field]: value });

  /* 图片列表 — [{id, url, angle, prompt}] */
  const images = d.images || [];

  /* AI 生成状态 */
  const [prompt, setPrompt] = useState('');
  const [genStatus, setGenStatus] = useState('idle');
  const [aiError, setAiError] = useState('');

  /* AI 生成结果轮播 — [{id, url, prompt, suggestedAngle}] */
  const [generated, setGenerated] = useState([]);
  const carouselRef = useRef(null);

  /* 角度编辑 */
  const [editingAngleId, setEditingAngleId] = useState(null);

  /* 猜测镜头角度 */
  const guessAngle = (text) => {
    if (/俯瞰|鸟瞰|俯视|航拍|顶部/.test(text)) return '俯瞰鸟瞰';
    if (/左侧|左边|左方/.test(text)) return '左侧45°';
    if (/右侧|右边|右方/.test(text)) return '右侧45°';
    if (/背面|背后|后方/.test(text)) return '背面';
    if (/近景|特写|局部/.test(text)) return '近景特写';
    if (/远景|远处|全貌/.test(text)) return '远景';
    if (/仰拍|仰视|低角度/.test(text)) return '低角度仰拍';
    if (/室内|屋内|房间/.test(text)) return '室内正面';
    if (/过肩/.test(text)) return '过肩视角';
    return '正面全景';
  };

  /* AI 生成 — 结果追加到轮播 */
  const handleGenerate = async () => {
    const text = prompt.trim();
    if (!text) return;
    setGenStatus('generating');
    setAiError('');

    // Mock AI — 实际项目中替换为 POST /api/image/generate
    setTimeout(() => {
      const angle = guessAngle(text);
      const newItem = {
        id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        url: `data:image/svg+xml,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#e8f5e9"/><text x="320" y="160" text-anchor="middle" font-size="16" fill="#2e7d32">${text.slice(0, 24)}</text><text x="320" y="195" text-anchor="middle" font-size="12" fill="#66bb6a">AI 生成 · ${angle}</text></svg>`
        )}`,
        prompt: text,
        suggestedAngle: angle,
      };
      setGenerated((prev) => [...prev, newItem]);
      setGenStatus('idle');
      // 滚到最右
      requestAnimationFrame(() => {
        if (carouselRef.current) carouselRef.current.scrollLeft = carouselRef.current.scrollWidth;
      });
    }, 1500);
  };

  /* 双击轮播图片 → 采纳到图库 */
  const adoptImage = useCallback((item) => {
    const newImg = {
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      url: item.url,
      angle: item.suggestedAngle,
      prompt: item.prompt,
    };
    onUpdate({ images: [...(d.images || []), newImg] });
    setGenerated((prev) => prev.filter((g) => g.id !== item.id));
  }, [d.images, onUpdate]);

  /* 删除已采纳图片 */
  const removeImage = useCallback((e, imgId) => {
    e.stopPropagation();
    onUpdate({ images: (d.images || []).filter((i) => i.id !== imgId) });
    if (editingAngleId === imgId) setEditingAngleId(null);
  }, [d.images, onUpdate, editingAngleId]);

  /* 修改图片角度 */
  const updateImageAngle = useCallback((imgId, newAngle) => {
    onUpdate({ images: (d.images || []).map((i) => (i.id === imgId ? { ...i, angle: newAngle } : i)) });
    setEditingAngleId(null);
  }, [d.images, onUpdate]);

  /* 手动上传 */
  const handleManualUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const currentImages = d.images || [];
      Array.from(e.target.files).forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const newImg = {
            id: `img-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
            url: ev.target.result,
            angle: '未标注',
            prompt: file.name,
          };
          onUpdate({ images: [...currentImages, newImg] });
        };
        reader.readAsDataURL(file);
      });
    };
    input.click();
  };

  /* 轮播左右滚动 */
  const scrollCarousel = (dir) => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[9px] bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shadow-inner">
            <ImageIcon size={13} className="text-emerald-600" strokeWidth={1.8} />
          </div>
          <span className="font-display text-[14px] font-semibold text-slate-700">场景配置</span>
          <span className="text-[10px] text-slate-400 font-medium">{images.length} 张参考图</span>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-50 cursor-pointer transition-all duration-200">
          <X size={14} />
        </button>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* 基本信息 */}
        <section>
          <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-2 block">场景名称</label>
          <input className="input" value={d.name || ''} onChange={(e) => update('name', e.target.value)} placeholder="输入场景名称" />
        </section>

        <section>
          <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-2 block">场景描述</label>
          <textarea className="input resize-none" rows={2} value={d.description || ''} onChange={(e) => update('description', e.target.value)} placeholder="简要描述场景氛围和环境..." />
        </section>

        {/* ===== 场景参考图库 — 16:9 卡片 ===== */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Camera size={11} className="text-emerald-500" />
              <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">场景参考图库</label>
            </div>
            <button
              onClick={handleManualUpload}
              className="text-[10px] flex items-center gap-1 px-2 py-1 rounded-md text-emerald-600 hover:bg-emerald-50 cursor-pointer transition-colors"
            >
              <Upload size={10} /> 上传
            </button>
          </div>

          {images.length > 0 ? (
            <div className="grid grid-cols-3 gap-1.5">
              {images.map((img) => (
                <div key={img.id} className="group relative rounded-lg border border-slate-200/60 overflow-hidden">
                  <div className="aspect-video bg-slate-50">
                    <img src={img.url} className="w-full h-full object-cover" />
                  </div>
                  {/* 删除 */}
                  <button
                    onClick={(e) => removeImage(e, img.id)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded bg-black/60 text-white flex items-center justify-center
                               opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-500"
                  >
                    <Trash2 size={8} />
                  </button>
                  {/* 角度标签 — 左下角小badge，点击可换 */}
                  <div className="absolute bottom-0.5 left-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingAngleId(editingAngleId === img.id ? null : img.id); }}
                      className="text-[7px] font-medium text-white bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded cursor-pointer hover:bg-black/70 transition-colors"
                    >
                      {img.angle}
                    </button>
                    {editingAngleId === img.id && (
                      <div className="absolute bottom-full left-0 mb-1 z-30 bg-white border border-slate-200 rounded-lg shadow-xl shadow-slate-900/10 p-1 w-28 max-h-40 overflow-y-auto">
                        {ANGLE_PRESETS.map((a) => (
                          <button
                            key={a}
                            onClick={(e) => { e.stopPropagation(); updateImageAngle(img.id, a); }}
                            className={`w-full text-left text-[8px] px-2 py-1 rounded transition-colors cursor-pointer ${
                              img.angle === a ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {img.angle === a && <Check size={6} className="inline mr-0.5" />}
                            {a}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200/80">
              <ImageIcon size={22} className="text-slate-200 mx-auto mb-2" />
              <div className="text-[10px] text-slate-400">暂无参考图</div>
              <div className="text-[9px] text-slate-300 mt-0.5">通过下方 AI 生成，或手动上传</div>
            </div>
          )}
        </section>

        {/* ===== AI 场景图生成 — 输入 + 横向轮播 ===== */}
        <section className="border-t border-slate-100/80 pt-5">
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles size={11} className="text-emerald-500" />
            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">AI 场景图生成</label>
          </div>

          {/* 输入框 */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <textarea
                className="input resize-none pr-10 text-[12px]"
                rows={2}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                placeholder="描述场景镜头，如：月光下的竹林小道正面视角、俯瞰整片竹林..."
                disabled={genStatus === 'generating'}
              />
              <button
                onClick={handleGenerate}
                disabled={genStatus === 'generating' || !prompt.trim()}
                className={`absolute right-2 bottom-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  genStatus === 'generating' || !prompt.trim()
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-emerald-500 hover:bg-emerald-50 cursor-pointer'
                }`}
              >
                {genStatus === 'generating' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </div>

          {genStatus === 'generating' && (
            <div className="flex items-center gap-2 mb-3 text-[10px] text-emerald-500">
              <Loader2 size={12} className="animate-spin" />
              <span>AI 正在生成场景图…</span>
            </div>
          )}

          {/* 生成结果轮播 */}
          {generated.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-500 font-medium">
                  生成结果 · {generated.length} 张
                  <span className="text-slate-400 font-normal ml-1">双击采纳到图库</span>
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => scrollCarousel(-1)} className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors">
                    <ChevronLeft size={10} className="text-slate-500" />
                  </button>
                  <button onClick={() => scrollCarousel(1)} className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors">
                    <ChevronRight size={10} className="text-slate-500" />
                  </button>
                  <button
                    onClick={() => setGenerated([])}
                    className="text-[9px] text-slate-400 hover:text-red-400 ml-1 cursor-pointer transition-colors"
                  >清空</button>
                </div>
              </div>

              <div
                ref={carouselRef}
                className="flex gap-2.5 overflow-x-auto pb-2 scroll-smooth"
                style={{ scrollbarWidth: 'thin' }}
              >
                {generated.map((item) => (
                  <div
                    key={item.id}
                    onDoubleClick={() => adoptImage(item)}
                    className="shrink-0 w-[280px] rounded-xl border border-slate-200/60 bg-white overflow-hidden
                               cursor-pointer hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-100/30
                               transition-all duration-200 active:scale-[0.98] select-none"
                    title="双击采纳到图库"
                  >
                    <div className="aspect-video bg-slate-50 relative">
                      <img src={item.url} className="w-full h-full object-cover" />
                      <div className="absolute bottom-1.5 left-1.5 text-[9px] font-medium text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md">
                        {item.suggestedAngle}
                      </div>
                    </div>
                    <div className="px-2.5 py-2">
                      <div className="text-[10px] text-slate-500 truncate">{item.prompt}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {generated.length === 0 && genStatus === 'idle' && (
            <div className="bg-gradient-to-r from-emerald-50/40 to-teal-50/20 border border-emerald-100/60 rounded-xl p-2.5">
              <div className="text-[9px] text-emerald-600/80 leading-relaxed">
                输入描述后 AI 生成场景图，可反复生成不同镜头角度。满意的图片<b>双击即可</b>采纳到上方图库，AI 会自动标注镜头角度。
              </div>
            </div>
          )}

          {aiError && (
            <div className="text-[10px] text-red-500 bg-red-50/80 border border-red-200/60 rounded-xl px-3 py-2.5 mt-2">{aiError}</div>
          )}
        </section>
      </div>
    </div>
  );
}
