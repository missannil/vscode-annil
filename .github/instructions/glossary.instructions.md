---
description: "Use when changing Annil RootComponent, CustomComponent, ChunkComponent, DefineComponent, TsFileInfo, AttrValue, AST collection, WXML component recognition, or expression scope."
---

# Annil 核心语义

- 当前类型和字段以 `_src/core/types/TsFileInfo.ts` 为准，不在说明中复制类型定义。
- 旧代码中的 `SubComponent` 对应当前 `CustomComponent`；新代码统一使用 `CustomComponent`。
- `CustomComponentInfoRecord` 的 key 是 TS 变量名；`configInfo` 只用于该自定义组件的属性契约，不能并入普通 WXML 表达式的有效变量集合。
- `ChunkComponentInfoRecord` 的 key 是 TS 变量名。Chunk 仅由“原生标签的静态 `id` 精确等于该变量名”识别；不要按标签名或泛型字符串识别。
- 普通表达式作用域由 Root 数据、配置数据、当前 `wx:for` 变量和外层 Chunk 数据组成。
- 简单成员/下标表达式（如 `item.name`、`item[0].name`）当前只校验最左侧的根变量 `item` 是否在作用域中；成员名和下标内容不单独参与作用域校验。复杂表达式迁移为 AST 解析前，不要扩展正则以猜测其余语义。
- `wx:for` 与 Chunk 的进入、离开必须成对维护，不能让局部变量泄漏到兄弟或外层节点。
- 诊断定位必须从当前 AST 节点的源码位置计算；不得从整份 WXML 的首个相同字符串反查位置。重复表达式、同一行多个表达式和多行属性都要有定位测试。
- Annil WXML 中不直接在 `CustomComponent` 标签上书写 `wx:if`、`wx:for` 等控制属性；应使用外层 `block` 包裹组件，例如 `<block wx:if="{{condition}}"><subInline /></block>`。
- 自定义组件属性引用 `wx:for-item` / `wx:for-index` 时，测试 fixture 应把组件放在对应 `block wx:for` 的子节点中；不要用组件标签自身的 `wx:for` 模拟该作用域。
- AST 收集依赖 `XxxComponent()({...})` 二次调用形态。测试 fixture 不得用 `as any` 或额外包装改变该 AST 形态。
- 修改收集或校验逻辑前，只读取对应 collector、类型、编排入口及直接测试；不要依赖手工维护的“已实现规则列表”。
