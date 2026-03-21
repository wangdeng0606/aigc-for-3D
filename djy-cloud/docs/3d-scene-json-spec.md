# 3D场景JSON数据规范 v3.0

## 一、设计原则

本规范基于经过验证的3D场景实现，确保AI生成的数据可以直接使用。

## 二、坐标系统

### 2.1 固定相机配置
```javascript
camera = new THREE.PerspectiveCamera(60, 16/9, 0.1, 50);
camera.position.set(0, 8, -12);  // 俯视30度角
camera.lookAt(0, 0, 0);          // 看向原点
```

### 2.2 坐标系规则
- **右手坐标系**
- **原点(0,0,0)**：锚点物体（通常是场景中最重要的物体，如床）的中心
- **X轴**：水平方向，正值向右
- **Y轴**：垂直方向，正值向上
- **Z轴**：深度方向，正值向内（远离相机）

### 2.3 单位换算
- 1个相对单位 = 0.3米
- 所有坐标值使用相对单位

## 三、JSON数据结构

### 3.1 完整结构
```json
{
  "scene_info": {
    "coordinate_system": {
      "description": "右手坐标系，以双人床中心点为原点(0,0,0)，X右、Y上、Z内（Z越大越远），1相对单位=0.3米，相机俯视30°看向床中心",
      "camera_setting": "PerspectiveCamera(60, 16/9, 0.1, 50)，position=(0, 8, -12)，lookAt(0,0,0)"
    },
    "scene_type": "卧室封闭空间"
  },
  "objects": [
    {
      "object_name": "双人床（原点锚定）",
      "area": "约25%",
      "threejs_position": [0, 0.3, 0.62],
      "rotation_y": 90,
      "scale": [1.5, 1.5, 1.5],
      "bounding_box_3d": [
        [-3.3, -0.15, -0.73],
        [3.3, 0.75, 1.97]
      ],
      "depth_level": "中心基准"
    }
  ]
}
```

### 3.2 字段说明

#### scene_info（场景信息）
- `coordinate_system.description` (string): 坐标系统详细描述
- `coordinate_system.camera_setting` (string): 相机配置参数
- `scene_type` (string): 场景类型

#### objects数组（物体列表）

**必填字段：**
- `object_name` (string): 物体名称，格式"物体类型（位置/特征）"
- `threejs_position` (array): Three.js位置 [x, y, z]
- `bounding_box_3d` (array): 3D边界框 [[min_x, min_y, min_z], [max_x, max_y, max_z]]

**可选字段：**
- `area` (string): 占画面面积百分比，如"约25%"
- `rotation_y` (number): 绕Y轴旋转角度（度），默认0
- `scale` (array): 缩放比例 [x, y, z]，默认[1, 1, 1]
- `depth_level` (string): 深度层级描述

## 四、AI生成指南

### 4.1 生成步骤
1. 识别场景类型
2. 选择锚点物体（最重要、最中心的物体）
3. 将锚点物体位置设为接近(0, 0, 0)
4. 按相对位置计算其他物体坐标
5. 估算边界框

### 4.2 坐标估算规则

**参考尺度：**
- 双人床：宽约4-5单位，长约6-7单位
- 床头柜：宽约1单位，高约0.6单位
- 书桌：宽约3单位，高约0.75单位
- 墙面高度：约4单位
- 房间宽度：约14单位

**位置关系：**
- 锚点物体：threejs_position接近[0, y, 0]
- 左侧物体：x为负值
- 右侧物体：x为正值
- 前景物体：z为负值（靠近相机）
- 背景物体：z为正值（远离相机）

### 4.3 边界框计算

边界框定义物体的实际占用空间：
```
min = [center_x - width/2, center_y - height/2, center_z - depth/2]
max = [center_x + width/2, center_y + height/2, center_z + depth/2]
```

如果有缩放，需要先应用缩放：
```
actual_width = base_width * scale_x
actual_height = base_height * scale_y
actual_depth = base_depth * scale_z
```

### 4.4 命名规范

**格式：** `物体类型（位置/特征描述）`

**示例：**
- ✅ "双人床（原点锚定）"
- ✅ "左侧床头柜"
- ✅ "木质书桌（左前景）"
- ✅ "后墙（床头背景墙）"
- ✅ "黑色办公椅"

**必须包含的结构元素：**
- 至少一面墙（后墙/左墙/右墙）
- 地面

## 五、完整示例

参考 `new/3d-room.json` 文件，这是经过人工校验的标准格式。

## 六、前端使用

```javascript
// 创建物体
function createObject(objData) {
    const bbox = objData.bounding_box_3d;
    const min = bbox[0];
    const max = bbox[1];
    
    // 计算原始尺寸
    const width = Math.abs(max[0] - min[0]);
    const height = Math.abs(max[1] - min[1]);
    const depth = Math.abs(max[2] - min[2]);
    
    // 获取缩放
    const scale = objData.scale || [1, 1, 1];
    
    // 创建几何体（使用未缩放尺寸）
    const geometry = new THREE.BoxGeometry(
        width / scale[0], 
        height / scale[1], 
        depth / scale[2]
    );
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // 设置位置
    mesh.position.set(...objData.threejs_position);
    
    // 应用旋转
    if (objData.rotation_y !== undefined) {
        mesh.rotation.y = objData.rotation_y * Math.PI / 180;
    }
    
    // 应用缩放
    mesh.scale.set(...scale);
    
    return mesh;
}
```

## 七、验证规则

生成的JSON必须满足：
1. 必须包含scene_info和objects两个顶层字段
2. 锚点物体的threejs_position应接近原点
3. 所有物体必须有object_name、threejs_position、bounding_box_3d
4. bounding_box_3d格式为[[min_x, min_y, min_z], [max_x, max_y, max_z]]
5. 必须包含至少一个墙面和地面
6. 坐标值保留2位小数

## 八、版本信息

- 版本：v3.0
- 更新日期：2026-03-15
- 基于：new/3d-room.json（经过人工校验）
