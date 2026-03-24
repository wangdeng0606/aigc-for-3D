import { useState } from 'react';
import { Plus, ImageIcon, Trash2, Camera } from 'lucide-react';
import SceneManagePanel from '../components/panels/SceneManagePanel';

export default function SceneManageView({ scenes, characters, onAddScene, onUpdateScene, onDeleteScene }) {
  const [selectedId, setSelectedId] = useState(scenes[0]?.id || null);
  const selected = scenes.find((s) => s.id === selectedId) || null;

  const handleAdd = () => {
    const id = onAddScene();
    setSelectedId(id);
  };

  const handleDelete = (id) => {
    onDeleteScene(id);
    if (selectedId === id) setSelectedId(scenes.find((s) => s.id !== id)?.id || null);
  };

  const imgCount = (s) => (s.images || []).length;

  return (
    <div className="h-full flex">
      {/* 左侧：场景列表 */}
      <div className="w-[280px] ml-3 my-3 bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 flex flex-col shrink-0 shadow-sm shadow-slate-900/[0.03] overflow-hidden">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[9px] bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shadow-inner">
              <ImageIcon size={13} className="text-emerald-600" strokeWidth={1.8} />
            </div>
            <span className="font-display text-[13px] font-semibold text-slate-700">场景列表</span>
            <span className="text-[9px] text-slate-400 font-medium">{scenes.length}</span>
          </div>
          <button
            onClick={handleAdd}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-500 hover:bg-emerald-50 cursor-pointer transition-all duration-200"
            title="新建场景"
          >
            <Plus size={15} />
          </button>
        </div>

        <div className="mx-3 mb-2 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />

        <div className="flex-1 overflow-y-auto px-2.5 pb-3 space-y-1.5">
          {scenes.map((s) => {
            const isActive = selectedId === s.id;
            return (
              <div
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`group relative rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden
                  ${isActive
                    ? 'border-emerald-200/60 bg-gradient-to-r from-emerald-50/60 to-teal-50/30 shadow-sm shadow-emerald-100/30'
                    : 'border-slate-200/60 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
              >
                {/* 预览区 */}
                <div className="h-24 bg-gradient-to-br from-slate-50 to-slate-100/50 flex items-center justify-center overflow-hidden">
                  {(s.images || []).length > 0 ? (
                    <img src={s.images[0].url} className="w-full h-full object-cover" alt={s.name} />
                  ) : (
                    <div className="text-center">
                      <ImageIcon size={18} className="text-slate-200 mx-auto mb-1" />
                      <div className="text-[9px] text-slate-300">暂无场景图</div>
                    </div>
                  )}
                </div>

                {/* 信息 */}
                <div className="px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-semibold text-slate-700 truncate">{s.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                      className="p-0.5 rounded-md text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                      title="删除场景"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-slate-400">
                    <span className="flex items-center gap-0.5">
                      <Camera size={8} /> {imgCount(s)} 张
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {scenes.length === 0 && (
            <div className="flex flex-col items-center py-12 select-none">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                <ImageIcon size={18} className="text-slate-300" />
              </div>
              <div className="text-[11px] text-slate-400 mb-3">还没有场景</div>
              <button onClick={handleAdd} className="btn btn-primary !text-[11px] !py-1.5 !px-4">
                <Plus size={12} /> 创建第一个场景
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 右侧：场景详情面板 */}
      <div className="flex-1 my-3 mr-3 ml-3">
        {selected ? (
          <div className="h-full bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-sm shadow-slate-900/[0.03] overflow-hidden">
            <SceneManagePanel
              scene={selected}
              onUpdate={(data) => onUpdateScene(selected.id, data)}
              onClose={() => setSelectedId(null)}
            />
          </div>
        ) : (
          <div className="h-full bg-white/50 backdrop-blur-xl rounded-2xl border border-dashed border-slate-200/80 flex items-center justify-center">
            <div className="text-center select-none">
              <ImageIcon size={32} className="text-slate-200 mx-auto mb-3" />
              <div className="text-[13px] text-slate-400 font-medium">选择左侧场景查看详情</div>
              <div className="text-[10px] text-slate-300 mt-1">或点击 + 创建新场景</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
