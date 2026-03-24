import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';

import CharacterNode from '../components/nodes/CharacterNode';
import RelationshipEdge from '../components/edges/RelationshipEdge';
import CharacterSidebar from '../components/CharacterSidebar';
import CharacterPanel from '../components/panels/CharacterPanel';
import CharacterTimeline from '../components/CharacterTimeline';

const nodeTypes = { character: CharacterNode };
const edgeTypes = { relationship: RelationshipEdge };

export default function CharacterView({ characters, relationships, onUpdateRelationships, onAdd, onUpdate, onDelete }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(relationships);

  /* 当 App 层的 relationships 变化时（如场景推送事件），同步到本地 edges */
  useEffect(() => {
    setEdges(relationships);
  }, [relationships, setEdges]);
  const [selectedCharId, setSelectedCharId] = useState(null);
  const [rfInstance, setRfInstance] = useState(null);
  const lastClickRef = useRef(0);
  /* 时间线视图状态：null = 画布, { edge, source, target } = 时间线 */
  const [timelineView, setTimelineView] = useState(null);

  /* 角色数据 → React Flow 节点同步 */
  useEffect(() => {
    setNodes((prev) => {
      const existing = new Map(prev.map((n) => [n.id, n]));
      return characters.map((c, i) => {
        const old = existing.get(c.id);
        return {
          id: c.id,
          type: 'character',
          position: old?.position || { x: 150 + (i % 3) * 600, y: 120 + Math.floor(i / 3) * 400 },
          data: c,
        };
      });
    });
  }, [characters, setNodes]);

  const selectedChar = useMemo(
    () => characters.find((c) => c.id === selectedCharId),
    [characters, selectedCharId]
  );

  const onConnect = useCallback(
    (params) => {
      if (params.source === params.target) return;
      const label = prompt('请输入人物关系（如：仇敌、朋友、恋人、师徒）');
      if (!label) return;
      const newEdge = { ...params, type: 'relationship', data: { label, relationshipHistory: [{ id: `r-${Date.now()}`, label, desc: '初始关系' }], events: [] } };
      setEdges((eds) => addEdge(newEdge, eds));
      // 同步到 App 层
      onUpdateRelationships((prev) => [...prev, { id: `rel-${Date.now()}`, source: params.source, target: params.target, type: 'relationship', data: newEdge.data }]);
    },
    [setEdges, onUpdateRelationships]
  );

  const onNodeClick = useCallback((_, node) => {
    setSelectedCharId(node.id);
  }, []);

  /* 点击关系线 → 跳转到时间线全页 */
  const onEdgeClick = useCallback(
    (_, edge) => {
      const s = characters.find((c) => c.id === edge.source);
      const t = characters.find((c) => c.id === edge.target);
      setTimelineView({ edge, sourceName: s?.name || '?', targetName: t?.name || '?' });
      setSelectedCharId(null);
    },
    [characters]
  );

  /* 双击画布 → 新建角色 */
  const onPaneClick = useCallback((event) => {
    const now = Date.now();
    if (now - lastClickRef.current < 350 && rfInstance) {
      handleAdd();
    } else {
      setSelectedCharId(null);
    }
    lastClickRef.current = now;
  }, [rfInstance]);

  /* 时间线：添加事件 / 更新 edge data */
  const updateEdgeData = useCallback(
    (edgeId, newData) => {
      const updater = (eds) => eds.map((e) => (e.id === edgeId ? { ...e, data: { ...e.data, ...newData } } : e));
      setEdges(updater);
      onUpdateRelationships(updater);
      setTimelineView((prev) =>
        prev?.edge?.id === edgeId ? { ...prev, edge: { ...prev.edge, data: { ...prev.edge.data, ...newData } } } : prev
      );
    },
    [setEdges, onUpdateRelationships]
  );

  const handleAdd = () => {
    const id = onAdd();
    setSelectedCharId(id);
  };

  /* ===== 画布视图 ===== */
  return (
    <div className="h-full flex">
      <CharacterSidebar
        characters={characters}
        selectedId={selectedCharId}
        onSelect={(id) => setSelectedCharId(id)}
        onAdd={handleAdd}
        onDelete={onDelete}
      />

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          onInit={setRfInstance}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.4 }}
          defaultEdgeOptions={{ type: 'smoothstep' }}
          connectionLineStyle={{ stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '6 3' }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#d4d8e0" gap={28} size={1} variant="dots" />
          <Controls position="bottom-left" />
        </ReactFlow>

        {/* 浮层面板（覆盖画布右侧，不压缩画布空间） */}
        {selectedChar && (
          <div className="absolute top-0 right-0 h-full w-[380px] z-20 flex flex-col bg-white/90 backdrop-blur-xl border-l border-slate-200/50 shadow-2xl shadow-slate-900/[0.06] slide-in-right">
            {/* 角色快捷切换 */}
            <div className="shrink-0 px-3 pt-3 pb-0">
              <select
                className="input !text-xs !py-1.5 !px-2.5 !bg-slate-50/80 !border-slate-200/60 !rounded-lg"
                value={selectedCharId || ''}
                onChange={(e) => setSelectedCharId(e.target.value)}
              >
                {characters.map((c) => {
                  const activeRole = (c.phases?.find((p) => p.id === c.activePhase) || c.phases?.[0])?.role;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name}{activeRole ? ` — ${activeRole}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              <CharacterPanel
                character={selectedChar}
                onUpdate={(data) => onUpdate(selectedChar.id, data)}
                onClose={() => setSelectedCharId(null)}
              />
            </div>
          </div>
        )}

        {/* 关系时间线弹窗 */}
        {timelineView && (
          <CharacterTimeline
            edge={timelineView.edge}
            sourceName={timelineView.sourceName}
            targetName={timelineView.targetName}
            onUpdateEdgeData={(data) => updateEdgeData(timelineView.edge.id, data)}
            onBack={() => setTimelineView(null)}
          />
        )}
      </div>
    </div>
  );
}
