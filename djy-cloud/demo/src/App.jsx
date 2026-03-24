import { useState, useCallback, useEffect } from 'react';
import 'reactflow/dist/style.css';
import NavBar from './components/NavBar';
import CharacterView from './views/CharacterView';
import SceneManageView from './views/SceneManageView';
import VideoProductionView from './views/VideoProductionView';

/* Demo 参考图 */
import bsFront from './dist/白色大侠正面图.png';
import bsSide1 from './dist/白色大侠侧面图1.png';
import bsSide2 from './dist/白色大侠侧面图2.png';
import bsBack  from './dist/白色大侠背面图.png';
import hyFront from './dist/黑衣大侠正面图.png';
import hySide1 from './dist/黑衣大侠侧面图1.png';
import hySide2 from './dist/黑衣大侠侧面图2.png';
import hyBack  from './dist/黑衣大侠背面图.png';
import { cropFaceBatch } from './utils/cropFace';

export default function App() {
  const [tab, setTab] = useState('character'); // 'character' | 'scene' | 'video'

  /* 全局角色列表（跨 tab 共享）
     固定属性: id, name, gender
     成长属性: phases[] — 每个阶段包含 role/description/tags/参考图 */
  const [characters, setCharacters] = useState([
    {
      id: 'char-1',
      name: '沈逸风',
      gender: '男',
      activePhase: 'p1',
      phases: [
        {
          id: 'p1', label: '初出江湖',
          role: '武当弟子', description: '性格坚毅的青年侠客，师从武当，擅长剑术与轻功',
          tags: ['勇敢', '正义', '剑术'],
          activeRefSet: 'rs1',
          refSets: [
            { id: 'rs1', label: '白衣剑装', images: { front: bsFront, side: bsSide1, back: bsBack, quarter: bsSide2, frontFace: null, sideFace: null, backFace: null, quarterFace: null } },
          ],
        },
      ],
    },
    {
      id: 'char-2',
      name: '楚夜寒',
      gender: '男',
      activePhase: 'p1',
      phases: [
        {
          id: 'p1', label: '初出江湖',
          role: '影刃门传人', description: '神秘莫测的影刃门传人，行踪诡秘，剑法凌厉',
          tags: ['神秘', '冷酷', '暗杀'],
          activeRefSet: 'rs1',
          refSets: [
            { id: 'rs1', label: '黑衣战装', images: { front: hyFront, side: hySide1, back: hyBack, quarter: hySide2, frontFace: null, sideFace: null, backFace: null, quarterFace: null } },
          ],
        },
      ],
    },
  ]);

  const addCharacter = () => {
    const id = `char-${Date.now()}`;
    setCharacters((prev) => [
      ...prev,
      {
        id,
        name: '新角色',
        gender: '未设定',
        activePhase: 'p1',
        phases: [
          {
            id: 'p1', label: '初始阶段',
            role: '', description: '',
            tags: [],
            activeRefSet: 'rs1',
            refSets: [
              { id: 'rs1', label: '默认形象', images: { front: null, side: null, back: null, quarter: null, frontFace: null, sideFace: null, backFace: null, quarterFace: null } },
            ],
          },
        ],
      },
    ]);
    return id;
  };

  const updateCharacter = (id, data) => {
    setCharacters((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  };

  /* ===== 启动时自动裁剪已有角色的脸部特写 ===== */
  useEffect(() => {
    (async () => {
      setCharacters((prev) => [...prev]); // trigger
      const updated = [...characters];
      let changed = false;
      for (const char of updated) {
        for (const phase of char.phases || []) {
          for (const rs of phase.refSets || []) {
            const imgs = rs.images || {};
            // 只要有全身图且缺少对应脸部图就裁剪
            const needsCrop = (imgs.front && !imgs.frontFace) || (imgs.side && !imgs.sideFace) ||
                              (imgs.back && !imgs.backFace) || (imgs.quarter && !imgs.quarterFace);
            if (needsCrop) {
              const bodyMap = {};
              if (imgs.front && !imgs.frontFace)     bodyMap.front = imgs.front;
              if (imgs.side && !imgs.sideFace)       bodyMap.side = imgs.side;
              if (imgs.back && !imgs.backFace)        bodyMap.back = imgs.back;
              if (imgs.quarter && !imgs.quarterFace)  bodyMap.quarter = imgs.quarter;
              try {
                const faces = await cropFaceBatch(bodyMap);
                if (faces.front)   rs.images.frontFace = faces.front;
                if (faces.side)    rs.images.sideFace = faces.side;
                if (faces.back)    rs.images.backFace = faces.back;
                if (faces.quarter) rs.images.quarterFace = faces.quarter;
                changed = true;
              } catch (e) {
                console.warn('脸部裁剪失败:', char.name, e);
              }
            }
          }
        }
      }
      if (changed) setCharacters([...updated]);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteCharacter = (id) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  };

  /* ===== 全局场景列表（Tab 2 管理，Tab 3 引用） ===== */
  const [scenes, setScenes] = useState([
    {
      id: 'scene-1',
      name: '竹林对决',
      description: '月光下的竹林，两人持剑对峙，风吹竹叶',
      keywords: '月光竹林，对峙，风吹竹叶，萧瑟夜色',
      images: [
        { id: 'img-demo-1', url: new URL('./dist/竹林正面图.png', import.meta.url).href, angle: '正面全景', prompt: '竹林小道，正面视角' },
        { id: 'img-demo-2', url: new URL('./dist/竹林俯视图.png', import.meta.url).href, angle: '俯瞰鸟瞰', prompt: '竹林，俯视角度' },
      ],
    },
  ]);

  const addScene = () => {
    const id = `scene-${Date.now()}`;
    setScenes((prev) => [
      ...prev,
      { id, name: '新场景', description: '', keywords: '', images: [] },
    ]);
    return id;
  };

  const updateScene = (id, data) => {
    setScenes((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  };

  const deleteScene = (id) => {
    setScenes((prev) => prev.filter((s) => s.id !== id));
  };

  /* ===== 跨 tab 共享的角色关系边 ===== */
  const [relationships, setRelationships] = useState([
    {
      id: 'rel-demo',
      source: 'char-1',
      target: 'char-2',
      type: 'relationship',
      data: {
        label: '陌生人',
        relationshipHistory: [
          { id: 'r1', label: '陌生人', desc: '初始状态' },
        ],
        events: [],
      },
    },
  ]);

  const updateRelationships = useCallback((updater) => {
    setRelationships(typeof updater === 'function' ? updater : () => updater);
  }, []);

  /* 场景分析后，批量推送事件到角色关系边 */
  const pushEvents = useCallback((items) => {
    // items: [{ sourceCharId, targetCharId, events: [...] }]
    setRelationships((prev) => {
      let next = [...prev];
      for (const { sourceCharId, targetCharId, events: newEvts } of items) {
        // 分离：关系变更 vs 普通事件
        const relChanges = newEvts.filter((e) => e.type === 'relationship');
        const normalEvts = newEvts.filter((e) => e.type !== 'relationship');

        // 找到已有的边（无方向匹配）
        let edge = next.find(
          (e) =>
            (e.source === sourceCharId && e.target === targetCharId) ||
            (e.source === targetCharId && e.target === sourceCharId)
        );
        if (edge) {
          let data = { ...edge.data, events: [...(edge.data.events || []), ...normalEvts] };
          // 关系变更直接更新 relationshipHistory + label
          for (const rc of relChanges) {
            const newLabel = rc.title.replace(/^关系演变为/, '').replace(/^关系变为「/, '').replace(/」$/, '');
            data = {
              ...data,
              label: newLabel,
              relationshipHistory: [...(data.relationshipHistory || []), { id: `r-${Date.now()}`, label: newLabel, desc: rc.desc }],
            };
          }
          edge = { ...edge, data };
          next = next.map((e) => (e.id === edge.id ? edge : e));
        } else {
          // 没有关系边 → 创建新边
          const id = `rel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const lastRel = relChanges[relChanges.length - 1];
          const initLabel = lastRel ? lastRel.title.replace(/^关系演变为/, '').replace(/^关系变为「/, '').replace(/」$/, '') : '待定';
          const history = [{ id: `r-${Date.now()}`, label: initLabel, desc: lastRel?.desc || 'AI 场景分析发现的关系' }];
          next.push({
            id,
            source: sourceCharId,
            target: targetCharId,
            type: 'relationship',
            data: {
              label: initLabel,
              relationshipHistory: history,
              events: normalEvts,
            },
          });
        }
      }
      return next;
    });
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f3f4f8] overflow-hidden">
      <NavBar tab={tab} onTabChange={setTab} />
      <div className="flex-1 min-h-0">
        {tab === 'character' && (
          <CharacterView
            characters={characters}
            relationships={relationships}
            onUpdateRelationships={updateRelationships}
            onAdd={addCharacter}
            onUpdate={updateCharacter}
            onDelete={deleteCharacter}
          />
        )}
        {tab === 'scene' && (
          <SceneManageView
            scenes={scenes}
            characters={characters}
            onAddScene={addScene}
            onUpdateScene={updateScene}
            onDeleteScene={deleteScene}
          />
        )}
        {tab === 'video' && (
          <VideoProductionView
            scenes={scenes}
            characters={characters}
            relationships={relationships}
            onPushEvents={pushEvents}
            onUpdateCharacter={updateCharacter}
          />
        )}
      </div>
    </div>
  );
}
