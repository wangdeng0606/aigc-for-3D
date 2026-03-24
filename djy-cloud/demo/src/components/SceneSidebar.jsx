import { ImagePlus, VideoIcon, User } from 'lucide-react';

export default function SceneSidebar({ characters, onAddScene, onAddVideo }) {
  return (
    <div className="w-[220px] ml-3 my-3 bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 flex flex-col shrink-0 shadow-sm shadow-slate-900/[0.03] overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <span className="font-display text-[13px] font-semibold text-slate-700">画布工具</span>
      </div>

      <div className="mx-3 mb-3 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />

      {/* Tool Cards */}
      <div className="px-3 space-y-2 mb-4">
        <button
          onClick={onAddScene}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                     text-emerald-700 bg-emerald-50/50 border border-emerald-100/60
                     hover:bg-emerald-50 hover:border-emerald-200/60 hover:shadow-sm hover:shadow-emerald-100/30
                     cursor-pointer transition-all duration-200 active:scale-[0.98]"
        >
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shadow-inner">
            <ImagePlus size={15} strokeWidth={1.8} />
          </div>
          <div className="text-left">
            <div className="leading-tight">新建场景</div>
            <div className="text-[9px] text-emerald-500/70 font-normal mt-0.5">添加场景图节点</div>
          </div>
        </button>
        <button
          onClick={onAddVideo}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                     text-violet-700 bg-violet-50/50 border border-violet-100/60
                     hover:bg-violet-50 hover:border-violet-200/60 hover:shadow-sm hover:shadow-violet-100/30
                     cursor-pointer transition-all duration-200 active:scale-[0.98]"
        >
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center shadow-inner">
            <VideoIcon size={15} strokeWidth={1.8} />
          </div>
          <div className="text-left">
            <div className="leading-tight">新建视频</div>
            <div className="text-[9px] text-violet-500/70 font-normal mt-0.5">添加视频分镜节点</div>
          </div>
        </button>
      </div>

      {/* Tip */}
      <div className="px-3 mb-4">
        <div className="text-[10px] text-slate-400 bg-slate-50/80 border border-slate-100/60 rounded-lg px-3 py-2 leading-relaxed">
          双击画布空白区域也可快速添加节点
        </div>
      </div>

      {/* Characters */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="font-display text-[12px] font-semibold text-slate-600">可用角色</span>
          <span className="text-[9px] text-slate-400 font-medium">{characters.length}</span>
        </div>
      </div>
      <div className="mx-3 mb-2 h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />
      <div className="flex-1 overflow-y-auto px-2.5 pb-3 space-y-0.5">
        {characters.map((c) => (
          <div key={c.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-500 text-[12px] hover:bg-slate-50/60 transition-colors duration-150">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
              <User size={11} className="text-amber-500" />
            </div>
            <span className="font-medium">{c.name}</span>
          </div>
        ))}
        {characters.length === 0 && (
          <div className="flex flex-col items-center py-6 select-none">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center mb-2">
              <User size={14} className="text-slate-300" />
            </div>
            <div className="text-[10px] text-slate-400">请先添加角色</div>
          </div>
        )}
      </div>
    </div>
  );
}
