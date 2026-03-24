import { Clapperboard, Users, Film, Video } from 'lucide-react';

export default function NavBar({ tab, onTabChange }) {
  const tabs = [
    { key: 'character', label: '角色管理', icon: Users,
      active: 'text-amber-700 bg-gradient-to-b from-amber-50 to-orange-50/60 shadow-sm shadow-amber-200/40 border-amber-200/60',
      idle: 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/80' },
    { key: 'scene', label: '场景管理', icon: Film,
      active: 'text-emerald-700 bg-gradient-to-b from-emerald-50 to-teal-50/60 shadow-sm shadow-emerald-200/40 border-emerald-200/60',
      idle: 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/80' },
    { key: 'video', label: '视频制作', icon: Video,
      active: 'text-violet-700 bg-gradient-to-b from-violet-50 to-purple-50/60 shadow-sm shadow-violet-200/40 border-violet-200/60',
      idle: 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/80' },
  ];

  return (
    <header className="mx-4 mt-3 h-[52px] bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 flex items-center px-4 shrink-0 shadow-sm shadow-slate-900/[0.03]">
      {/* Brand */}
      <div className="flex items-center gap-3 mr-8 select-none">
        <div className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-300/30">
          <Clapperboard size={16} className="text-white drop-shadow" />
        </div>
        <div className="leading-none">
          <span className="font-display text-[16px] font-semibold text-slate-800 tracking-wide">短剧园</span>
          <span className="block text-[9px] text-slate-400 font-medium tracking-widest mt-0.5">DJY STUDIO</span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-slate-200/70 mr-4" />

      {/* Tabs */}
      <nav className="flex items-center gap-1.5" role="tablist">
        {tabs.map(({ key, label, icon: Icon, active: activeCls, idle }) => {
          const isActive = tab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(key)}
              className={`flex items-center gap-2 px-4 py-[7px] rounded-[10px] text-[13px] font-medium cursor-pointer border transition-all duration-250
                ${isActive ? activeCls : `border-transparent ${idle}`}`}
            >
              <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
              {label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
