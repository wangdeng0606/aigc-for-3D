import { Handle, Position } from 'reactflow';
import { ImageIcon, Sparkles, Users } from 'lucide-react';

export default function SceneNode({ data, selected }) {
  return (
    <div className={`bp-node scene-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="target" position={Position.Left} id="left" />

      <div className="px-4 pt-4 pb-3.5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-[9px] bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center shadow-inner shrink-0">
            <ImageIcon size={13} className="text-emerald-600" strokeWidth={1.8} />
          </div>
          <div className="font-display text-[14px] font-semibold text-slate-800 truncate">{data.title || '未命名场景'}</div>
        </div>

        <div className="w-full h-28 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-100 mb-3 flex items-center justify-center overflow-hidden">
          {data.image ? (
            <img src={data.image} alt={`${data.title || '场景'}参考图`} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <div className="w-9 h-9 rounded-xl bg-white/80 shadow-sm mx-auto mb-1.5 flex items-center justify-center">
                <ImageIcon size={16} className="text-slate-300" />
              </div>
              <div className="text-[10px] text-slate-400 font-medium">点击右侧面板配置</div>
            </div>
          )}
        </div>

        {data.keywords && (
          <div className="flex items-start gap-1.5 mb-2.5">
            <Sparkles size={10} className="text-emerald-400 mt-0.5 shrink-0" />
            <div className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{data.keywords}</div>
          </div>
        )}

        {data.characterIds?.length > 0 && (
          <div className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
            <Users size={10} />
            <span>{data.characterIds.length} 个角色</span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Right} id="right" />
    </div>
  );
}
