import { useState, useCallback, useRef, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';

import VideoNode from '../components/nodes/VideoNode';
import SceneEdge from '../components/edges/SceneEdge';
import VideoProductionPanel from '../components/panels/VideoProductionPanel';
import { Video, Play, ListVideo, ChevronRight, CheckCircle2, Circle } from 'lucide-react';

const nodeTypes = { video: VideoNode };
const edgeTypes = { sceneFlow: SceneEdge };

function defaultVideoData() {
  return {
    title: '新视频片段',
    sceneId: null,
    sceneName: null,
    characterIds: [],
    script: '',
    backgroundSetting: '',
    storyboard: '',
    videoUrl: null,
    status: 'idle',
  };
}

const DEMO_INITIAL_NODES = [
  {
    id: 'video-1',
    type: 'video',
    position: { x: 200, y: 80 },
    data: {
      title: '竹林对决·开场',
      sceneId: 'scene-1',
      sceneName: '竹林对决',
      characterIds: ['char-1', 'char-2'],
      script: '月光下的竹林，沈逸风与楚夜寒持剑对峙，风吹竹叶沙沙作响。',
      backgroundSetting: '月光竹林，对峙，风吹竹叶，萧瑟夜色',
      storyboard: '【全景】月光竹林，两人登场。\n【中景】双方拔剑，气氛紧张。\n【近景】人物面部特写，杀意凝聚。',
      videoUrl: null,
      status: 'idle',
    },
  },
];

export default function VideoProductionView({ scenes, characters, relationships, onPushEvents, onUpdateCharacter }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(DEMO_INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [rfInstance, setRfInstance] = useState(null);
  const idCounter = useRef(100);
  const lastClickRef = useRef(0);
  const [playingRoute, setPlayingRoute] = useState(null);

  /* 添加视频节点 */
  const addVideoNode = useCallback((position) => {
    const id = `video-${++idCounter.current}`;
    const newNode = {
      id,
      type: 'video',
      position: position || { x: 120 + Math.random() * 300, y: 60 + Math.random() * 300 },
      data: defaultVideoData(),
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNode(newNode);
  }, [setNodes]);

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({ ...params, type: 'sceneFlow', data: { label: '下一段' } }, eds));
  }, [setEdges]);

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
  }, []);

  /* 双击画布 → 新建视频节点 */
  const onPaneClick = useCallback((event) => {
    const now = Date.now();
    if (now - lastClickRef.current < 350 && rfInstance) {
      const pos = rfInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addVideoNode(pos);
    } else {
      setSelectedNode(null);
    }
    lastClickRef.current = now;
  }, [rfInstance, addVideoNode]);

  const updateNodeData = useCallback((nodeId, newData) => {
    // 当 sceneId 变化时，同步 sceneName
    if (newData.sceneId !== undefined) {
      const scene = scenes.find((s) => s.id === newData.sceneId);
      newData.sceneName = scene?.name || null;
    }
    setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n)));
    setSelectedNode((prev) => (prev?.id === nodeId ? { ...prev, data: { ...prev.data, ...newData } } : prev));
  }, [setNodes, scenes]);

  const deleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode((prev) => (prev?.id === nodeId ? null : prev));
  }, [setNodes, setEdges]);

  /* ===== 智能线路检测 ===== */
  const buildRouteFrom = useCallback((startId) => {
    const route = [startId];
    let current = startId;
    const visited = new Set([current]);
    while (true) {
      const next = edges.find((e) => e.source === current && !visited.has(e.target));
      if (!next) break;
      route.push(next.target);
      visited.add(next.target);
      current = next.target;
    }
    return route;
  }, [edges]);

  const findRouteStart = useCallback((nodeId) => {
    let current = nodeId;
    const visited = new Set([current]);
    while (true) {
      const prev = edges.find((e) => e.target === current && !visited.has(e.source));
      if (!prev) break;
      current = prev.source;
      visited.add(current);
    }
    return current;
  }, [edges]);

  /* 检测所有独立线路（chains），每条线路 = 从无入度起点沿 source→target 走到底 */
  const routes = useMemo(() => {
    if (nodes.length === 0) return [];
    // 找所有没有入度的节点作为起点
    const hasIncoming = new Set(edges.map((e) => e.target));
    const startIds = nodes.map((n) => n.id).filter((id) => !hasIncoming.has(id));
    // 对每个起点构建链路
    const result = [];
    const visited = new Set();
    for (const sid of startIds) {
      if (visited.has(sid)) continue;
      const chain = buildRouteFrom(sid);
      chain.forEach((id) => visited.add(id));
      const chainNodes = chain.map((id) => nodes.find((n) => n.id === id)).filter(Boolean);
      if (chainNodes.length > 0) {
        const doneCount = chainNodes.filter((n) => n.data?.videoUrl).length;
        result.push({ id: sid, nodes: chainNodes, doneCount });
      }
    }
    // 孤立节点（不在任何链中）
    for (const n of nodes) {
      if (!visited.has(n.id)) {
        result.push({ id: n.id, nodes: [n], doneCount: n.data?.videoUrl ? 1 : 0 });
      }
    }
    return result;
  }, [nodes, edges, buildRouteFrom]);

  /* 播放某条线路 */
  const playRoute = useCallback((route) => {
    const videos = route.nodes.filter((n) => n.data?.videoUrl);
    if (videos.length === 0) return;
    setPlayingRoute({ videos, current: 0 });
  }, []);

  /* 获取前一个视频节点 */
  const getPrevVideo = useCallback((nodeId) => {
    const prevEdge = edges.find((e) => e.target === nodeId);
    if (!prevEdge) return null;
    const prevNode = nodes.find((n) => n.id === prevEdge.source);
    return prevNode?.data?.videoUrl ? prevNode : null;
  }, [edges, nodes]);

  return (
    <div className="h-full flex">
      {/* 左侧：可播放片段 */}
      <div className="w-[230px] ml-3 my-3 bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 flex flex-col shrink-0 shadow-sm shadow-slate-900/[0.03] overflow-hidden">
        {/* 线路列表 */}
        <div className="px-3 pt-3 pb-1.5 flex items-center gap-1.5">
          <ListVideo size={11} className="text-violet-500" />
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">播放线路</span>
          <span className="text-[9px] text-slate-300 font-medium ml-auto">{routes.length} 条</span>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 pb-3 space-y-2">
          {routes.map((route, ri) => {
            const canPlay = route.doneCount > 0;
            return (
              <div key={route.id} className="rounded-xl border border-slate-200/60 bg-white overflow-hidden">
                {/* 线路头 */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-50/80 to-slate-50/30">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0
                    ${canPlay ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-400'}`}>
                    {ri + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-slate-700 truncate">
                      {route.nodes[0]?.data?.title || '未命名线路'}
                      {route.nodes.length > 1 && <span className="text-slate-400"> → …</span>}
                    </div>
                    <div className="text-[9px] text-slate-400">{route.doneCount}/{route.nodes.length} 已完成</div>
                  </div>
                  {canPlay && (
                    <button
                      onClick={() => playRoute(route)}
                      className="w-6 h-6 rounded-lg bg-violet-500 text-white flex items-center justify-center hover:bg-violet-400 transition-colors cursor-pointer shrink-0 shadow-sm shadow-violet-200/40"
                      title="播放此线路"
                    >
                      <Play size={10} className="ml-0.5" />
                    </button>
                  )}
                </div>
                {/* 片段列表 */}
                <div className="px-2 pb-2 pt-1 space-y-0.5">
                  {route.nodes.map((n, ni) => {
                    const isDone = !!n.data?.videoUrl;
                    const isSelected = selectedNode?.id === n.id;
                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          setSelectedNode(n);
                          rfInstance?.fitView({ nodes: [{ id: n.id }], duration: 300, padding: 1 });
                        }}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] cursor-pointer transition-all duration-150
                          ${isSelected
                            ? 'bg-violet-50 text-violet-700 font-medium'
                            : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                        {isDone
                          ? <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
                          : <Circle size={10} className="text-slate-300 shrink-0" />}
                        <span className="truncate flex-1">{n.data?.title || '未命名'}</span>
                        {ni < route.nodes.length - 1 && <ChevronRight size={8} className="text-slate-300 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {routes.length === 0 && (
            <div className="text-center py-8 select-none">
              <ListVideo size={20} className="text-slate-200 mx-auto mb-2" />
              <div className="text-[10px] text-slate-400">添加视频节点并用连线串联</div>
              <div className="text-[9px] text-slate-300 mt-0.5">自动检测播放线路</div>
            </div>
          )}
        </div>
      </div>

      {/* 画布 */}
      <div className="flex-1 relative flex flex-col">
        <div className="flex-1 min-h-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={onPaneClick}
          onNodeClick={onNodeClick}
          onInit={setRfInstance}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.35 }}
          defaultEdgeOptions={{ type: 'smoothstep' }}
          connectionLineStyle={{ stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '6 3' }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#d4d8e0" gap={28} size={1} variant="dots" />
          <Controls position="bottom-left" />
          <MiniMap
            nodeColor={() => '#8b5cf618'}
            nodeStrokeColor={() => '#8b5cf6'}
            maskColor="#f3f4f8cc"
          />
        </ReactFlow>

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center select-none">
              <Video size={40} className="text-slate-200 mx-auto mb-3" />
              <div className="text-[14px] text-slate-400 font-medium mb-1">开始制作视频</div>
              <div className="text-[11px] text-slate-300">双击画布空白处创建视频节点</div>
              <div className="text-[11px] text-slate-300 mt-1">连接节点形成线路 → 左侧自动编排播放顺序</div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* 右侧面板 */}
      {selectedNode && (
        <div className="w-[380px] bg-white/90 backdrop-blur-xl border-l border-slate-200/50 shadow-2xl shadow-slate-900/[0.06] overflow-y-auto slide-in-right">
          <VideoProductionPanel
            node={selectedNode}
            scenes={scenes}
            characters={characters}
            prevVideo={getPrevVideo(selectedNode.id)}
            relationships={relationships}
            onPushEvents={onPushEvents}
            onUpdateCharacter={onUpdateCharacter}
            onUpdate={(data) => updateNodeData(selectedNode.id, data)}
            onDelete={() => deleteNode(selectedNode.id)}
            onClose={() => setSelectedNode(null)}
          />
        </div>
      )}

      {/* 线路播放浮层 */}
      {playingRoute && (
        <div className="fixed inset-0 z-[999] bg-black/90 flex flex-col items-center justify-center">
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <div className="text-white/60 text-[12px]">
              {playingRoute.current + 1} / {playingRoute.videos.length}
            </div>
            <button
              onClick={() => setPlayingRoute(null)}
              className="text-white/60 hover:text-white text-[13px] px-3 py-1.5 rounded-lg border border-white/20 hover:border-white/40 transition-colors cursor-pointer"
            >
              退出播放
            </button>
          </div>

          <div className="text-white/80 text-[14px] font-medium mb-4">
            {playingRoute.videos[playingRoute.current]?.data?.title || '未命名视频'}
          </div>

          <div className="w-[70vw] max-w-[900px] aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
            <video
              key={playingRoute.videos[playingRoute.current]?.id}
              src={playingRoute.videos[playingRoute.current]?.data?.videoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
              onEnded={() => {
                if (playingRoute.current < playingRoute.videos.length - 1) {
                  setPlayingRoute((prev) => ({ ...prev, current: prev.current + 1 }));
                }
              }}
            />
          </div>

          <div className="mt-6 flex items-center gap-2 flex-wrap justify-center">
            {playingRoute.videos.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setPlayingRoute((prev) => ({ ...prev, current: i }))}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer
                  ${i === playingRoute.current
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                    : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/80'
                  }`}
              >
                {i + 1}. {v.data?.title || '片段'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
