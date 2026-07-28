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
- **测试前置确认**：准备新增或修改测试时，先以文字说明该测试的目的、所覆盖的唯一逻辑与预期行为；在用户明确允许前，不得创建测试 fixture、测试文件或修改任何代码。
- **增量编写流程**：一次只新增一个粒度尽可能小的测试示例；一个示例只验证一个明确行为，不混合验证无关逻辑。
- **正反向覆盖**：诊断规则必须具备合法输入的正向覆盖；优先由对应功能用例验证合法输入的实际作用及不产生诊断。仅在没有功能用例可覆盖时，才新增独立的最小合法用例；一次只覆盖一种合法输入形态。
- 当待验证功能包含多个子逻辑时，先按主要逻辑建立总目录，再为各子逻辑建立子目录；目录与测试文件需通过名称或注释明确说明其验证目标。
- 新增或调整单个测试后，将其相对于 `_test/suite` 的路径加入 `_test/index.ts` 的 `manuallyFocusedTests`，且只启用当前待验证的测试路径。
- 完成单个测试示例后，使用 `pnpm test:extension` 运行当前聚焦测试并直接读取结果；失败时仅修正当前测试或相关实现后重试。测试通过后，将该路径在 `manuallyFocusedTests` 中注释掉但不删除，以保留执行记录；随后停止继续新增测试或修改实现，向用户报告结果并等待下一步指示。
- 测试示例可参考旧版 `test`、`miniTest` 与 `src` 中的对应行为，但不得修改旧版目录；新测试仅写入 `_test`。
- _test/miniprogram: 模拟共享小程序工作目录，仅用于 app、页面、共享组件、别名、项目配置和跨文件等项目级/基础逻辑测试；不用于承载一般规则的专属测试组件。
- 测试用例应放在_test目录中，与_src目录中的代码对应。
- WXML 规则测试必须在 `_test/suite/wxmlValidator/<规则目录>/` 内同目录创建最小真实 `.ts`、`.json`、`.wxml` 组件及 `*.test.ts`；不得将这些专属 fixture 放进 `_test/miniprogram`。
- WXML 诊断测试必须通过 Extension Host 打开真实组件文件、等待插件发布诊断后断言消息、source、code 和 Range；不得在 `_test` 中直接调用 `_src` 的 parser、analyzer 或 validator 并传入虚拟源码。
- 规则目录按主要业务归属建立：通用元素规则放在 `wxmlValidator/element/`，Chunk 标签规则放在 `element/chunkTag/`，根数据绑定放在 `dataBinding/`，`wx:for` 等控制指令作用域放在 `scope/`，自定义组件属性契约放在 `customComponent/`，注释放在 `comment/`。
- 通用的 Extension Host 打开组件、等待诊断和清理能力放在 `wxmlValidator` 根目录的 helper 中；helper 不包含具体业务规则断言。

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
- 重构逻辑后，运行 `pnpm test:extension` 并直接检查测试结果；测试失败时修正相关实现或当前测试，测试通过后向用户报告结果。
