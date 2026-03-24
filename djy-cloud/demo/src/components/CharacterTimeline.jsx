import { useState } from 'react';
import { X, Plus, Link2, Zap, ChevronRight, Trash2, Loader2, Sparkles } from 'lucide-react';

const eventTagColors = {
  '初识': 'bg-sky-50 text-sky-600 border-sky-200',
  '冲突': 'bg-red-50 text-red-600 border-red-200',
  '合作': 'bg-emerald-50 text-emerald-600 border-emerald-200',
  '和解': 'bg-amber-50 text-amber-600 border-amber-200',
  '背叛': 'bg-rose-50 text-rose-600 border-rose-200',
  '恋爱': 'bg-pink-50 text-pink-600 border-pink-200',
  '关系变化': 'bg-violet-50 text-violet-600 border-violet-200',
  '日常': 'bg-slate-50 text-slate-500 border-slate-200',
};

export default function CharacterTimeline({ edge, sourceName, targetName, onUpdateEdgeData, onBack }) {
  const data = edge.data || {};
  const relHistory = data.relationshipHistory || [];
  const events = data.events || [];

  const [addingType, setAddingType] = useState(null); // 'event' | 'relationship' | null
  const [form, setForm] = useState({ title: '', desc: '', tag: '日常' });
  const [relForm, setRelForm] = useState({ label: '', desc: '' });
  const [aiRelStatus, setAiRelStatus] = useState('idle'); // idle | analyzing | done
  const [aiRelSuggestion, setAiRelSuggestion] = useState(null); // { label, desc, reasoning }

  const addEvent = () => {
    if (!form.title.trim()) return;
    const evt = { id: `e-${Date.now()}`, title: form.title, desc: form.desc, type: 'event', tag: form.tag };
    onUpdateEdgeData({ events: [...events, evt] });
    setForm({ title: '', desc: '', tag: '日常' });
    setAddingType(null);
  };

  const addRelChange = () => {
    if (!relForm.label.trim()) return;
    const rel = { id: `r-${Date.now()}`, label: relForm.label, desc: relForm.desc };
    const relEvt = { id: `e-${Date.now()}`, title: `关系变为「${relForm.label}」`, desc: relForm.desc, type: 'relationship', tag: '关系变化' };
    onUpdateEdgeData({
      label: relForm.label,
      relationshipHistory: [...relHistory, rel],
      events: [...events, relEvt],
    });
    setRelForm({ label: '', desc: '' });
    setAddingType(null);
  };

  const removeEvent = (id) => {
    onUpdateEdgeData({ events: events.filter((e) => e.id !== id) });
  };

  // AI 自动分析事件记录，推演关系变化
  const aiAnalyzeRelationship = () => {
    if (!events.length) {
      alert('暂无事件记录，请先添加事件后再进行 AI 分析');
      return;
    }
    setAiRelStatus('analyzing');
    setAddingType(null);

    setTimeout(() => {
      // Mock AI: 分析事件标签和内容推演关系
      const tags = events.map((e) => e.tag);
      const titles = events.map((e) => e.title).join(' ');
      const descs = events.map((e) => e.desc).join(' ');
      const allText = titles + ' ' + descs;

      let label = '待定';
      let desc = '';
      let reasoning = '';

      if (allText.includes('仇') || allText.includes('杀') || allText.includes('敌') || allText.includes('恨')) {
        label = '仇敌';
        desc = '因杀师之仇结为不共戴天的仇敌';
        reasoning = `分析 ${events.length} 条事件记录：检测到「${sourceName}」与「${targetName}」之间存在严重冲突事件，涉及杀师仇恨，关系已无法调和，建议将关系更新为「仇敌」。`;
      } else if (tags.includes('冲突') && !tags.includes('合作')) {
        label = '对手';
        desc = '因多次冲突成为对手';
        reasoning = `分析 ${events.length} 条事件记录：发现多次冲突事件但无合作记录，双方处于对立状态，建议将关系更新为「对手」。`;
      } else if (tags.includes('合作') && tags.includes('冲突')) {
        label = '亦敌亦友';
        desc = '既有冲突也有合作';
        reasoning = `分析 ${events.length} 条事件记录：既有冲突事件也有合作记录，关系复杂，建议将关系更新为「亦敌亦友」。`;
      } else if (tags.includes('合作')) {
        label = '盟友';
        desc = '因多次合作结为盟友';
        reasoning = `分析 ${events.length} 条事件记录：多次合作记录，关系积极正向，建议将关系更新为「盟友」。`;
      } else if (tags.includes('初识')) {
        label = '相识';
        desc = '初步建立联系';
        reasoning = `分析 ${events.length} 条事件记录：目前仅有初识事件，双方刚建立联系，建议将关系更新为「相识」。`;
      } else {
        label = '相识';
        desc = '基于已有事件建立的关系';
        reasoning = `分析 ${events.length} 条事件记录：基于现有事件推断双方已建立联系，建议关系为「相识」。`;
      }

      setAiRelSuggestion({ label, desc, reasoning });
      setRelForm({ label, desc });
      setAiRelStatus('done');
    }, 1200);
  };

  return (
    /* 遮罩层 */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm" onClick={onBack}>
      {/* 弹窗主体 */}
      <div
        className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-900/[0.08] border border-slate-200/60 w-[90vw] max-w-[820px] max-h-[85vh] flex flex-col animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶栏 */}
        <div className="border-b border-slate-100/80 px-6 py-4 flex items-center gap-4 shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <span className="font-display text-sm font-semibold text-slate-800">{sourceName}</span>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="font-display text-sm font-semibold text-slate-800">{targetName}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200/60 font-medium">
              {data.label || '关系'}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={aiAnalyzeRelationship}
              disabled={aiRelStatus === 'analyzing'}
              className="btn btn-ghost text-xs !py-1.5 text-violet-600 border-violet-200 hover:bg-violet-50"
            >
              {aiRelStatus === 'analyzing' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              AI 更新关系
            </button>
            <button
              onClick={() => { setAddingType('relationship'); setAiRelStatus('idle'); setAiRelSuggestion(null); }}
              className="btn btn-ghost text-xs !py-1.5 text-slate-500 border-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              <Link2 size={12} /> 手动更新
            </button>
            <button
              onClick={() => { setAddingType('event'); setRelForm({ label: '', desc: '' }); }}
              className="btn btn-primary text-xs !py-1.5"
            >
              <Plus size={12} /> 添加事件
            </button>
            <button onClick={onBack} className="ml-1 w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50 cursor-pointer transition-all duration-200">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 space-y-8">

          {/* ===== 关系线 ===== */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-[9px] bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center shadow-inner">
                <Link2 size={13} className="text-violet-600" strokeWidth={1.8} />
              </div>
              <h2 className="font-display text-sm font-semibold text-slate-700">关系演变</h2>
              <span className="text-[10px] text-slate-400 tracking-wider">RELATIONSHIP LINE</span>
            </div>

            {relHistory.length > 0 ? (
              <div className="flex items-center gap-0 overflow-x-auto pb-2">
                {relHistory.map((r, i) => (
                  <div key={r.id} className="flex items-center shrink-0">
                    <div className="flex flex-col items-center group">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-200
                        ${i === relHistory.length - 1
                          ? 'bg-gradient-to-br from-violet-100 to-purple-100 border-violet-400 text-violet-700 shadow-sm shadow-violet-200/40'
                          : 'bg-white border-slate-200 text-slate-400 group-hover:border-violet-300'
                        }`}>
                        R{i}
                      </div>
                      <div className="mt-2 text-center max-w-[100px]">
                        <div className={`text-xs font-medium ${i === relHistory.length - 1 ? 'text-violet-700' : 'text-slate-600'}`}>
                          {r.label}
                        </div>
                        {r.desc && <div className="text-[10px] text-slate-400 mt-0.5 truncate">{r.desc}</div>}
                      </div>
                    </div>
                    {i < relHistory.length - 1 && (
                      <div className="w-20 flex items-center mx-2 relative">
                        <div className="w-full h-0.5 bg-gradient-to-r from-violet-200 to-slate-200 rounded" />
                        <ChevronRight size={10} className="absolute right-0 text-slate-300" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400 py-6 text-center bg-slate-50/60 rounded-xl border border-slate-100">
                暂无关系记录
              </div>
            )}

            {/* AI 分析关系结果 */}
            {aiRelStatus === 'analyzing' && (
              <div className="mt-3 bg-gradient-to-r from-violet-50/80 to-purple-50/40 rounded-xl border border-violet-200/60 p-5 text-center">
                <Loader2 size={18} className="text-violet-400 mx-auto mb-2 animate-spin" />
                <div className="text-[11px] text-violet-600 font-medium">AI 正在分析事件记录…</div>
                <div className="text-[9px] text-slate-400 mt-1">根据已有事件推演关系变化</div>
              </div>
            )}

            {aiRelStatus === 'done' && aiRelSuggestion && (
              <div className="mt-3 bg-white rounded-xl border border-violet-200/60 p-4 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={12} className="text-violet-500" />
                  <span className="text-xs font-medium text-violet-600">AI 关系分析结果</span>
                </div>
                <div className="bg-gradient-to-r from-violet-50/80 to-purple-50/30 rounded-xl p-3">
                  <div className="text-[10px] text-slate-500 mb-2 leading-relaxed">{aiRelSuggestion.reasoning}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">建议关系：</span>
                    <span className="text-sm font-bold text-violet-700">{aiRelSuggestion.label}</span>
                  </div>
                </div>
                <input
                  className="input"
                  placeholder="关系标签（可修改）"
                  value={relForm.label}
                  onChange={(e) => setRelForm({ ...relForm, label: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="变化原因（可修改）"
                  value={relForm.desc}
                  onChange={(e) => setRelForm({ ...relForm, desc: e.target.value })}
                />
                <div className="flex gap-2">
                  <button onClick={() => { addRelChange(); setAiRelStatus('idle'); setAiRelSuggestion(null); }} className="btn btn-primary text-xs !py-1.5">确认更新</button>
                  <button onClick={() => { setAiRelStatus('idle'); setAiRelSuggestion(null); }} className="btn btn-ghost text-xs !py-1.5">取消</button>
                </div>
              </div>
            )}

            {/* 手动新增关系表单 */}
            {addingType === 'relationship' && aiRelStatus === 'idle' && (
              <div className="mt-3 bg-white rounded-xl border border-violet-200/60 p-4 space-y-3 shadow-sm">
                <div className="text-xs font-medium text-violet-600 mb-1">手动更新关系状态</div>
                <input
                  className="input"
                  placeholder="新关系标签（如：朋友、恋人、师徒）"
                  value={relForm.label}
                  onChange={(e) => setRelForm({ ...relForm, label: e.target.value })}
                  autoFocus
                />
                <input
                  className="input"
                  placeholder="变化原因（选填）"
                  value={relForm.desc}
                  onChange={(e) => setRelForm({ ...relForm, desc: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && addRelChange()}
                />
                <div className="flex gap-2">
                  <button onClick={addRelChange} className="btn btn-primary text-xs !py-1.5">确认变更</button>
                  <button onClick={() => setAddingType(null)} className="btn btn-ghost text-xs !py-1.5">取消</button>
                </div>
              </div>
            )}
          </section>

          {/* ===== 事件线 ===== */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-[9px] bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-inner">
                <Zap size={13} className="text-blue-600" strokeWidth={1.8} />
              </div>
              <h2 className="font-display text-sm font-semibold text-slate-700">事件记录</h2>
              <span className="text-[10px] text-slate-400 tracking-wider">EVENT LINE</span>
              <span className="text-[9px] text-slate-300 font-medium ml-1">{events.length}</span>
            </div>

            {events.length > 0 ? (
              <div className="relative">
                {/* 竖线 */}
                <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-slate-100 rounded" />

                <div className="space-y-0">
                  {events.map((evt, i) => {
                    const isRel = evt.type === 'relationship';
                    const tagStyle = eventTagColors[evt.tag] || eventTagColors['日常'];
                    return (
                      <div key={evt.id} className="relative flex items-start gap-4 group py-3">
                        {/* 节点圆点 */}
                        <div className="relative z-10 shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200
                            ${isRel
                              ? 'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-300 text-violet-500'
                              : 'bg-white border-slate-200 text-slate-400 group-hover:border-blue-300'
                            }`}>
                            {isRel ? <Link2 size={14} /> : <span className="text-[10px] font-bold">T{i}</span>}
                          </div>
                        </div>

                        {/* 事件卡片 */}
                        <div className={`flex-1 bg-white rounded-xl border p-4 transition-all duration-200 group-hover:shadow-sm
                          ${isRel ? 'border-violet-100/80' : 'border-slate-100 group-hover:border-blue-100'}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-800">{evt.title}</span>
                              {evt.tag && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${tagStyle}`}>
                                  {evt.tag}
                                </span>
                              )}
                              {isRel && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-500 border border-violet-200 font-medium">
                                  关系变更
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => removeEvent(evt.id)}
                              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 cursor-pointer transition-all duration-200"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          {evt.desc && <p className="text-xs text-slate-500 leading-relaxed">{evt.desc}</p>}
                          {evt.source === 'ai-scene' && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-200 font-medium">
                                AI · {evt.sceneTitle || '场景分析'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-400 py-8 text-center bg-slate-50/60 rounded-xl border border-slate-100">
                暂无事件记录，点击上方「添加事件」开始记录
              </div>
            )}

            {/* 新增事件表单 */}
            {addingType === 'event' && (
              <div className="mt-3 bg-white rounded-xl border border-blue-200/60 p-4 space-y-3 shadow-sm">
                <div className="text-xs font-medium text-blue-600 mb-1">添加新事件</div>
                <input
                  className="input"
                  placeholder="事件标题"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  autoFocus
                />
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder="事件描述（选填）"
                  value={form.desc}
                  onChange={(e) => setForm({ ...form, desc: e.target.value })}
                />
                <div className="flex items-center gap-2">
                  <select className="input !w-auto" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })}>
                    {Object.keys(eventTagColors).filter((t) => t !== '关系变化').map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <button onClick={addEvent} className="btn btn-primary text-xs !py-1.5">添加</button>
                  <button onClick={() => setAddingType(null)} className="btn btn-ghost text-xs !py-1.5">取消</button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
      </div>
    </div>
  );
}
