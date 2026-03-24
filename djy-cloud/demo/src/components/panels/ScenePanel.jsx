import { X, ImageIcon, Upload, Sparkles, Wand2, Users, ChevronDown, User, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function ScenePanel({ node, characters, onUpdate, onClose }) {
  const d = node.data;
  const update = (field, value) => onUpdate({ [field]: value });
  const [expandedCharId, setExpandedCharId] = useState(null);
  const [genImgStatus, setGenImgStatus] = useState('idle'); // idle | generating | error
  const [editImgStatus, setEditImgStatus] = useState('idle'); // idle | generating | error
  const [imgError, setImgError] = useState('');

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => update('image', ev.target.result);
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const configs = d.characterConfigs || {};

  const toggleCharacter = (charId) => {
    const ids = d.characterIds || [];
    if (ids.includes(charId)) {
      const next = { ...configs };
      delete next[charId];
      onUpdate({ characterIds: ids.filter((id) => id !== charId), characterConfigs: next });
    } else {
      onUpdate({ characterIds: [...ids, charId], characterConfigs: { ...configs, [charId]: { phaseId: null, refSetId: null } } });
    }
  };

  const setCharPhase = (charId, phaseId) => {
    const prev = configs[charId] || {};
    onUpdate({ characterConfigs: { ...configs, [charId]: { ...prev, phaseId: phaseId || null, refSetId: null } } });
  };

  const setCharRefSet = (charId, refSetId) => {
    const prev = configs[charId] || {};
    onUpdate({ characterConfigs: { ...configs, [charId]: { ...prev, refSetId: refSetId || null } } });
  };

  const resolvePhase = (char) => {
    const cfg = configs[char.id];
    const phaseId = cfg?.phaseId;
    return phaseId
      ? char.phases?.find((p) => p.id === phaseId)
      : char.phases?.[char.phases.length - 1];
  };

  const resolveRefSet = (char) => {
    const phase = resolvePhase(char);
    if (!phase) return null;
    const cfg = configs[char.id];
    const rsId = cfg?.refSetId;
    return rsId
      ? phase.refSets?.find((r) => r.id === rsId)
      : phase.refSets?.find((r) => r.id === phase.activeRefSet) || phase.refSets?.[0];
  };

  const getCharSummary = (char) => {
    const cfg = configs[char.id] || {};
    const phase = resolvePhase(char);
    const rs = resolveRefSet(char);
    const pLabel = !cfg.phaseId ? `${phase?.label || '?'}（最新）` : (phase?.label || '?');
    const rLabel = !cfg.refSetId ? `${rs?.label || '?'}（默认）` : (rs?.label || '?');
    return `${pLabel} · ${rLabel}`;
  };

  const getCharFrontImg = (char) => {
    const rs = resolveRefSet(char);
    return rs?.images?.front;
  };

  /* ===== AI 生图 / 编辑 ===== */
  const handleGenerateImage = async () => {
    if (!d.keywords?.trim()) return;
    setGenImgStatus('generating');
    setImgError('');
    try {
      const res = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: d.keywords }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || '生成失败');
      const url = json.images?.[0];
      if (url) {
        update('image', url);
        setGenImgStatus('idle');
      } else {
        throw new Error('未返回图片');
      }
    } catch (e) {
      setImgError('生成场景图失败：' + e.message);
      setGenImgStatus('error');
    }
  };

  const handleEditImage = async () => {
    if (!d.image || !d.editKeywords?.trim()) return;
    setEditImgStatus('generating');
    setImgError('');
    try {
      // 如果 image 是远程 URL，需要先转 base64；如果已经是 data URI / 本地静态资源也处理
      let imageData = d.image;
      if (imageData.startsWith('http')) {
        // 远程 URL → fetch → base64
        const imgRes = await fetch(imageData);
        const blob = await imgRes.blob();
        imageData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } else if (!imageData.startsWith('data:')) {
        // 本地静态资源路径 → fetch → base64
        const imgRes = await fetch(imageData);
        const blob = await imgRes.blob();
        imageData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }

      const res = await fetch('/api/image/edit-base64', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData, prompt: d.editKeywords }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || '编辑失败');
      const url = json.images?.[0];
      if (url) {
        update('image', url);
        setEditImgStatus('idle');
      } else {
        throw new Error('未返回图片');
      }
    } catch (e) {
      setImgError('AI 调整图片失败：' + e.message);
      setEditImgStatus('error');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[9px] bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shadow-inner">
            <ImageIcon size={13} className="text-emerald-600" strokeWidth={1.8} />
          </div>
          <span className="font-display text-[14px] font-semibold text-slate-700">场景配置</span>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-50 cursor-pointer transition-all duration-200">
          <X size={14} />
        </button>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <section>
          <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-2.5 block">场景标题</label>
          <input className="input" value={d.title || ''} onChange={(e) => update('title', e.target.value)} placeholder="输入场景标题" />
        </section>

        {/* 场景图片 */}
        <section>
          <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-2.5 block">场景图片</label>
          <div
            onClick={handleImageUpload}
            className="w-full h-44 rounded-xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-slate-100/50
                       flex items-center justify-center cursor-pointer hover:border-emerald-300 hover:shadow-sm transition-all duration-200 overflow-hidden"
          >
            {d.image ? (
              <img src={d.image} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-white/80 shadow-sm mx-auto mb-2 flex items-center justify-center">
                  <Upload size={16} className="text-slate-300" />
                </div>
                <div className="text-[10px] text-slate-400 font-medium">点击上传场景图片</div>
              </div>
            )}
          </div>
        </section>

        {/* 角色选择 + 阶段配置 */}
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <Users size={11} className="text-slate-400" />
            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">参与角色</label>
          </div>
          <div className="space-y-1.5">
            {characters.map((char) => {
              const sel = (d.characterIds || []).includes(char.id);
              const isExpanded = expandedCharId === char.id && sel;
              const frontImg = sel ? getCharFrontImg(char) : null;

              return (
                <div key={char.id}>
                  <div
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer
                      ${sel
                        ? 'bg-gradient-to-r from-amber-50/60 to-orange-50/30 text-amber-700 border border-amber-200/60'
                        : 'bg-slate-50/50 text-slate-500 border border-slate-200/60 hover:border-slate-300'
                      }`}
                  >
                    {/* 选中标记 */}
                    <div
                      onClick={() => toggleCharacter(char.id)}
                      className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 shrink-0 cursor-pointer
                        ${sel ? 'border-amber-500 bg-amber-500' : 'border-slate-300'}`}
                    />

                    {/* 头像缩略图 */}
                    <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200/60">
                      {frontImg ? (
                        <img src={frontImg} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User size={10} className="text-slate-300" />
                        </div>
                      )}
                    </div>

                    {/* 名称 + 阶段 */}
                    <div className="flex-1 min-w-0" onClick={() => sel && setExpandedCharId(isExpanded ? null : char.id)}>
                      <div className="font-medium text-[12px] truncate">{char.name}</div>
                      {sel && (
                        <div className="text-[9px] text-amber-500/70 truncate">{getCharSummary(char)}</div>
                      )}
                    </div>

                    {/* 展开配置按钮 */}
                    {sel && (
                      <button
                        onClick={() => setExpandedCharId(isExpanded ? null : char.id)}
                        className="p-0.5 rounded-md text-amber-400 hover:text-amber-600 cursor-pointer transition-all duration-200 shrink-0"
                      >
                        <ChevronDown size={12} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>

                  {/* 展开：阶段 + 形象选择 */}
                  {isExpanded && (() => {
                    const cfg = configs[char.id] || {};
                    const selPhase = resolvePhase(char);
                    return (
                      <div className="ml-6 mt-1.5 mb-1.5 border-l-2 border-amber-200/50 pl-3 space-y-2">
                        {/* 阶段选择 */}
                        <div>
                          <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mb-1">阶段</div>
                          <div className="space-y-0.5">
                            {char.phases?.slice().reverse().map((phase, i) => {
                              const isLatest = i === 0;
                              const isPhaseSelected = cfg.phaseId ? cfg.phaseId === phase.id : isLatest;
                              return (
                                <button
                                  key={phase.id}
                                  onClick={() => setCharPhase(char.id, isLatest ? null : phase.id)}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11px] transition-all
                                    ${isPhaseSelected
                                      ? 'bg-amber-100 text-amber-700 font-medium'
                                      : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                  {phase.label}
                                  {isLatest && <span className="text-[9px] ml-1 opacity-60">（最新）</span>}
                                  {phase.role && <span className="text-[9px] ml-1 opacity-50">· {phase.role}</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 形象选择 */}
                        {selPhase && (selPhase.refSets?.length || 0) > 0 && (
                          <div>
                            <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mb-1">形象</div>
                            <div className="space-y-0.5">
                              {selPhase.refSets.map((rs) => {
                                const isDefault = rs.id === selPhase.activeRefSet || (!selPhase.activeRefSet && rs === selPhase.refSets[0]);
                                const isRsSelected = cfg.refSetId ? cfg.refSetId === rs.id : isDefault;
                                const rsImg = rs.images?.front;
                                return (
                                  <button
                                    key={rs.id}
                                    onClick={() => setCharRefSet(char.id, isDefault ? null : rs.id)}
                                    className={`w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-md text-[11px] transition-all
                                      ${isRsSelected
                                        ? 'bg-amber-100 text-amber-700 font-medium'
                                        : 'text-slate-500 hover:bg-slate-50'
                                      }`}
                                  >
                                    <div className="w-5 h-5 rounded-md overflow-hidden shrink-0 bg-slate-100 border border-slate-200/60">
                                      {rsImg ? (
                                        <img src={rsImg} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center"><User size={8} className="text-slate-300" /></div>
                                      )}
                                    </div>
                                    <span className="truncate">{rs.label}</span>
                                    {isDefault && <span className="text-[9px] ml-auto opacity-60 shrink-0">默认</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
            {characters.length === 0 && (
              <div className="text-[10px] text-slate-400 text-center py-4 bg-slate-50/60 rounded-xl border border-slate-100">请先在"角色管理"中添加角色</div>
            )}
          </div>
        </section>

        {/* 生成关键词 */}
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={11} className="text-emerald-500" />
            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">生成关键词</label>
          </div>
          <textarea className="input resize-none mb-2" rows={3} value={d.keywords || ''} onChange={(e) => update('keywords', e.target.value)} placeholder="描述场景画面，如：月光下的竹林，两人持剑对峙..." />
          <button
            onClick={handleGenerateImage}
            disabled={genImgStatus === 'generating' || !d.keywords?.trim()}
            className={`w-full btn ${
              genImgStatus === 'generating' || !d.keywords?.trim()
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'btn-primary'
            }`}
          >
            {genImgStatus === 'generating' ? (
              <><Loader2 size={12} className="animate-spin" /> 生成中…</>
            ) : (
              <><Sparkles size={12} /> AI 生成场景图</>
            )}
          </button>
          {genImgStatus === 'error' && (
            <div className="mt-2 text-[10px] text-red-500 bg-red-50/80 border border-red-200/60 rounded-xl px-3 py-2.5">{imgError}</div>
          )}
        </section>

        {/* AI 微调 */}
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <Wand2 size={11} className="text-indigo-500" />
            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">AI 微调</label>
          </div>
          <textarea className="input resize-none mb-2" rows={2} value={d.editKeywords || ''} onChange={(e) => update('editKeywords', e.target.value)} placeholder="输入调整词语，如：将背景改为夜晚、增加雾气效果..." />
          <button
            onClick={handleEditImage}
            disabled={editImgStatus === 'generating' || !d.image || !d.editKeywords?.trim()}
            className={`w-full btn btn-ghost ${
              editImgStatus === 'generating' || !d.image || !d.editKeywords?.trim()
                ? 'text-slate-400 border-slate-200 cursor-not-allowed'
                : 'text-indigo-600 border-indigo-200/60 hover:bg-indigo-50'
            }`}
          >
            {editImgStatus === 'generating' ? (
              <><Loader2 size={12} className="animate-spin" /> 调整中…</>
            ) : (
              <><Wand2 size={12} /> AI 调整图片</>
            )}
          </button>
          {editImgStatus === 'error' && (
            <div className="mt-2 text-[10px] text-red-500 bg-red-50/80 border border-red-200/60 rounded-xl px-3 py-2.5">{imgError}</div>
          )}
        </section>

      </div>
    </div>
  );
}
