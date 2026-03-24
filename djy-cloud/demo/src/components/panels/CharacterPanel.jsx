import { useState } from 'react';
import { X, Upload, Sparkles, Plus, User, Layers, ChevronRight, Check, Trash2, Mic, Loader2 } from 'lucide-react';
import { cropFace } from '../../utils/cropFace';

const bodyAngleLabels   = { front: '正面', side: '侧面', back: '背面', quarter: '¾ 视角' };
const faceAngleLabels   = { frontFace: '正面特写', sideFace: '侧面特写', backFace: '背面特写', quarterFace: '¾ 特写' };
const angleLabels = { ...bodyAngleLabels, ...faceAngleLabels };

const API_BASE = 'http://localhost:8080';

const bodyTypeOptions = [
  { value: 'normal', label: '标准人形' },
  { value: 'giant',  label: '巨人体型' },
  { value: 'child',  label: '儿童体型' },
  { value: 'beast',  label: '兽型/非人形' },
];

export default function CharacterPanel({ character, onUpdate, onClose }) {
  const d = character;
  const phases = d.phases || [];
  const [expandedPhaseId, setExpandedPhaseId] = useState(d.activePhase || null);
  const [addingPhase, setAddingPhase] = useState(false);
  const [newPhaseLabel, setNewPhaseLabel] = useState('');
  const [tagInputs, setTagInputs] = useState({});
  const [expandedRefSetKey, setExpandedRefSetKey] = useState(null); // "phaseId:rsId"
  const [aiGenerating, setAiGenerating] = useState(null); // "phaseId:rsId" or null

  const update = (field, value) => onUpdate({ [field]: value });

  /* ===== 阶段操作 ===== */
  const updatePhase = (phaseId, data) => {
    update('phases', phases.map((p) => (p.id === phaseId ? { ...p, ...data } : p)));
  };

  const addPhase = () => {
    const label = newPhaseLabel.trim() || `阶段 ${phases.length + 1}`;
    const id = `p-${Date.now()}`;
    const newP = { id, label, role: '', description: '', audio: null, tags: [], activeRefSet: 'rs1', refSets: [{ id: 'rs1', label: '默认形象', images: { front: null, side: null, back: null, quarter: null, frontFace: null, sideFace: null, backFace: null, quarterFace: null } }] };
    update('phases', [...phases, newP]);
    setExpandedPhaseId(id);
    setAddingPhase(false);
    setNewPhaseLabel('');
  };

  const setActivePhase = (phaseId) => update('activePhase', phaseId);

  const removePhase = (phaseId) => {
    const next = phases.filter((p) => p.id !== phaseId);
    onUpdate({
      phases: next,
      activePhase: d.activePhase === phaseId ? (next[0]?.id || null) : d.activePhase,
    });
    if (expandedPhaseId === phaseId) setExpandedPhaseId(next[0]?.id || null);
  };

  /* 阶段内标签 */
  const addTagToPhase = (phaseId) => {
    const t = (tagInputs[phaseId] || '').trim();
    const phase = phases.find((p) => p.id === phaseId);
    if (t && phase && !(phase.tags || []).includes(t)) {
      updatePhase(phaseId, { tags: [...(phase.tags || []), t] });
    }
    setTagInputs((prev) => ({ ...prev, [phaseId]: '' }));
  };

  const removeTagFromPhase = (phaseId, tag) => {
    const phase = phases.find((p) => p.id === phaseId);
    if (phase) updatePhase(phaseId, { tags: (phase.tags || []).filter((t) => t !== tag) });
  };

  /* ===== 参考图集操作 ===== */
  const addRefSet = (phaseId) => {
    const phase = phases.find((p) => p.id === phaseId);
    if (!phase) return;
    const id = `rs-${Date.now()}`;
    const newSet = { id, label: `形象 ${(phase.refSets || []).length + 1}`, images: { front: null, side: null, back: null, quarter: null, frontFace: null, sideFace: null, backFace: null, quarterFace: null } };
    updatePhase(phaseId, { refSets: [...(phase.refSets || []), newSet] });
    setExpandedRefSetKey(`${phaseId}:${id}`);
  };

  const setActiveRefSet = (phaseId, rsId) => updatePhase(phaseId, { activeRefSet: rsId });

  const removeRefSet = (phaseId, rsId) => {
    const phase = phases.find((p) => p.id === phaseId);
    if (!phase) return;
    const next = (phase.refSets || []).filter((r) => r.id !== rsId);
    updatePhase(phaseId, {
      refSets: next,
      activeRefSet: phase.activeRefSet === rsId ? (next[0]?.id || null) : phase.activeRefSet,
    });
  };

  const updateRefSetLabel = (phaseId, rsId, label) => {
    const phase = phases.find((p) => p.id === phaseId);
    if (!phase) return;
    updatePhase(phaseId, { refSets: (phase.refSets || []).map((r) => r.id === rsId ? { ...r, label } : r) });
  };

  const handleAudioUpload = (phaseId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        updatePhase(phaseId, { audio: ev.target.result, audioName: file.name });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const removeAudio = (phaseId) => {
    updatePhase(phaseId, { audio: null, audioName: null });
  };

  const handleAngleUpload = (phaseId, rsId, angleKey) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const phase = phases.find((p) => p.id === phaseId);
        if (!phase) return;
        const newImages = { ...phase.refSets.find(r => r.id === rsId)?.images, [angleKey]: ev.target.result };
        // 如果上传的是全身图，自动裁剪对应脸部特写
        const faceKey = angleKey + 'Face';
        if (bodyAngleLabels[angleKey] && !angleKey.includes('Face')) {
          try {
            newImages[faceKey] = await cropFace(ev.target.result, d.bodyType || 'normal');
          } catch (err) {
            console.warn('自动裁剪脸部失败:', err);
          }
        }
        updatePhase(phaseId, {
          refSets: (phase.refSets || []).map((r) =>
            r.id === rsId ? { ...r, images: newImages } : r
          ),
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  /* ===== AI 生成角色参考图 ===== */
  const handleAiGenerate = async (phaseId, rsId) => {
    const key = `${phaseId}:${rsId}`;
    setAiGenerating(key);
    try {
      // 收集角色信息作为描述标签
      const phase = phases.find((p) => p.id === phaseId);
      const tags = phase?.tags || [];
      const desc = {
        gender: [d.gender || '未设定'],
        style: tags.length > 0 ? tags : ['中国古风武侠'],
        hair: ['黑发'],
        outfit: [phase?.role || '侠客装束'],
        body: ['标准体型'],
        vibe: tags.length > 0 ? [tags[0]] : ['坚毅'],
      };

      // 1. 生成正面图
      const frontRes = await fetch(`${API_BASE}/api/character-ref/front-from-description`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(desc),
      }).then(r => r.json());
      if (!frontRes.success) throw new Error('正面图生成失败');

      // 2. 生成多角度
      const mvRes = await fetch(`${API_BASE}/api/character-ref/multi-view`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: frontRes.imageUrl }),
      }).then(r => r.json());
      if (!mvRes.success) throw new Error('多角度生成失败');

      // 3. 裁剪脸部特写
      const fcRes = await fetch(`${API_BASE}/api/character-ref/face-closeups`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrls: {
            front: frontRes.imageUrl,
            side: mvRes.results.left,
            back: mvRes.results.back,
            quarter: mvRes.results.right,
          },
          bodyType: d.bodyType || 'normal',
        }),
      }).then(r => r.json());

      // 4. 更新参考图集
      const newImages = {
        front: frontRes.imageUrl,
        side: mvRes.results.left,
        back: mvRes.results.back,
        quarter: mvRes.results.right,
        frontFace: fcRes.success ? fcRes.faceCloseups?.front : null,
        sideFace: fcRes.success ? fcRes.faceCloseups?.side : null,
        backFace: fcRes.success ? fcRes.faceCloseups?.back : null,
        quarterFace: fcRes.success ? fcRes.faceCloseups?.quarter : null,
      };
      updatePhase(phaseId, {
        refSets: (phase.refSets || []).map((r) =>
          r.id === rsId ? { ...r, images: newImages } : r
        ),
      });
    } catch (err) {
      console.error('AI 生成失败:', err);
      alert('AI 生成失败: ' + err.message);
    } finally {
      setAiGenerating(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[9px] bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shadow-inner">
            <User size={13} className="text-amber-600" strokeWidth={1.8} />
          </div>
          <span className="font-display text-[14px] font-semibold text-slate-700">角色配置</span>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-50 cursor-pointer transition-all duration-200">
          <X size={14} />
        </button>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* ===== 固定信息 ===== */}
        <section>
          <h3 className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-3">固定信息</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-500 font-medium mb-1.5 block">角色名称</label>
              <input className="input" value={d.name || ''} onChange={(e) => update('name', e.target.value)} placeholder="输入角色名称" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-medium mb-1.5 block">性别</label>
              <select className="input" value={d.gender || ''} onChange={(e) => update('gender', e.target.value)}>
                <option value="男">男</option>
                <option value="女">女</option>
                <option value="未设定">未设定</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-medium mb-1.5 block">体型</label>
              <select className="input" value={d.bodyType || 'normal'} onChange={(e) => update('bodyType', e.target.value)}>
                {bodyTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="text-[9px] text-slate-400 mt-1">影响 AI 生成画面比例及脸部裁剪位置</div>
            </div>
          </div>
        </section>

        {/* ===== 成长阶段时间线 ===== */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Layers size={12} className="text-amber-500" />
              <h3 className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">成长阶段</h3>
              <span className="text-[9px] text-slate-300 font-medium ml-0.5">{phases.length}</span>
            </div>
            <button
              onClick={() => setAddingPhase(true)}
              className="flex items-center gap-1 text-[10px] font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-2 py-1 rounded-md cursor-pointer transition-all duration-200"
            >
              <Plus size={10} /> 新阶段
            </button>
          </div>

          {/* 新增阶段表单 */}
          {addingPhase && (
            <div className="mb-3 bg-gradient-to-b from-amber-50/60 to-orange-50/30 border border-amber-200/60 rounded-xl p-3 space-y-2">
              <input
                className="input !text-xs"
                placeholder="阶段标签（如：受伤期、觉醒后、黑化、回归…）"
                value={newPhaseLabel}
                onChange={(e) => setNewPhaseLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPhase()}
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={addPhase} className="btn btn-primary text-xs !py-1.5">创建阶段</button>
                <button onClick={() => { setAddingPhase(false); setNewPhaseLabel(''); }} className="btn btn-ghost text-xs !py-1.5">取消</button>
              </div>
            </div>
          )}

          {/* 阶段时间线 */}
          <div className="relative">
            {phases.length > 1 && (
              <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-amber-100 rounded" />
            )}

            <div className="space-y-0">
              {phases.map((phase, idx) => {
                const isActive = phase.id === d.activePhase;
                const isExpanded = phase.id === expandedPhaseId;
                const refSetCount = (phase.refSets || []).length;

                return (
                  <div key={phase.id} className="relative">
                    {/* 阶段头 */}
                    <div
                      className={`flex items-center gap-3 py-2.5 cursor-pointer group transition-colors rounded-lg px-1
                        ${isExpanded ? '' : 'hover:bg-gray-50'}`}
                      onClick={() => setExpandedPhaseId(isExpanded ? null : phase.id)}
                    >
                      <div className="relative z-10 shrink-0">
                        <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-200
                          ${isActive
                            ? 'bg-gradient-to-br from-amber-100 to-orange-100 border-amber-400 text-amber-700 shadow-sm shadow-amber-200/40'
                            : 'bg-white border-slate-200 text-slate-400 group-hover:border-amber-300'
                          }`}>
                          {idx + 1}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-medium truncate ${isActive ? 'text-amber-700' : 'text-slate-700'}`}>
                            {phase.label}
                          </span>
                          {isActive && (
                            <span className="text-[9px] px-1.5 py-px rounded-full bg-amber-100 text-amber-600 font-medium shrink-0">当前</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {phase.role || '未设定身份'} · {refSetCount} 套参考图
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!isActive && (
                          <button onClick={(e) => { e.stopPropagation(); setActivePhase(phase.id); }}
                            className="p-1 rounded-md text-slate-300 hover:text-amber-500 hover:bg-amber-50 cursor-pointer transition-all duration-200" title="设为当前阶段">
                            <Check size={12} />
                          </button>
                        )}
                        {phases.length > 1 && (
                          <button onClick={(e) => { e.stopPropagation(); removePhase(phase.id); }}
                            className="p-1 rounded-md text-slate-300 hover:text-red-400 hover:bg-red-50 cursor-pointer transition-all duration-200" title="删除阶段">
                            <Trash2 size={11} />
                          </button>
                        )}
                        <ChevronRight size={12} className={`text-slate-300 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>

                    {/* 展开：阶段详情 */}
                    {isExpanded && (
                      <div className="ml-[39px] mt-1 mb-4 space-y-3">
                        {/* 身份 */}
                        <div>
                          <label className="text-[11px] text-slate-500 font-medium mb-1.5 block">身份 / 定位</label>
                          <input className="input !text-xs" value={phase.role || ''} onChange={(e) => updatePhase(phase.id, { role: e.target.value })} placeholder="如：青年侠客、魔教教主、隐世高手…" />
                        </div>

                        {/* 描述 */}
                        <div>
                          <label className="text-[11px] text-slate-500 font-medium mb-1.5 block">阶段描述</label>
                          <textarea className="input !text-xs resize-none" rows={3} value={phase.description || ''} onChange={(e) => updatePhase(phase.id, { description: e.target.value })} placeholder="当前阶段的性格、能力、状态变化…" />
                        </div>

                        {/* 角色音频 */}
                        <div>
                          <label className="text-[11px] text-slate-500 font-medium mb-1.5 block">角色音频</label>
                          {phase.audio ? (
                            <div className="flex items-center gap-2 p-2.5 rounded-xl border border-amber-200/60 bg-gradient-to-r from-amber-50/40 to-orange-50/20">
                              <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shadow-inner shrink-0">
                                <Mic size={13} className="text-amber-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-medium text-slate-700 truncate">{phase.audioName || '音频文件'}</div>
                                <audio controls src={phase.audio} className="w-full h-7 mt-1" style={{ fontSize: '10px' }} />
                              </div>
                              <button
                                onClick={() => removeAudio(phase.id)}
                                className="p-1 rounded-md text-slate-300 hover:text-red-400 hover:bg-red-50 cursor-pointer transition-all duration-200 shrink-0"
                                title="移除音频"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAudioUpload(phase.id)}
                              className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl border border-dashed border-slate-200/60
                                         hover:border-amber-300 hover:bg-amber-50/30 cursor-pointer transition-all duration-200 group/audio"
                            >
                              <div className="w-8 h-8 rounded-[10px] bg-slate-100 group-hover/audio:bg-gradient-to-br group-hover/audio:from-amber-100 group-hover/audio:to-orange-100 flex items-center justify-center transition-all duration-200">
                                <Mic size={13} className="text-slate-400 group-hover/audio:text-amber-600 transition-colors" />
                              </div>
                              <div className="text-left">
                                <div className="text-[11px] font-medium text-slate-500 group-hover/audio:text-amber-700">上传角色音频</div>
                                <div className="text-[9px] text-slate-400">支持 mp3、wav、m4a 格式</div>
                              </div>
                            </button>
                          )}
                        </div>

                        {/* 标签 */}
                        <div>
                          <label className="text-[11px] text-slate-500 font-medium mb-1.5 block">特征标签</label>
                          <div className="flex flex-wrap gap-1.5 mb-1.5">
                            {(phase.tags || []).map((tag) => (
                              <span key={tag} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200/60">
                                {tag}
                                <button onClick={() => removeTagFromPhase(phase.id, tag)} className="text-amber-400 hover:text-red-400"><X size={8} /></button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-1.5">
                            <input
                              className="input !text-xs flex-1"
                              value={tagInputs[phase.id] || ''}
                              onChange={(e) => setTagInputs((p) => ({ ...p, [phase.id]: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && addTagToPhase(phase.id)}
                              placeholder="回车添加"
                            />
                            <button onClick={() => addTagToPhase(phase.id)} className="btn btn-ghost !px-2 !py-1"><Plus size={11} /></button>
                          </div>
                        </div>

                        {/* 参考图集 */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[11px] text-slate-500 font-medium">多角度参考图</label>
                            <button onClick={() => addRefSet(phase.id)} className="flex items-center gap-0.5 text-[10px] text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-1.5 py-0.5 rounded-md font-medium cursor-pointer transition-all duration-200">
                              <Plus size={9} /> 新形象
                            </button>
                          </div>

                          {(phase.refSets || []).map((rs) => {
                            const rsKey = `${phase.id}:${rs.id}`;
                            const isRsActive = rs.id === phase.activeRefSet;
                            const isRsOpen = expandedRefSetKey === rsKey;
                            const rsImgCount = Object.values(rs.images || {}).filter(Boolean).length;

                            return (
                              <div key={rs.id} className={`mb-1.5 rounded-xl border transition-all duration-200 ${isRsActive ? 'border-amber-200/60 bg-gradient-to-r from-amber-50/40 to-orange-50/20' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'}`}>
                                {/* 形象头 */}
                                <div
                                  className="flex items-center gap-2 px-2.5 py-2 cursor-pointer group/rs"
                                  onClick={() => setExpandedRefSetKey(isRsOpen ? null : rsKey)}
                                >
                                  {/* 缩略图 */}
                                  <div className="w-7 h-7 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200/60">
                                    {rs.images?.front ? (
                                      <img src={rs.images.front} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center"><User size={10} className="text-slate-300" /></div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <input
                                      className="text-[11px] font-medium bg-transparent border-none outline-none w-full text-slate-700 placeholder-slate-400"
                                      value={rs.label}
                                      onChange={(e) => updateRefSetLabel(phase.id, rs.id, e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="text-[9px] text-slate-400">{rsImgCount}/8 张</div>
                                  </div>
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    {isRsActive && (
                                      <span className="text-[8px] px-1 py-px rounded bg-amber-100 text-amber-600 font-medium">使用中</span>
                                    )}
                                    {!isRsActive && (
                                      <button onClick={(e) => { e.stopPropagation(); setActiveRefSet(phase.id, rs.id); }}
                                        className="p-0.5 rounded-md text-slate-300 hover:text-amber-500 cursor-pointer transition-all duration-200" title="设为使用">
                                        <Check size={10} />
                                      </button>
                                    )}
                                    {(phase.refSets || []).length > 1 && (
                                      <button onClick={(e) => { e.stopPropagation(); removeRefSet(phase.id, rs.id); }}
                                        className="p-0.5 rounded-md text-slate-300 hover:text-red-400 cursor-pointer transition-all duration-200" title="删除">
                                        <Trash2 size={9} />
                                      </button>
                                    )}
                                    <ChevronRight size={10} className={`text-slate-300 transition-transform duration-200 ${isRsOpen ? 'rotate-90' : ''}`} />
                                  </div>
                                </div>

                                {/* 展开：全身图(4) + 脸部特写(4) */}
                                {isRsOpen && (
                                  <div className="px-2.5 pb-2.5">
                                    {/* 全身图 */}
                                    <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mb-1">全身参考图</div>
                                    <div className="grid grid-cols-4 gap-1.5 mb-2">
                                      {Object.entries(bodyAngleLabels).map(([key, label]) => {
                                        const img = rs.images?.[key];
                                        return (
                                          <div key={key} onClick={() => handleAngleUpload(phase.id, rs.id, key)}
                                            className="group/img relative h-[68px] rounded-xl border border-slate-200/60 bg-white flex items-center justify-center cursor-pointer hover:border-amber-300 hover:shadow-sm transition-all duration-200 overflow-hidden">
                                            {img ? (
                                              <>
                                                <img src={img} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                  <Upload size={11} className="text-white" />
                                                </div>
                                              </>
                                            ) : (
                                              <div className="text-center">
                                                <Upload size={11} className="text-slate-300 mx-auto mb-0.5" />
                                                <div className="text-[8px] text-slate-400">{label}</div>
                                              </div>
                                            )}
                                            <div className="absolute top-0.5 left-1 text-[7px] text-slate-500 bg-white/80 px-1 py-px rounded-md">{label}</div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    {/* 脸部特写 */}
                                    <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mb-1">脸部特写</div>
                                    <div className="grid grid-cols-4 gap-1.5">
                                      {Object.entries(faceAngleLabels).map(([key, label]) => {
                                        const img = rs.images?.[key];
                                        return (
                                          <div key={key}
                                            className="group/img relative h-[68px] rounded-xl border border-purple-200/60 bg-white flex items-center justify-center overflow-hidden"
                                            title={img ? label : '上传对应全身图后自动生成'}>
                                            {img ? (
                                              <img src={img} className="w-full h-full object-cover" />
                                            ) : (
                                              <div className="text-center">
                                                <User size={11} className="text-purple-200 mx-auto mb-0.5" />
                                                <div className="text-[7px] text-purple-300">{label}</div>
                                              </div>
                                            )}
                                            <div className="absolute top-0.5 left-1 text-[7px] text-purple-500 bg-white/80 px-1 py-px rounded-md">{label}</div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <button
                                      disabled={aiGenerating === `${phase.id}:${rs.id}`}
                                      onClick={() => handleAiGenerate(phase.id, rs.id)}
                                      className="w-full mt-2 btn btn-ghost text-amber-600 border-amber-200/60 hover:bg-amber-50 !text-[10px] !py-1.5 !rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {aiGenerating === `${phase.id}:${rs.id}` ? (
                                        <><Loader2 size={10} className="animate-spin" /> AI 生成中…</>
                                      ) : (
                                        <><Sparkles size={10} /> AI 生成 8 张参考图</>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {phases.length === 0 && (
            <div className="text-xs text-slate-400 text-center py-6 bg-slate-50/60 rounded-xl border border-slate-100">
              暂无成长阶段
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
