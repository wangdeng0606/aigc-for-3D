import { ImagePlus, VideoIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function NodeMenu({ position, onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-white/90 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-xl shadow-slate-900/[0.08] p-2 min-w-[200px] fade-up"
      style={{ left: position.screenX, top: position.screenY - 48 }}
    >
      <div className="px-2.5 pt-1 pb-2 text-[9px] text-slate-400 uppercase tracking-widest font-semibold select-none">新建节点</div>
      <button
        onClick={() => onSelect('scene')}
        className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-[13px] font-medium
                   text-emerald-700 hover:bg-emerald-50/80
                   cursor-pointer transition-all duration-200 active:scale-[0.98]"
      >
        <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center shadow-inner shrink-0">
          <ImagePlus size={14} strokeWidth={1.8} />
        </div>
        <div className="text-left">
          <div className="leading-tight">场景节点</div>
          <div className="text-[9px] text-emerald-500/60 font-normal mt-0.5">场景图 & 关键词</div>
        </div>
      </button>
      <button
        onClick={() => onSelect('video')}
        className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-[13px] font-medium
                   text-violet-700 hover:bg-violet-50/80
                   cursor-pointer transition-all duration-200 active:scale-[0.98]"
      >
        <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-violet-100 to-purple-50 flex items-center justify-center shadow-inner shrink-0">
          <VideoIcon size={14} strokeWidth={1.8} />
        </div>
        <div className="text-left">
          <div className="leading-tight">视频节点</div>
          <div className="text-[9px] text-violet-500/60 font-normal mt-0.5">分镜 & 视频生成</div>
        </div>
      </button>
    </div>
  );
}
