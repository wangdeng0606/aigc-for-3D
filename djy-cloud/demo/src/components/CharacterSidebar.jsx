import { Plus, User, Trash2, ChevronRight } from 'lucide-react';

export default function CharacterSidebar({ characters, selectedId, onSelect, onAdd, onDelete }) {
  return (
    <div className="w-[220px] ml-3 my-3 bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 flex flex-col shrink-0 shadow-sm shadow-slate-900/[0.03] overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <span className="font-display text-[13px] font-semibold text-slate-700">角色</span>
          <span className="ml-1.5 text-[10px] text-slate-400 font-medium">{characters.length}</span>
        </div>
        <button
          onClick={onAdd}
          title="添加角色"
          className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center
                     hover:bg-amber-100 hover:shadow-sm hover:shadow-amber-200/30
                     cursor-pointer transition-all duration-200 active:scale-95"
        >
          <Plus size={14} strokeWidth={2.2} />
        </button>
      </div>

      <div className="mx-3 mb-2 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2.5 pb-3 space-y-1">
        {characters.map((c) => {
          const active = selectedId === c.id;
          const phase = c.phases?.find((p) => p.id === c.activePhase) || c.phases?.[0];
          return (
            <div
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`group flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-left cursor-pointer transition-all duration-200
                ${active
                  ? 'bg-gradient-to-r from-amber-50 to-orange-50/40 shadow-sm shadow-amber-100/40 border border-amber-200/40'
                  : 'border border-transparent hover:bg-slate-50/80 hover:border-slate-100'
                }`}
            >
              <div
                className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 transition-all duration-200
                  ${active
                    ? 'bg-gradient-to-br from-amber-100 to-orange-100 shadow-inner'
                    : 'bg-slate-100 group-hover:bg-slate-200/60'}`}
              >
                <User size={14} className={active ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-500'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-[13px] font-medium truncate ${active ? 'text-amber-800' : 'text-slate-600'}`}>{c.name}</div>
                <div className={`text-[10px] truncate mt-0.5 ${active ? 'text-amber-500/70' : 'text-slate-400'}`}>
                  {c.gender}{phase?.role ? ` · ${phase.role}` : ''}
                </div>
              </div>
              {active ? (
                <ChevronRight size={13} className="text-amber-400/60 shrink-0" />
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                  title="删除角色"
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-300 hover:text-red-400 hover:bg-red-50
                             cursor-pointer transition-all duration-200 shrink-0"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          );
        })}

        {characters.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 select-none">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
              <User size={18} className="text-slate-300" />
            </div>
            <div className="text-[11px] text-slate-400">双击画布或点击上方 + 添加角色</div>
          </div>
        )}
      </div>
    </div>
  );
}
