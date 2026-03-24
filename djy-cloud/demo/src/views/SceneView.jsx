import { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';

import SceneNode from '../components/nodes/SceneNode';
import VideoNode from '../components/nodes/VideoNode';
import SceneEdge from '../components/edges/SceneEdge';
import SceneSidebar from '../components/SceneSidebar';
import ScenePanel from '../components/panels/ScenePanel';
import VideoPanel from '../components/panels/VideoPanel';
import NodeMenu from '../components/NodeMenu';
import sceneImg from '../dist/竹林对决图.png';

const nodeTypes = { scene: SceneNode, video: VideoNode };
const edgeTypes = { sceneFlow: SceneEdge };

const demoSceneNodes = [
  {
    id: 'scene-1',
    type: 'scene',
    position: { x: 200, y: 80 },
    data: {
      title: '竹林对决',
      image: sceneImg,
      keywords: '月光下的竹林，两人持剑对峙，风吹竹叶',
      editKeywords: '',
      characterIds: ['char-1', 'char-2'],
      characterConfigs: { 'char-1': { phaseId: null, refSetId: null }, 'char-2': { phaseId: null, refSetId: null } },
    },
  },
  {
    id: 'video-1',
    type: 'video',
    position: { x: 200, y: 480 },
    data: {
      title: '第一幕：竹林夜战',
      script: '沈逸风持剑质问楚夜寒杀师之仇，楚夜寒冷笑回应，两人拔剑交锋',
      backgroundSetting: '深夜竹林，月光映照，风吹竹叶萧瑟，紧张对峙气氛',
      storyboard: '镜头从竹林全景缓缓推进，沈逸风持剑而立，楚夜寒从暗处跃出，两人激烈交锋三招',
      videoUrl: null,
      status: 'idle',
    },
  },
];

const demoSceneEdges = [
  {
    id: 'flow-1',
    source: 'scene-1',
    target: 'video-1',
    sourceHandle: 'bottom',
    type: 'sceneFlow',
    data: { label: '生成' },
  },
];

function defaultSceneData(type) {
  if (type === 'scene') {
    return { title: '新场景', image: null, keywords: '', editKeywords: '', characterIds: [] };
  }
  return { title: '新视频', script: '', backgroundSetting: '', storyboard: '', videoUrl: null, status: 'idle' };
}

export default function SceneView({ characters, relationships, onPushEvents, onUpdateCharacter }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(demoSceneNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(demoSceneEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [menuPos, setMenuPos] = useState(null);
  const [rfInstance, setRfInstance] = useState(null);
  const lastClickRef = useRef(0);
  const idCounter = useRef(100);

  const charList = characters.map((c) => ({ id: c.id, name: c.name }));

  /* 双击画布 → 弹出菜单 */
  const onPaneClick = useCallback(
    (event) => {
      const now = Date.now();
      if (now - lastClickRef.current < 350 && rfInstance) {
        const pos = rfInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
        setMenuPos({ screenX: event.clientX, screenY: event.clientY, flowX: pos.x, flowY: pos.y });
      } else {
        setMenuPos(null);
        setSelectedNode(null);
      }
      lastClickRef.current = now;
    },
    [rfInstance]
  );

  const addNode = useCallback(
    (type, position) => {
      const id = `${type}-${++idCounter.current}`;
      const newNode = { id, type, position: position || { x: 200, y: 200 }, data: defaultSceneData(type) };
      setNodes((nds) => [...nds, newNode]);
      setMenuPos(null);
      setSelectedNode(newNode);
    },
    [setNodes]
  );

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) =>
        addEdge({ ...params, type: 'sceneFlow', data: { label: '连接' } }, eds)
      );
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
    setMenuPos(null);
  }, []);

  const updateNodeData = useCallback(
    (nodeId, newData) => {
      setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n)));
      setSelectedNode((prev) => (prev?.id === nodeId ? { ...prev, data: { ...prev.data, ...newData } } : prev));
    },
    [setNodes]
  );

  return (
    <div className="h-full flex">
      {/* 左侧工具栏 */}
      <SceneSidebar
        characters={charList}
        onAddScene={() => addNode('scene', { x: 120 + Math.random() * 200, y: 60 + Math.random() * 200 })}
        onAddVideo={() => addNode('video', { x: 120 + Math.random() * 200, y: 360 + Math.random() * 200 })}
      />

      {/* 画布 */}
      <div className="flex-1 relative">
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
          connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '6 3' }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#d4d8e0" gap={28} size={1} variant="dots" />
          <Controls position="bottom-left" />
          <MiniMap
            nodeStrokeColor={(n) => (n.type === 'scene' ? '#10b981' : '#8b5cf6')}
            nodeColor={(n) => (n.type === 'scene' ? '#10b98118' : '#8b5cf618')}
            maskColor="#f3f4f8cc"
          />
        </ReactFlow>

        {menuPos && (
          <NodeMenu
            position={menuPos}
            onSelect={(type) => addNode(type, { x: menuPos.flowX, y: menuPos.flowY })}
            onClose={() => setMenuPos(null)}
          />
        )}
      </div>

      {/* 右侧面板 */}
      {selectedNode && (
        <div className="w-[380px] bg-white/90 backdrop-blur-xl border-l border-slate-200/50 shadow-2xl shadow-slate-900/[0.06] overflow-y-auto slide-in-right">
          {selectedNode.type === 'scene' && (
            <ScenePanel
              node={selectedNode}
              characters={characters}
              onUpdate={(data) => updateNodeData(selectedNode.id, data)}
              onClose={() => setSelectedNode(null)}
            />
          )}
          {selectedNode.type === 'video' && (
            <VideoPanel
              node={selectedNode}
              characters={characters}
              allNodes={nodes}
              allEdges={edges}
              relationships={relationships}
              onPushEvents={onPushEvents}
              onUpdateCharacter={onUpdateCharacter}
              onUpdate={(data) => updateNodeData(selectedNode.id, data)}
              onClose={() => setSelectedNode(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}
