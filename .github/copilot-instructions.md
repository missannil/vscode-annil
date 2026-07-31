# vscode-annil 开发约束

## 范围

- 本项目是 Annil 微信小程序框架的 VS Code 诊断插件。
- `src`、`test`、`miniTest` 是旧版参考代码，只读。
- 新实现和新测试只写入 `_src`、`_test`；不要修改生成目录 `out`。
- 已迁移功能以 `_src` 为事实源；仅在迁移缺失行为时读取对应旧代码。

## 工作方式

- 一次只处理一条业务规则，不做无关重构、改名或目录整理。
- 需求已明确给出范围和验收标准时直接实施。
- 仅当涉及公共契约、目录、架构或跨模块数据流时，先给出简短方案并等待确认。
- 行为变更先建立或更新最小测试，再修改实现；纯内部整理不得改变现有行为。
- 优先读取目标实现、直接调用方和对应测试，不扫描整个旧目录。
- 遵循现有 TypeScript、ESLint 和 dprint 风格；只为非显然约束或复杂算法添加注释。

## 按需说明

- 涉及 Annil 组件收集、CustomComponent、ChunkComponent 或 WXML 作用域时，读取 `instructions/glossary.instructions.md`。
- 涉及测试、fixture、诊断、Code Action 或验证命令时，读取 `instructions/testing.instructions.md`。
- 不预加载与当前任务无关的说明文件。

Annil 框架行为不明确时，先确认当前项目实际安装的版本，再使用 `annil-framework` Skill；必要时查阅该版本源码和官方文档。确定行为后更新对应测试，不把完整框架文档复制到本项目说明。
