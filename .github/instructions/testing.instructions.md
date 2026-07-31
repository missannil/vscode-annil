---
description: "Use when creating or changing tests, fixtures, diagnostics, Quick Fix Code Actions, test selection, or validation commands in vscode-annil."
---

# 测试约束

## 范围

- 新测试和 fixture 只写入 `_test`。
- 一条业务规则对应一个最小测试单元；不要在同一任务中迁移多条规则。
- 行为变更先写能失败的最小测试，再修改实现。
- 不为满足目录形式迁移无关旧测试。

## 测试层级

- parser、collector、analyzer 和纯函数使用直接导入实现的单元测试。
- VS Code 诊断必须由 Extension Host 打开真实 `.ts`、`.json`、`.wxml` fixture 后断言；不得直接调用 validator 模拟诊断。
- Code Action 必须通过 `vscode.executeCodeActionProvider` 获取真实 Quick Fix；不得直接调用修复生成函数。
- 优先复用现有 diagnostic、Code Action、fixture 恢复 helper，不复制异步等待逻辑。

## 断言

- 每条新诊断规则至少覆盖一个非法输入和一个合法输入。
- 新诊断测试在契约稳定时断言 `message`、`source`、`code` 和完整 `Range`。
- 聚合场景只断言当前规则拥有的诊断，并验证合法输入未被误报。
- 修改 fixture 的测试必须在结束时恢复原始内容。

## 执行

- 聚焦测试优先使用：`pnpm test:extension -- <相对于 _test/suite 的测试文件或目录>`。
- 不要仅为聚焦自动测试而修改 `_test/index.ts`；只有用户要求断点调试时才使用 `manuallyFocusedTests`。
- 除非用户明确要求“不运行”，代理可以自行运行当前规则的聚焦测试。
- 全量测试和 `pnpm run check` 仅在用户明确要求或完成一个迁移阶段时运行。
- 成功只报告所运行的命令和结果；失败只报告失败用例、关键错误和相关堆栈。
