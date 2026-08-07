---
description: "Use when creating or changing tests, fixtures, diagnostics, Quick Fix Code Actions, test selection, or validation commands in vscode-annil."
---

# 测试约束

## 范围

- 新测试和 fixture 只写入 `_test`。
- `_test/miniprogram` 仅用于跨测试共享的项目环境、页面和组件；某个功能的真实组件 demo 必须放在该功能自己的测试目录下，例如 miniTest 使用 `_test/suite/miniTest/fixtures/<component>`，并在组件目录中提供 `.ts`、`.json`、`.wxml` 等真实文件。
- 一条业务规则对应一个最小测试单元；不要在同一任务中迁移多条规则。
- 行为变更先写能失败的最小测试，再修改实现。
- 不为满足目录形式迁移无关旧测试。

## 测试层级

- parser、collector、analyzer 和纯函数使用直接导入实现的单元测试。
- VS Code 诊断必须由 Extension Host 打开真实 `.ts`、`.json`、`.wxml` fixture 后断言；不得直接调用 validator 模拟诊断。
- 新增 WXML 规则 fixture 必须在同一目录提供同名 `.ts`、`.json`、`.wxml` 和 `*.test.ts`；缺失组件契约文件时，Linter 可能不会发布 WXML 诊断。
- 迁移、拆分或删除 fixture 时，必须在同一次变更中更新或删除所有仍引用旧路径的 `*.test.ts`；测试入口按源测试文件发现用例，不会因 fixture 已删除而自动跳过该用例。
- Code Action 必须通过 `vscode.executeCodeActionProvider` 获取真实 Quick Fix；不得直接调用修复生成函数。
- 优先复用现有 diagnostic、Code Action、fixture 恢复 helper，不复制异步等待逻辑。
- 同一个 WXML 规则场景的普通诊断、Quick Fix 和 `fix-all` 用例统一写入该场景已有的 `*.test.ts`；不要另建 `*.codeAction.test.ts`。只有用户明确要求独立测试生命周期或该 Code Action 不属于已有规则场景时，才允许单独建文件。
- Code Action 测试应与普通诊断测试共享同一组最小 fixture，并在每个会修改 fixture 的用例结束时恢复原始内容；优先使用上级 `codeActionHelper.ts`。

## 断言

- 每条新诊断规则至少覆盖一个非法输入和一个合法输入。
- 新诊断测试在契约稳定时断言 `message`、`source`、`code` 和完整 `Range`。
- 聚合场景只断言当前规则拥有的诊断，并验证合法输入未被误报。
- 修改 fixture 的测试必须在结束时恢复原始内容。
- 对同一文件内重复出现的表达式或属性，必须断言每条诊断分别落在对应的源码位置；不能只断言诊断数量或消息。
- Quick Fix 除了确认诊断消失，还要断言应用后的关键编辑结果（属性顺序、插入位置或替换文本）；`fix-all` 只能断言该次修复负责的诊断，不把无法自动推断的占位值衍生诊断当作已修复。

## 执行

- 聚焦测试使用：`ANNIL_TEST_FILTER=<相对于 _test/suite 的测试文件或目录> pnpm test:extension`；多个目标以英文逗号分隔。当前测试运行器会把命令行 `--` 作为路径，不能使用该形式。
- 不要仅为聚焦自动测试而修改 `_test/index.ts`；只有用户要求断点调试时才使用 `manuallyFocusedTests`。
- 除非用户明确要求“不运行”，代理可以自行运行当前规则的聚焦测试。
- 对已打开且当前可能已有诊断的 fixture，使用 `waitForDiagnostics()` 轮询当前状态；`waitForStableDiagnostics()` 仅用于预期后续诊断发布的聚合场景，避免其稳定等待超过 Mocha 默认用例超时。
- 全量测试和 `pnpm run check` 仅在用户明确要求或完成一个迁移阶段时运行。
- 阶段收尾依次运行 `pnpm check`、`pnpm build` 和 `env -u ANNIL_TEST_FILTER pnpm test:extension`；Extension Host 测试有进程锁，不要并行启动第二个测试进程。
- 成功只报告所运行的命令和结果；失败只报告失败用例、关键错误和相关堆栈。
