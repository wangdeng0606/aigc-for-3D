import { useState, useMemo } from 'react';
import { X, Video, Sparkles, Play, Loader2, Upload, User, ImageIcon, FileText, Settings, Trash2, Link, ChevronDown, Zap, ArrowRight, Check, AlertCircle, Scissors } from 'lucide-react';

const API_BASE = 'http://localhost:8080';

export default function VideoProductionPanel({ node, scenes, characters, prevVideo, relationships, onPushEvents, onUpdateCharacter, onUpdate, onDelete, onClose }) {
  const d = node.data;
  const update = (field, value) => onUpdate({ [field]: value });

  const [storyboardGenStatus, setStoryboardGenStatus] = useState('idle');

  /* AI 人物事件分析 */
  const [analysisStatus, setAnalysisStatus] = useState('idle'); // idle | analyzing | done
  const [suggestedEvents, setSuggestedEvents] = useState([]);
  const [pushResult, setPushResult] = useState(null);

  /* 帧截取 */
  const [capturedFrames, setCapturedFrames] = useState([]);
  const [selectedCharId, setSelectedCharId] = useState('');
  const [genStatus, setGenStatus] = useState('idle');
  const [genResult, setGenResult] = useState(null);

  /* 当前选中的场景 */
  const selectedScene = scenes.find((s) => s.id === d.sceneId) || null;

  /* 参与角色的完整信息 */
  const involvedChars = (characters || []).filter((c) => (d.characterIds || []).includes(c.id));

  /* 场景选择 */
  const handleSceneSelect = (sceneId) => {
    const scene = scenes.find((s) => s.id === sceneId);
    if (scene) {
      onUpdate({
        sceneId,
        backgroundSetting: scene.description || scene.keywords || '',
      });
    }
  };

  /* 角色切换 */
  const toggleCharacter = (charId) => {
    const ids = d.characterIds || [];
    if (ids.includes(charId)) {
      onUpdate({ characterIds: ids.filter((id) => id !== charId) });
    } else {
      onUpdate({ characterIds: [...ids, charId] });
    }
  };

  /* AI 生成分镜 */
  const handleGenerateStoryboard = () => {
    const script = d.script || '';
    const bg = d.backgroundSetting || '';
    if (!script.trim() && !bg.trim()) return;
    setStoryboardGenStatus('generating');
    setTimeout(() => {
      const charNames = involvedChars.map((c) => c.name).join('、') || '角色';
      const generated = [
        `【全景】${bg || '场景展开'}，${charNames}登场。`,
        `【中景】${script ? script.slice(0, 30) + '…' : '剧情推进'}，镜头缓慢推近。`,
        `【近景】人物面部特写，情绪转变，气氛紧张。`,
        `【全景】镜头拉远，收束画面，留下悬念。`,
      ].join('\n');
      update('storyboard', generated);
      setStoryboardGenStatus('idle');
    }, 1500);
  };

  /* ===== AI 人物事件分析 ===== */
  const runAnalysis = () => {
    const charIds = d.characterIds || [];
    if (!charIds.length) return;
    const context = [d.script, d.backgroundSetting, d.storyboard].filter(Boolean).join('；');
    if (!context) return;
    setAnalysisStatus('analyzing');
    setPushResult(null);

    // Mock AI — 实际项目中替换为真实 API 调用
    setTimeout(() => {
      const suggested = [];
      const ts = Date.now();
      for (let i = 0; i < charIds.length; i++) {
        for (let j = i + 1; j < charIds.length; j++) {
          const a = characters.find((c) => c.id === charIds[i]);
          const b = characters.find((c) => c.id === charIds[j]);
          if (!a || !b) continue;
          suggested.push({
            id: `sug-${ts}-${i}-${j}-1`,
            sourceCharId: a.id, targetCharId: b.id,
            title: '竹林偶遇',
            desc: `${a.name}与${b.name}在月光竹林中不期而遇，双方各怀戒备，气氛紧张`,
            tag: '初识', type: 'event', accepted: true,
          });
          suggested.push({
            id: `sug-${ts}-${i}-${j}-2`,
            sourceCharId: a.id, targetCharId: b.id,
            title: '争夺武林秘籍',
            desc: `双方同时发现藏匿于竹林中的武功秘籍，${a.name}与${b.name}为争夺秘籍展开激烈交锋`,
            tag: '冲突', type: 'event', accepted: true,
          });
          suggested.push({
            id: `sug-${ts}-${i}-${j}-rel`,
            sourceCharId: a.id, targetCharId: b.id,
            title: '关系演变为仇敌',
            desc: `因得知${b.name}与师父之死有关，${a.name}视其为不共戴天之仇敌`,
            tag: '关系变化', type: 'relationship', accepted: true,
          });
        }
      }
      setSuggestedEvents(suggested);
      setAnalysisStatus('done');
    }, 1500);
  };

  const toggleSuggestion = (id) => {
    setSuggestedEvents((prev) => prev.map((e) => (e.id === id ? { ...e, accepted: !e.accepted } : e)));
  };

  const handlePushEvents = () => {
    const accepted = suggestedEvents.filter((e) => e.accepted);
    if (!accepted.length) return;
    const grouped = {};
    for (const evt of accepted) {
      const key = [evt.sourceCharId, evt.targetCharId].sort().join('|');
      if (!grouped[key]) grouped[key] = { sourceCharId: evt.sourceCharId, targetCharId: evt.targetCharId, events: [] };
      grouped[key].events.push({
        id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: evt.title, desc: evt.desc, type: evt.type, tag: evt.tag,
        source: 'ai-scene', sceneTitle: d.title || '未命名视频',
      });
    }
    onPushEvents(Object.values(grouped));
    setPushResult({ count: accepted.length });
  };

  /* ===== 帧截取 → 生成角色形象 ===== */
  const handleFrameUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setCapturedFrames((prev) => [...prev, { id: `frame-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, dataUrl: ev.target.result }]);
        };
        reader.readAsDataURL(file);
      });
    };
    input.click();
  };

  const removeFrame = (id) => {
    setCapturedFrames((prev) => prev.filter((f) => f.id !== id));
  };

  const handleGenerateRefSet = () => {
    if (!selectedCharId || !capturedFrames.length) return;
    setGenStatus('generating');
    setTimeout(() => {
      const char = characters.find((c) => c.id === selectedCharId);
      if (!char) return;
      const newRsId = `rs-${Date.now()}`;
      const frameImgs = capturedFrames.map((f) => f.dataUrl);
      const newRefSet = {
        id: newRsId,
        label: `${d.title || '视频'}截取形象`,
        images: { front: frameImgs[0] || null, side: frameImgs[1] || null, back: frameImgs[2] || null, quarter: frameImgs[3] || null },
      };
      const activePhase = char.phases?.find((p) => p.id === char.activePhase) || char.phases?.[0];
      if (activePhase) {
        const updatedPhases = char.phases.map((p) =>
          p.id === activePhase.id ? { ...p, refSets: [...(p.refSets || []), newRefSet] } : p
        );
        onUpdateCharacter(selectedCharId, { phases: updatedPhases });
      }
      setGenStatus('done');
      setGenResult({ charName: char.name, rsLabel: newRefSet.label });
    }, 2000);
  };

  /* 生成视频 */
  const handleGenerate = async () => {
    update('status', 'generating');
    const charPayload = involvedChars.map((c) => {
      const phase = c.phases?.find((p) => p.id === c.activePhase) || c.phases?.[0];
      return { name: c.name, role: phase?.role || '', description: phase?.description || '', tags: phase?.tags || [] };
    });

    const payload = {
      script: d.script || '',
      backgroundSetting: d.backgroundSetting || '',
      storyboard: d.storyboard || '',
      characters: charPayload,
      sceneId: d.sceneId || null,
      ...(prevVideo?.data?.videoUrl ? { prevVideoUrl: prevVideo.data.videoUrl } : {}),
    };

    try {
      const res = await fetch(`${API_BASE}/api/video/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.videoUrl) {
        onUpdate({ status: 'done', videoUrl: data.videoUrl });
      } else {
        console.error('视频生成失败', data);
        update('status', 'idle');
      }
    } catch (err) {
      console.error('视频生成请求异常', err);
      update('status', 'idle');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[9px] bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center shadow-inner">
            <Video size={13} className="text-violet-600" strokeWidth={1.8} />
          </div>
          <span className="font-display text-[14px] font-semibold text-slate-700">视频配置</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 cursor-pointer transition-all duration-200" title="删除节点">
            <Trash2 size={13} />
          </button>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-50 cursor-pointer transition-all duration-200">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* 标题 */}
        <section>
          <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-2.5 block">视频标题</label>
          <input className="input" value={d.title || ''} onChange={(e) => update('title', e.target.value)} placeholder="输入视频标题" />
        </section>

        {/* 前序视频链接提示 */}
        {prevVideo && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-50/60 border border-violet-200/40">
            <Link size={12} className="text-violet-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-violet-600 font-medium">承接上一段视频</div>
              <div className="text-[9px] text-violet-400 truncate">{prevVideo.data?.title || '未命名'}</div>
            </div>
            {prevVideo.data?.videoUrl && (
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60 font-medium shrink-0">已完成</span>
            )}
          </div>
        )}

        {/* 视频预览 */}
        <section>
          <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-2.5 block">视频预览</label>
          <div className="w-full h-44 rounded-xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-violet-50/20 flex items-center justify-center overflow-hidden">
            {d.status === 'generating' ? (
              <div className="text-center">
                <Loader2 size={24} className="text-violet-400 mx-auto mb-2 animate-spin" />
                <div className="text-[10px] text-violet-500">视频生成中…</div>
                <div className="text-[9px] text-slate-400 mt-1">预计 1-5 分钟</div>
              </div>
            ) : d.videoUrl ? (
              <div className="relative w-full h-full bg-black rounded-xl overflow-hidden">
                <video src={d.videoUrl} controls className="w-full h-full object-contain" preload="metadata" />
                <div className="absolute top-2 left-2.5 text-[9px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full pointer-events-none">已生成</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-white/80 shadow-sm mx-auto mb-2 flex items-center justify-center">
                  <Video size={16} className="text-slate-300" />
                </div>
                <div className="text-[10px] text-slate-400 font-medium">选择场景并填写剧本后生成</div>
              </div>
            )}
          </div>
        </section>

        {/* ===== 场景选择 ===== */}
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <ImageIcon size={11} className="text-emerald-500" />
            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">选择场景</label>
          </div>
          {scenes.length > 0 ? (
            <div className="space-y-1.5">
              {scenes.map((s) => {
                const sel = d.sceneId === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSceneSelect(s.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all duration-200
                      ${sel
                        ? 'bg-gradient-to-r from-emerald-50/60 to-teal-50/30 text-emerald-700 border border-emerald-200/60'
                        : 'bg-slate-50/50 text-slate-500 border border-slate-200/60 hover:border-slate-300'
                      }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-colors ${sel ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`} />
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200/60">
                      {(s.images || []).length > 0 ? <img src={s.images[0].url} className="w-full h-full object-cover" /> : <ImageIcon size={12} className="text-slate-300 m-auto" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[12px] truncate">{s.name}</div>
                      <div className="text-[9px] opacity-60 truncate">{s.description || s.keywords || '无描述'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 text-center py-4 bg-slate-50/60 rounded-xl border border-slate-100">请先在"场景管理"中添加场景</div>
          )}
        </section>

        {/* ===== 角色选择 ===== */}
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <User size={11} className="text-amber-500" />
            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">参与角色</label>
          </div>
          <div className="space-y-1.5">
            {characters.map((char) => {
              const sel = (d.characterIds || []).includes(char.id);
              const phase = char.phases?.find((p) => p.id === char.activePhase) || char.phases?.[0];
              const rs = phase?.refSets?.find((r) => r.id === phase?.activeRefSet) || phase?.refSets?.[0];
              const frontImg = rs?.images?.front;
              return (
                <div
                  key={char.id}
                  onClick={() => toggleCharacter(char.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all duration-200
                    ${sel
                      ? 'bg-gradient-to-r from-amber-50/60 to-orange-50/30 text-amber-700 border border-amber-200/60'
                      : 'bg-slate-50/50 text-slate-500 border border-slate-200/60 hover:border-slate-300'
                    }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-colors ${sel ? 'border-amber-500 bg-amber-500' : 'border-slate-300'}`} />
                  <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200/60">
                    {frontImg ? <img src={frontImg} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User size={10} className="text-slate-300" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[12px] truncate">{char.name}</div>
                    <div className="text-[9px] opacity-60 truncate">{phase?.label} · {phase?.role || '未设定'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ===== 剧本 ===== */}
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <FileText size={11} className="text-indigo-500" />
            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">剧本 / 台词</label>
          </div>
          <textarea className="input resize-none" rows={3} value={d.script || ''} onChange={(e) => update('script', e.target.value)} placeholder="当前镜头的剧本内容…" />
        </section>

        {/* ===== 背景设定 ===== */}
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <Settings size={11} className="text-cyan-500" />
            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">背景设定</label>
          </div>
          <textarea className="input resize-none" rows={2} value={d.backgroundSetting || ''} onChange={(e) => update('backgroundSetting', e.target.value)} placeholder="场景背景与氛围…" />
        </section>

        {/* ===== 分镜 ===== */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles size={11} className="text-violet-500" />
              <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">分镜描述</label>
            </div>
            <button
              onClick={handleGenerateStoryboard}
              disabled={storyboardGenStatus === 'generating' || (!d.script?.trim() && !d.backgroundSetting?.trim())}
              className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                storyboardGenStatus === 'generating' || (!d.script?.trim() && !d.backgroundSetting?.trim())
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-violet-600 hover:bg-violet-50 cursor-pointer'
              }`}
            >
              {storyboardGenStatus === 'generating' ? (
                <><Loader2 size={10} className="animate-spin" /> 生成中…</>
              ) : (
                <><Sparkles size={10} /> AI 生成</>
              )}
            </button>
          </div>
          <textarea className="input resize-none" rows={4} value={d.storyboard || ''} onChange={(e) => update('storyboard', e.target.value)} placeholder="基于剧本与背景设定，AI 自动生成分镜描述…" />
        </section>

        {/* 生成视频按钮 */}
        <button
          onClick={handleGenerate}
          disabled={d.status === 'generating' || !d.sceneId}
          className={`w-full btn ${
            d.status === 'generating' || !d.sceneId
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-violet-600 text-white hover:bg-violet-500 hover:shadow-md hover:shadow-violet-200/40'
          }`}
        >
          {d.status === 'generating' ? (
            <><Loader2 size={13} className="animate-spin" /> 生成中...</>
          ) : (
            <><Sparkles size={13} /> {prevVideo?.data?.videoUrl ? '续接生成视频' : '生成视频'}</>
          )}
        </button>
        {!d.sceneId && (
          <div className="text-[9px] text-slate-400 text-center mt-1">请先选择场景</div>
        )}

        {/* ===== AI 人物事件分析 ===== */}
        <section className="border-t border-slate-100/80 pt-5">
          <div className="flex items-center gap-1.5 mb-3">
            <Zap size={11} className="text-orange-500" />
            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">人物事件分析</label>
          </div>

          <div className="bg-gradient-to-r from-orange-50/50 to-amber-50/30 border border-orange-100/60 rounded-xl p-3 mb-3">
            <div className="text-[10px] text-orange-600/80 leading-relaxed">
              根据剧本、背景设定与分镜描述，AI 自动分析参与角色之间的事件与潜在关系变化，审核后可一键推送至角色关系时间线。
            </div>
          </div>

          {analysisStatus === 'idle' && (
            <button
              onClick={runAnalysis}
              disabled={!(d.characterIds || []).length || (!d.script?.trim() && !d.backgroundSetting?.trim() && !d.storyboard?.trim())}
              className={`w-full btn ${
                !(d.characterIds || []).length || (!d.script?.trim() && !d.backgroundSetting?.trim() && !d.storyboard?.trim())
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-400 hover:shadow-md hover:shadow-orange-200/40'
              }`}
            >
              <Zap size={12} />
              AI 分析人物事件
            </button>
          )}

          {analysisStatus === 'analyzing' && (
            <div className="text-center py-6">
              <Loader2 size={20} className="text-orange-400 mx-auto mb-2 animate-spin" />
              <div className="text-[11px] text-orange-500 font-medium">正在分析剧本与人物关系…</div>
              <div className="text-[9px] text-slate-400 mt-1">基于剧本、背景设定与分镜描述推演</div>
            </div>
          )}

          {analysisStatus === 'done' && suggestedEvents.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-500 font-medium">
                  AI 建议事件 ({suggestedEvents.filter((e) => e.accepted).length}/{suggestedEvents.length} 已勾选)
                </span>
                <button
                  onClick={() => { setAnalysisStatus('idle'); setSuggestedEvents([]); setPushResult(null); }}
                  className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                >重新分析</button>
              </div>

              {suggestedEvents.map((evt) => {
                const srcChar = characters.find((c) => c.id === evt.sourceCharId);
                const tgtChar = characters.find((c) => c.id === evt.targetCharId);
                return (
                  <div
                    key={evt.id}
                    className={`rounded-xl border p-3 transition-all duration-200 cursor-pointer ${
                      evt.accepted ? 'bg-gradient-to-r from-orange-50/60 to-amber-50/30 border-orange-200/60' : 'bg-white border-slate-200/60 opacity-60'
                    }`}
                    onClick={() => toggleSuggestion(evt.id)}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-4 h-4 mt-0.5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                        evt.accepted ? 'border-orange-500 bg-orange-500' : 'border-slate-300'
                      }`}>
                        {evt.accepted && <Check size={10} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[11px] font-medium text-slate-800">{evt.title}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${
                            evt.type === 'relationship'
                              ? 'bg-violet-50 text-violet-600 border-violet-200'
                              : 'bg-blue-50 text-blue-600 border-blue-200'
                          }`}>{evt.tag}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">{evt.desc}</p>
                        <div className="flex items-center gap-1 mt-1.5 text-[9px] text-slate-400">
                          <span className="font-medium">{srcChar?.name || '?'}</span>
                          <ArrowRight size={8} />
                          <span className="font-medium">{tgtChar?.name || '?'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {pushResult ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/60">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span className="text-[11px] text-emerald-700">已推送 {pushResult.count} 条事件至角色关系图</span>
                </div>
              ) : (
                <button
                  onClick={handlePushEvents}
                  disabled={!suggestedEvents.some((e) => e.accepted)}
                  className={`w-full btn mt-1 ${
                    suggestedEvents.some((e) => e.accepted)
                      ? 'bg-emerald-500 text-white hover:bg-emerald-400 hover:shadow-md hover:shadow-emerald-200/40'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Check size={12} />
                  确认推送至角色关系图
                </button>
              )}

              <div className="flex items-start gap-1.5 mt-1.5">
                <AlertCircle size={10} className="text-slate-400 mt-0.5 shrink-0" />
                <span className="text-[9px] text-slate-400 leading-relaxed">
                  如有关系变动，请在「角色管理」中点击关系连线，手动标记哪些事件导致了关系演变
                </span>
              </div>
            </div>
          )}

          {analysisStatus === 'done' && suggestedEvents.length === 0 && (
            <div className="text-center py-4 text-[11px] text-slate-400">
              未检测到人物事件，请补充剧本或分镜描述后重试
            </div>
          )}
        </section>

        {/* ===== 裁取视频帧 → 生成角色形象 ===== */}
        {d.status === 'done' && (
          <section className="border-t border-slate-100/80 pt-5">
            <div className="flex items-center gap-1.5 mb-3">
              <Scissors size={11} className="text-rose-500" />
              <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">裁取角色形象</label>
            </div>

            <div className="bg-gradient-to-r from-rose-50/50 to-pink-50/30 border border-rose-100/60 rounded-xl p-3 mb-3">
              <div className="text-[10px] text-rose-600/80 leading-relaxed">
                从视频中截取角色的关键帧图片（正面/侧面/背面），选择对应角色后 AI 将生成新的角色形象参考图。
              </div>
            </div>

            {/* 帧上传区 */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-500 font-medium">截取帧 ({capturedFrames.length}/4)</span>
                <button
                  onClick={handleFrameUpload}
                  disabled={capturedFrames.length >= 4}
                  className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                    capturedFrames.length >= 4
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-rose-600 hover:bg-rose-50 cursor-pointer'
                  }`}
                >
                  <Upload size={10} /> 上传截图
                </button>
              </div>

              {capturedFrames.length > 0 ? (
                <div className="grid grid-cols-4 gap-1.5">
                  {capturedFrames.map((frame) => (
                    <div key={frame.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200/60 group">
                      <img src={frame.dataUrl} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeFrame(frame.id)}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={8} />
                      </button>
                    </div>
                  ))}
                  {Array.from({ length: 4 - capturedFrames.length }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      onClick={handleFrameUpload}
                      className="aspect-square rounded-xl border border-dashed border-slate-300/60 flex items-center justify-center cursor-pointer hover:border-rose-300 transition-all duration-200"
                    >
                      <Upload size={10} className="text-slate-300" />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  onClick={handleFrameUpload}
                  className="w-full h-20 rounded-xl border border-dashed border-slate-300/60 flex items-center justify-center cursor-pointer hover:border-rose-300 transition-all duration-200"
                >
                  <div className="text-center">
                    <Scissors size={16} className="text-slate-300 mx-auto mb-1" />
                    <div className="text-[9px] text-slate-400">点击上传视频截取帧</div>
                  </div>
                </div>
              )}
            </div>

            {/* 角色选择 */}
            <div className="mb-3">
              <span className="text-[10px] text-slate-500 font-medium mb-1.5 block">指定角色</span>
              {involvedChars.length > 0 ? (
                <div className="space-y-1">
                  {involvedChars.map((char) => {
                    const sel = selectedCharId === char.id;
                    const phase = char.phases?.find((p) => p.id === char.activePhase) || char.phases?.[0];
                    const rs = phase?.refSets?.find((r) => r.id === phase.activeRefSet) || phase?.refSets?.[0];
                    const frontImg = rs?.images?.front;
                    return (
                      <div
                        key={char.id}
                        onClick={() => setSelectedCharId(sel ? '' : char.id)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all duration-200 ${
                          sel
                            ? 'bg-gradient-to-r from-rose-50/60 to-pink-50/30 text-rose-700 border border-rose-200/60'
                            : 'bg-slate-50/50 text-slate-500 border border-slate-200/60 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-colors ${
                          sel ? 'border-rose-500 bg-rose-500' : 'border-slate-300'
                        }`} />
                        <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200/60">
                          {frontImg ? (
                            <img src={frontImg} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><User size={9} className="text-slate-300" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[11px] truncate">{char.name}</div>
                          <div className="text-[9px] opacity-60 truncate">{phase?.label} · {rs?.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 text-center py-3 bg-slate-50/60 rounded-xl border border-slate-100">
                  请先选择参与角色
                </div>
              )}
            </div>

            {/* 生成按钮 / 结果 */}
            {genStatus === 'done' && genResult ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/60 mb-2">
                <Check size={14} className="text-emerald-500 shrink-0" />
                <span className="text-[11px] text-emerald-700">
                  已为「{genResult.charName}」生成新形象「{genResult.rsLabel}」，可在角色管理中查看
                </span>
              </div>
            ) : (
              <button
                onClick={handleGenerateRefSet}
                disabled={!selectedCharId || !capturedFrames.length || genStatus === 'generating'}
                className={`w-full btn ${
                  !selectedCharId || !capturedFrames.length || genStatus === 'generating'
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-rose-500 text-white hover:bg-rose-400 hover:shadow-md hover:shadow-rose-200/40'
                }`}
              >
                {genStatus === 'generating' ? (
                  <><Loader2 size={12} className="animate-spin" /> AI 生成形象中...</>
                ) : (
                  <><ImageIcon size={12} /> AI 生成角色形象</>
                )}
              </button>
            )}

            {genStatus === 'done' && genResult && (
              <button
                onClick={() => { setGenStatus('idle'); setGenResult(null); setCapturedFrames([]); setSelectedCharId(''); }}
                className="w-full btn btn-ghost text-xs text-slate-500 border-slate-200/60 hover:bg-slate-50 mt-1.5"
              >
                继续裁取其他角色
              </button>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
