# 3D动画生成系统设计文档

# 第一阶段：参考图场景构建

## 一、阶段目标

本阶段的目标是：

**根据一张参考图片，构建一个可编辑的三维场景。**

该三维场景将作为后续动画制作与运镜分析的基础数据。

系统会根据图片中的物体信息生成一个标准化的 **scene.json**，用于：

- 初始化 3D 场景
- 记录所有物体的空间关系
- 为后续动画系统提供基础数据
- 为 AI 运镜分析提供空间结构

本阶段最终输出：

```json
{
  "scene": {},
  "camera": {},
  "objects": []
}
```

------

## 二、整体流程

参考图到三维场景的生成流程如下：

```
参考图
   ↓
物体标注
   ↓
空间关系分析
   ↓
三维坐标生成
   ↓
scene.json 生成
   ↓
3D 场景初始化
   ↓
用户微调
```

每个步骤说明如下。

------

## 三、步骤说明

为了说明整个流程，下面使用一个简单的卧室场景作为示例。

场景中包含以下物体：

- 双人床
- 左床头柜
- 右床头柜
- 书桌
- 椅子

### 步骤一：参考图输入

系统首先接收一张参考图片。

例如：

```
bedroom_reference.png
```

系统记录图片基本信息：

```
{
  "image": {
    "width": 1920,
    "height": 1080,
    "name": "bedroom_reference.png"
  }
}
```

这些信息主要用于后续的：

- 物体标注
- 相机视角推测

------

### 步骤二：物体识别与标注

用户或 AI 需要识别图片中的关键物体。

系统会生成一个 **对象列表**。

示例：

```
{
  "objects": [
    {
      "id": "bed_001",
      "name": "double_bed",
      "category": "furniture"
    },
    {
      "id": "nightstand_left",
      "name": "left_nightstand",
      "category": "furniture"
    },
    {
      "id": "nightstand_right",
      "name": "right_nightstand",
      "category": "furniture"
    },
    {
      "id": "desk",
      "name": "wooden_desk",
      "category": "furniture"
    },
    {
      "id": "chair",
      "name": "office_chair",
      "category": "furniture"
    }
  ]
}
```

这一阶段的目标是：

**明确场景中有哪些物体。**

------

### 步骤三：场景空间理解

在识别出物体之后，系统会分析物体之间的空间关系。

例如：

- 哪些物体在场景中心
- 哪些物体靠近墙
- 哪些物体在前景或背景

系统会选择一个 **锚点物体（anchor object）**。这个后续将由导演自动选择，因为有瞄点物体的存在，我发现ai描述得出来的结果非常准确。

例如：

```
{
  "anchor_object": "bed_001"
}
```

选择床作为锚点的原因：

- 占据场景中心
- 体积最大
- 空间关系稳定

之后所有物体的位置都会以它为参考。

------

### 步骤四：建立三维坐标系

系统会建立统一的三维坐标系。

坐标规则如下：

```
{
  "coordinate_system": {
    "type": "right-handed",
    "axes": {
      "x": "right",
      "y": "up",
      "z": "forward"
    },
    "origin": "bed_center"
  }
}
```

这意味着：

- X 轴表示左右方向
- Y 轴表示上下方向
- Z 轴表示前后方向

坐标原点设置为：

```
床的中心
```

这样整个场景的空间结构就稳定了。

------

### 步骤五：场景结构生成

系统会生成完整的 **scene.json**。

示例：

