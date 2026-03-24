import { Handle, Position } from 'reactflow';
import { Video, Loader2, CheckCircle2, Play, ImageIcon } from 'lucide-react';

const statusMap = {
  idle:       { label: '待生成', cls: 'text-slate-400 bg-slate-50 border-slate-200/60', icon: null },
  generating: { label: '生成中…', cls: 'text-violet-600 bg-violet-50 border-violet-200/60', icon: Loader2 },
  done:       { label: '已完成', cls: 'text-emerald-600 bg-emerald-50 border-emerald-200/60', icon: CheckCircle2 },
};

export default function VideoNode({ data, selected }) {
  const st = statusMap[data.status] || statusMap.idle;
  const StatusIcon = st.icon;
  const sceneName = data.sceneName || null;

  return (
    <div className={`bp-node video-node ${selected ? 'selected' : ''}`} style={{ width: 260 }}>
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="target" position={Position.Left} id="left" />

      {/* 16:9 预览区 */}
      <div className="w-full aspect-video rounded-t-[11px] bg-gradient-to-br from-slate-100 to-violet-50/40 flex items-center justify-center overflow-hidden relative">
        {data.status === 'generating' ? (
          <div className="text-center">
            <Loader2 size={22} className="text-violet-400 mx-auto mb-1 animate-spin" />
            <div className="text-[10px] text-violet-500 font-medium">生成中…</div>
          </div>
        ) : data.videoUrl ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-violet-100/60 to-indigo-100/40" />
            <div className="relative w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-lg shadow-violet-200/40 flex items-center justify-center">
              <Play size={15} className="text-violet-600 ml-0.5" />
            </div>
          </>
        ) : (
          <div className="text-center">
            <Video size={18} className="text-slate-250 mx-auto mb-1" />
            <div className="text-[9px] text-slate-350 font-medium">待配置</div>
          </div>
        )}
        {/* 状态角标 */}
        <div className={`absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 text-[8px] font-semibold px-1.5 py-[3px] rounded-full border ${st.cls}`}>
          {StatusIcon && <StatusIcon size={8} className={data.status === 'generating' ? 'animate-spin' : ''} />}
          {st.label}
        </div>
      </div>

      {/* 信息区 */}
      <div className="px-3 pt-2.5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-100 to-purple-50 flex items-center justify-center shrink-0">
            <Video size={10} className="text-violet-600" strokeWidth={2} />
          </div>
          <div className="font-display text-[13px] font-semibold text-slate-800 truncate leading-tight">{data.title || '未命名视频'}</div>
        </div>

        {sceneName && (
          <div className="flex items-center gap-1 mt-1.5">
            <ImageIcon size={8} className="text-emerald-400 shrink-0" />
            <span className="text-[9px] text-emerald-600/80 font-medium truncate">{sceneName}</span>
          </div>
        )}

        {data.script && !sceneName && (
          <div className="text-[10px] text-slate-400 line-clamp-1 leading-relaxed mt-1">{data.script}</div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Right} id="right" />
    </div>
  );
}
