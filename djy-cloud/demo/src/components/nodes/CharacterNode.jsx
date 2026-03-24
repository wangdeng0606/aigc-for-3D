import { Handle, Position } from 'reactflow';
import { User, Layers } from 'lucide-react';

export default function CharacterNode({ data, selected }) {
  const phases = data.phases || [];
  const active = phases.find((p) => p.id === data.activePhase) || phases[0];
  const activeRef = active?.refSets?.find((r) => r.id === active.activeRefSet) || active?.refSets?.[0];
  const frontImg = activeRef?.images?.front;

  return (
    <div className={`bp-node char-node ${selected ? 'selected' : ''}`}>
      <div className="corner-dot tl" />
      <div className="corner-dot tr" />
      <div className="corner-dot bl" />
      <div className="corner-dot br" />

      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="target" position={Position.Top} id="top" />

      <div className="px-[18px] pt-[18px] pb-[16px]">
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <div
              className="w-[48px] h-[48px] rounded-[14px] flex items-center justify-center overflow-hidden ring-2 ring-amber-200/40 ring-offset-1"
              style={{
                background: frontImg ? '#fff' : 'linear-gradient(135deg, #fcd34d, #f59e0b)',
                boxShadow: '0 4px 12px rgba(245,158,11,0.15)',
              }}
            >
              {frontImg ? (
                <img src={frontImg} alt={`${data.name || '角色'}正面参考图`} className="w-full h-full object-cover" />
              ) : (
                <User size={22} className="text-white drop-shadow" />
              )}
            </div>
          </div>
          <div className="min-w-0">
            <div className="font-display font-semibold text-slate-800 text-[15px] leading-tight truncate">
              {data.name || '未命名'}
            </div>
            <div className="text-[11px] font-medium text-slate-400 mt-1">{data.gender}</div>
            {active?.label && (
              <div className="flex items-center gap-1 mt-1.5">
                <Layers size={9} className="text-amber-400" />
                <span className="text-[10px] font-medium text-amber-600/70 bg-amber-50 px-1.5 py-0.5 rounded-md">{active.label}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
    </div>
  );
}