```
{
  "scene_info": {
    "scene_type": "卧室封闭空间",

    "coordinate_system": {
      "type": "right-handed",
      "origin_object": "obj_furniture_bed_001",
      "axis": {
        "x": "right",
        "y": "up",
        "z": "forward"
      },
      "unit_scale": 0.3
    },

    "camera": {
      "id": "cam_main_001",
      "type": "PerspectiveCamera",
      "fov": 60,
      "aspect": "16:9",
      "near": 0.1,
      "far": 50,
      "position": [0, 8, -12],
      "look_at": [0, 0, 0],
      "description": "主观察相机"
    }
  },

  "objects": [

    {
      "id": "obj_furniture_bed_001",
      "name": "双人床",

      "transform": {
        "position": [0, 0, 0],
        "rotation": [0, 0, 0]
      },

      "bounding_box": {
        "min": [-2.2, 0, -1.8],
        "max": [2.2, 0.6, 1.8]
      },

      "semantic": {
        "role": "anchor",
        "depth": "center"
      }
    },

    {
      "id": "obj_furniture_nightstand_001",
      "name": "左侧床头柜",

      "transform": {
        "position": [-3.0, 0, 0.2],
        "rotation": [0, 0, 0]
      },

      "bounding_box": {
        "min": [-3.5, 0, -0.3],
        "max": [-2.5, 0.6, 0.7]
      },

      "semantic": {
        "depth": "mid"
      }
    },

    {
      "id": "obj_furniture_nightstand_002",
      "name": "右侧床头柜",

      "transform": {
        "position": [3.0, 0, 0.2],
        "rotation": [0, 0, 0]
      },

      "bounding_box": {
        "min": [2.5, 0, -0.3],
        "max": [3.5, 0.6, 0.7]
      },

      "semantic": {
        "depth": "mid"
      }
    },

    {
      "id": "obj_furniture_desk_001",
      "name": "木质书桌",

      "transform": {
        "position": [-5.0, 0, -2.5],
        "rotation": [0, 0, 0]
      },

      "bounding_box": {
        "min": [-6.5, 0, -3.5],
        "max": [-3.5, 0.75, -1.5]
      },

      "semantic": {
        "depth": "foreground"
      }
    },

    {
      "id": "obj_furniture_chair_001",
      "name": "黑色办公椅",

      "transform": {
        "position": [-4.2, 0, -1.8],
        "rotation": [0, 0, 0]
      },

      "bounding_box": {
        "min": [-4.8, 0, -2.2],
        "max": [-3.6, 1.0, -1.4]
      },

      "semantic": {
        "depth": "foreground"
      }
    },

    {
      "id": "obj_structure_wall_001",
      "name": "后墙",

      "transform": {
        "position": [0, 2.0, 2.0],
        "rotation": [0, 0, 0]
      },

      "bounding_box": {
        "min": [-7.0, 0, 1.8],
        "max": [7.0, 4.0, 2.2]
      }
    },

    {
      "id": "obj_structure_wall_002",
      "name": "左侧墙",

      "transform": {
        "position": [-7.0, 2.0, 0],
        "rotation": [0, 0, 0]
      },

      "bounding_box": {
        "min": [-7.2, 0, -4.0],
        "max": [-6.8, 4.0, 2.0]
      }
    },

    {
      "id": "obj_structure_wall_003",
      "name": "右侧墙",

      "transform": {
        "position": [7.0, 2.0, 0],
        "rotation": [0, 0, 0]
      },

      "bounding_box": {
        "min": [6.8, 0, -4.0],
        "max": [7.2, 4.0, 2.0]
      }
    },

    {
      "id": "obj_structure_floor_001",
      "name": "地面",

      "transform": {
        "position": [0, 0, 0],
        "rotation": [0, 0, 0]
      },

      "bounding_box": {
        "min": [-7.0, -0.1, -4.0],
        "max": [7.0, 0.1, 2.0]
      }
    }

  ]
}
```

这个 JSON 就是：**场景初始化数据。**

------

### 步骤六：初始化三维场景

系统根据 scene.json 创建三维场景。

当前使用的技术是：

Three.js

初始化内容包括：

- 相机
- 场景
- 灯光
- 所有物体

每个物体可以使用简单模型表示，例如：

- BoxGeometry
- 基础家具模型

这样可以快速得到一个可编辑场景。

------

### 步骤七：场景微调

系统会根据场景结构自动生成三维场景。

目前我们使用的技术为：

Three.js

系统会创建：

- 相机
- 灯光
- 地面
- 墙体
- 所有物体

物体可以使用简单模型表示，例如：

```
盒子模型
基础家具模型
```

这样可以快速得到一个可编辑场景。

------

## 四、阶段demo成果展示

初始参考图：

![f9b25975bd0e9c598d0c758f94e1af37](C:\Users\BlueJack\xwechat_files\wxid_gniz8zzb2q6222_953b\temp\RWTemp\2026-03\f73ed1a909f175b6f75fac97faf16b41\f9b25975bd0e9c598d0c758f94e1af37.png)

成品3d模型构造图：

![8fe20093e565d2f01a8c4d76363f8b5f](C:\Users\BlueJack\xwechat_files\wxid_gniz8zzb2q6222_953b\temp\RWTemp\2026-03\f73ed1a909f175b6f75fac97faf16b41\8fe20093e565d2f01a8c4d76363f8b5f.png)

## 五、这一阶段的核心价值

完成这一阶段后，我们将获得：

```
一张图片
        ↓
可编辑三维场景
        ↓
标准化空间结构
```

这使得 AI 可以理解：

- 空间结构
- 物体关系
- 摄影机位置

从而实现：

**自动分析和复刻镜头语言。**