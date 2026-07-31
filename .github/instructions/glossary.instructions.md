---
description: "Use when changing Annil RootComponent, CustomComponent, ChunkComponent, DefineComponent, TsFileInfo, AttrValue, AST collection, WXML component recognition, or expression scope."
---

# Annil 核心语义

- 当前类型和字段以 `_src/core/types/TsFileInfo.ts` 为准，不在说明中复制类型定义。
- 旧代码中的 `SubComponent` 对应当前 `CustomComponent`；新代码统一使用 `CustomComponent`。
- `CustomComponentInfoRecord` 的 key 是 TS 变量名；`configInfo` 只用于该自定义组件的属性契约，不能并入普通 WXML 表达式的有效变量集合。
- `ChunkComponentInfoRecord` 的 key 是 TS 变量名。Chunk 仅由“原生标签的静态 `id` 精确等于该变量名”识别；不要按标签名或泛型字符串识别。
- 普通表达式作用域由 Root 数据、配置数据、当前 `wx:for` 变量和外层 Chunk 数据组成。
- `wx:for` 与 Chunk 的进入、离开必须成对维护，不能让局部变量泄漏到兄弟或外层节点。
- AST 收集依赖 `XxxComponent()({...})` 二次调用形态。测试 fixture 不得用 `as any` 或额外包装改变该 AST 形态。
- 修改收集或校验逻辑前，只读取对应 collector、类型、编排入口及直接测试；不要依赖手工维护的“已实现规则列表”。
