---
description: "Use when changing unused data diagnostics, RootComponent, CustomComponent, ChunkComponent, TypeScript references, cross-file rename fixes, delete fixes, or fix-all actions."
applyTo: "_src/core/tsAnalyzer/**,_src/codeActionProvider/**,_src/linter/**,_test/suite/tsAnalyzer/**"
---

# 未使用数据诊断契约

## 规则

- `RootComponent` 的非内部字段：
  - 被当前 WXML 直接使用，或被子组件 `inherit` 配置使用：不产生诊断。
  - 没有 WXML/`inherit` 使用，但被 RootComponent 自身或已导入的外部 CustomComponent TypeScript 逻辑引用：诊断文案为“建议改为内部字段”，诊断码为 `annil.suggestInternalData`。
  - 没有任何 TypeScript 引用：诊断文案为“未使用到的数据”，诊断码为 `annil.unusedData`。
- `RootComponent` 的内部字段、`CustomComponent` 的内部字段和 `ChunkComponent` 的内部字段只按 TypeScript 引用判断；未引用时诊断为“未使用到的数据”。
- 外部 `CustomComponent` 文件中的 `computed`、方法、`watch`、事件等引用必须计入所属 RootComponent 的 TypeScript 使用集合。
- `watch` 中监听字段的属性名本身算作该字段的使用。
- WXML 复杂表达式无法静态提取时，不得通过猜测产生额外误报。

## 诊断和定位

- 诊断发布到字段声明所在的 `.ts` 文件，级别为 `Warning`，来源为 `vscode-annil`。
- 诊断信息必须保留字段名、完整 AST 成员范围和组件类型，供 Code Action 使用。
- 定位优先使用 Babel AST 的 `loc`/offset；不要通过全文首个字符串匹配反查位置。
- 删除修复必须删除完整对象成员，并正确处理逗号、缩进和换行。

## Quick Fix 和 fix-all

- “建议改为内部字段”必须同步修改当前 TS 文件及递归导入的外部 TypeScript 文件中的声明、标识符引用和 `inherit` 字符串。
- 外部文件解析应支持相对路径、`.js` 后缀、`index.ts` 和 `tsconfig.json` 路径别名；打开但未保存的文档优先使用内存内容。
- “未使用到的数据”修复为删除完整字段。
- 两种 TS 修复都必须通过 TypeScript CodeActionProvider 暴露，并注册到 `annil.fix-all` 的统一 resolver 中。
- 每个诊断码只返回一个默认修复，确保 fix-all 选择稳定。
- 新增或改变诊断、修复、fixture 时，遵守 `testing.instructions.md`：先写失败测试，再修改实现；测试应覆盖消息、来源、诊断码、范围和应用后的关键文本结果。

## 关键实现入口

- 数据分析：[unusedDataAnalyzer.ts](_src/core/tsAnalyzer/unusedDataAnalyzer.ts)
- TS 诊断发布：[index.ts](_src/linter/index.ts)
- TS 修复：[tsFix.ts](_src/codeActionProvider/tsFix.ts)
- TS 修复注册：[tsFixRegistry.ts](_src/codeActionProvider/tsFixRegistry.ts)
- Code Action 注册：[index.ts](_src/codeActionProvider/index.ts)
- 外部组件收集：[collectExternalSubComponentSources.ts](_src/core/tsAnalyzer/collectExternalSubComponentSources.ts)
- 分析器聚焦测试：[unusedDataAnalyzer.test.ts](_test/suite/tsAnalyzer/unusedDataAnalyzer.test.ts)

## 验证

- 类型检查：`pnpm run typecheck`
- 生产构建：`pnpm build`
- 未使用数据聚焦测试：`ANNIL_TEST_FILTER=tsAnalyzer/unusedDataAnalyzer.test.ts pnpm test:extension`
- 完整 Extension Host 测试：`pnpm test:extension`
