# 项目重构指南

## 项目说明

- 当前项目是为小程序 Annil 插件(https://github.com/missannil/annil)提供的VSCode插件，主要用于提供错误诊断等功能。
- Annil 框架文档: https://github.com/missannil/annil/tree/main/docs
- 项目中的src、test、minitest目录为旧版代码,不可更改。
- 根据旧源码生成新代码,新代码应放在_src和_test目录中。

## 目录结构图

```text
project-root/
├─ .github/
│  └─ copilot-instructions.md        # 项目 instructions
├─ _src/                             # 这里是重构后新代码目录
│  ├─ [目录或文件A]                  # 这里是A模块目录
│  ├─ [目录或文件B]                  # 这里是B模块目录
│  └─ ...                            # 这里继续补充
├─ _test/                            # 这里是重构后测试目录
│  ├─ miniprogram/                   # 这里写模拟小程序开发目录
│  ├─ suite/                          # 这里写测试套件说明
│  └─ ...                           # ...
├─ src/                              # 这里写旧版代码插件源码目录
├─ test/                             # 这里写旧版测试代码目录
└─ miniTest/                        # 这里写其他旧版目录
```

## 代码风格

- 遵循eslint.config.js中定义的规则
- 对于有必要的违反eslint规则的情况,请在代码中添加注释说明原因。比如 complexity 大于规定时。

## 注释说明

- 对核心功能和存在复杂逻辑的代码应给出注释。

## 测试说明

- _test: 存放测试代码。
- _test/miniprogram: 模拟小程序工作目录。
- 测试用例应放在_test目录中，与_src目录中的代码对应。
- 测试用例应写在小程序组件文件中。

## WXML 验证设计理念

### 两种校验模式

WXML 诊断分为两种粒度，对应 TS 中两类组件 API 的收集结果：

| 组件类型                    | TS API                   | 校验粒度       | 收集结果类型        |
| --------------------------- | ------------------------ | -------------- | ------------------- |
| **根组件（RootComponent）** | `RootComponent()({...})` | 全局数据名     | `RootComponentInfo` |
| **子组件（SubComponent）**  | `SubComponent()({...})`  | 逐属性精确匹配 | `SubComponentInfo`  |

#### 模式一：RootComponent — 全局数据名校验

RootComponent 的数据用于**原生元素**（`<view>`、`<block>` 等）及 `{{}}` 文本插值中的变量引用校验。

```
TS:  data: { knownData: "hello" }
     computed: { computedBool() { return true } }

WXML:
  <view>{{knownData}}</view>              ← knownData 在 dataList 中 ✓
  <block wx:if="{{computedBool}}">         ← computedBool 在 dataList 中 ✓
  <view>{{unknownData}}</view>             ← unknownData 不在 dataList 中 ✗ 产生诊断
```

校验逻辑：遍历 WXML 中所有 `{{xxx}}`，提取顶部变量名，检查是否在 `validNames`（由 `RootComponentInfo.dataList` + `SubComponentInfo.dataList` + 用户配置合并）中。不关心属性名——任意属性都可以用任意合法数据，没有一一对应约束。

#### 模式二：SubComponent — 逐属性精确匹配

SubComponent 的配置信息用于**自定义组件元素**（如 `<subInline>`、`<chunkComp>`）的属性值校验。

```
TS SubComponent 配置:
  inherit: { chunkA_propRequiredList: "propRequiredList" }
  events:  { chunkA_eventsOnTap() {} }

      ↓ 收集为 configInfo

configInfo = {
  chunkA_propRequiredList: { type: "Root",   value: "propRequiredList" },
  "bind:eventsOnTap":     { type: "Events", value: "chunkA_eventsOnTap" },
}

WXML 校验:
  <chunkComp
    chunkA_propRequiredList="{{xxx}}"       ← xxx 必须等于 "propRequiredList"
    bind:eventsOnTap="chunkA_eventsOnTap"   ← 必须等于 "chunkA_eventsOnTap"
  />
```

校验逻辑：

1. **属性名白名单**：WXML 中自定义组件标签的属性名必须在 `configInfo` 的 keys 中
2. **值精确匹配**：每个属性的值必须等于 `configInfo[attrName].value`
3. **类型区分**：`type: "Data"` → 校验 `{{}}` 语法和变量名；`type: "Events"` → 校验 event 绑定

### AttrValue 类型设计

属性值有 5 种类型，对应不同的 WXML 校验路径：

| 类型                                  | 来源                              | WXML 校验方式                                  |
| ------------------------------------- | --------------------------------- | ---------------------------------------------- |
| `{ type: "Root", value: "xxx" }`      | inherit 中写 `"propRequiredList"` | **精确匹配**：`{{xxx}}` 的变量必须等于 `value` |
| `{ type: "Self", value: "xxx" }`      | data/computed/store 自身数据      | **精确匹配**：`{{xxx}}` 的变量必须等于 `value` |
| `{ type: "Custom", value: "自定义" }` | inherit 中写 `"wxml"`             | **不匹配**：只要 `{{}}` 变量来自 rootData 即可 |
| `{ type: "Events", value: "xxx" }`    | events 字段                       | **精确匹配**：裸方法名必须等于 `value`         |
| `{ type: "Ternary", values: [...] }`  | inherit 中写数组                  | **三元表达式校验**                             |

**Root 与 Self 的区别**：

- 校验逻辑相同（精确匹配 `value`），但语义不同：Root 标记"值来自父组件"，Self 标记"值来自自身"
- codeAction fix 中 `getCorrectValue` 对两者走同一分支，生成 `{{xxx}}` 格式
- Custom 与 Root/Self 不同：Custom 不要求精确匹配，只要变量在 rootData 中存在即可

### 数据流向

```
       RootComponent()({...})              SubComponent()({...})
             │                                    │
             ▼                                    ▼
      RootComponentInfo                    SubComponentInfo
      ┌─────────────────┐                 ┌─────────────────────┐
      │ dataList        │                 │ configInfo (逐属性)  │
      │ events          │                 │ events               │
      │ arrTypeDatas    │                 │ arrTypeDatas         │
      │ boolTypeDatas   │                 │ boolTypeDatas        │
      └─────────────────┘                 └─────────────────────┘
             │                                    │
             ▼                                    │
┌────────────┴────────────┐                        │
│   validNames 合并       │◄───────────────────────┘
│   (Root dataList        │   (从 configInfo 提取
│    + 从 Sub configInfo   │    Root/Self 的 value)
│    提取数据名            │
│    + 用户 config)        │
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│  validateWxmlData()     │  ← 全局数据名校验（原生元素）
│  validateAttrValue()    │  ← 逐属性精确匹配（自定义组件）
└─────────────────────────┘
```

### 相关文件

| 文件                                             | 职责                                                          |
| ------------------------------------------------ | ------------------------------------------------------------- |
| `_src/core/types/TsFileInfo.ts`                  | `RootComponentInfo`、`SubComponentInfo`、`AttrValue` 类型定义 |
| `_src/core/tsAnalyzer/walkComponentConfig.ts`    | Root/Sub 共享的 AST 遍历 + 类型守卫 + 原子操作                |
| `_src/core/tsAnalyzer/rootComponentCollector.ts` | 收集 RootComponent 配置（~50 行）                             |
| `_src/core/tsAnalyzer/subComponentCollector.ts`  | 收集 SubComponent 配置（~100 行），含 `configInfo` 构建       |
| `_src/core/wxmlValidator/validateData.ts`        | 全局 mustache 数据名校验                                      |
| `_src/core/wxmlValidator/comment/`               | annil 注释节点模块                                            |

### 注意事项

- SubComponent 的数据名和类型信息由 `configInfo` 统一管理：数据名从 `configInfo` 中 `type="Root"` / `"Self"` 的 value 提取，数组/布尔类型信息由 `arrTypeDatas` / `boolTypeDatas` 追踪（仅限 data/computed/store 自身数据）
- RootComponent 不做 `configInfo`，因为原生元素的属性不需要一一对应
- `walkComponentConfig` 只负责 AST 遍历，不包含业务差异。差异通过 `extractedFields` 白名单 + `onProperty`/`onMethod` 回调下沉

## 重构流程

- 理解旧代码逻辑,给出重构方案。
- 等待用户确定重构方案后,再进行代码重构。
- 先在_test目录中创建测试文件,并编写测试用例.
- 重构逻辑后，运行 Run Annil Tests，等待用户告诉测试结果。
