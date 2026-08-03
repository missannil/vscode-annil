## 当前状态（2026-08-01）

本轮 WXML 核心诊断迁移和回归已完成，以下旧评估项已经不再适用：

- `Root`、`wx:for` 局部变量和外层 `ChunkComponent` 数据已合并到有效表达式作用域。
- `wx:for`、`wx:for-item`、`wx:for-index`、`wx:key` 的结构、缺值、表达式、变量和定位测试已补齐。
- condition 的前置关系、互斥、缺值、Mustache、非法表达式、未知数据、布尔类型和定位测试已补齐。
- `CustomComponent` 与 `ChunkComponent` 的 condition 作用域语义已有专项测试：Chunk 数据不泄漏到外部，CustomComponent 局部数据不并入父作用域。
- WXML 诊断已使用稳定的 `source`、`code` 和属性级 `Range` 契约；同一行或多行 opening tag 的重复节点已有回归覆盖。
- WXML Quick Fix、fix-all 和 JSON 诊断已接入当前迁移链路，并有 Extension Host 测试覆盖。

本轮收尾已完成：

- 清理迁移过程中遗留的无用 context 字段、重复 helper 和过时测试入口。
- 完成复杂表达式、Linter 生命周期、JSON、Code Action 和 fix-all 的专项回归。
- 删除五个仍引用已迁移 fixture 的旧根级 CustomComponent 测试，保留对应细分测试目录。
- `pnpm check`、`pnpm compile` 和完整 Extension Host 测试均已通过。

后续如继续扩展功能，应另立计划，不再将本轮计划视为未完成状态。

## 历史计划：稳定核心诊断（已完成）

### 阶段一：建立可信测试基线

1. 修复 `_test/suite/guardCheck.ts` 漏跑问题。
2. 先增加失败测试，覆盖：
   - Root、Custom 数据名合并。
   - CustomComponent 属性契约。
   - ChunkComponent 内外作用域。
   - 嵌套 `wx:for` 和自定义循环变量。
   - 表达式变量提取。
   - 重复数据的精准诊断范围。
   - 诊断的 `source` 和 `code`。
3. 增加诊断轮询助手，逐步替代固定 `setTimeout(500)`。
4. 运行 **Run Annil Tests**，等待测试结果后再进入实现。

### 阶段二：修正 WXML 主链路

1. 建立统一诊断工厂和源码定位器。
2. 合并 Root、Custom `Root/Self` 和用户配置的数据名。
3. 激活 `WxmlValidationContext.scope`：
   - 元素进入时压入循环变量。
   - 子树结束时弹出。
   - 支持嵌套和变量遮蔽。
4. 接入 `chunkComponentInfoRecord`，维护 Chunk 子树的局部数据和事件作用域。
5. 用轻量表达式标识符提取替代当前字符串跳过规则。
6. 完善 `validateCustomComponent()`：
   - 属性白名单。
   - `allowUnknownAttributes`。
   - Events、Root、Self、Custom、Ternary。
   - 精准属性名和值范围。
7. 再次运行 **Run Annil Tests** 并等待结果。

### 阶段三：恢复 JSON 诊断

1. 先增加 JSON 集成测试和异常恢复测试。
2. 从 `DefineComponent({ subComponents })` 引用追踪对应的 import declaration。
3. 产出可靠的“标签名 → 期望 JSON 路径”映射。
4. 在 `_src/linter/index.ts` 中接入 `validateJson()`，分别发布 WXML 和 JSON 诊断。
5. 处理 JSON 语法错误、文件缺失及过期诊断。
6. 运行 **Run Annil Tests**。

### 阶段四：Code Action 和核心命令

1. 先补 Quick Fix 和 fix-all 测试。
2. 改为根据稳定的 `diagnostic.code` 分发，不依赖中文消息。
3. 支持：
   - 缺少属性。
   - Root/Self/Event/Ternary 错误值。
   - JSON 缺少导入和错误路径。
4. 对 fix-all 的编辑进行排序、去重和重叠检测。
5. 实现 `annil.check-all`，或在实现前暂时移除对应命令贡献。
6. 运行 **Run Annil Tests**。

### 阶段五：Linter 生命周期与发布门禁

1. 增加文件创建、删除、重命名、配置变化和异常隔离测试。
2. 仅在组件成功解析后写入 `#checkedDirs`。
3. 增加显式缓存失效和重新检查入口。
4. 配置变化后按需重新解析 TS 并重新诊断。
5. 清理空的 `_src/core/tsFileParser.ts` 等误导项。
6. 最终执行：
   - `pnpm check`
   - `pnpm compile`
   - **Run Annil Tests**
   - Extension Host 手工烟测

## 范围决定

本轮聚焦核心诊断，包括 TS 收集、WXML、JSON、Code Action、`annil.check-all` 和 Linter 生命周期。

暂不迁移：

- Go To Definition
- Snippets
- 右键创建组件或页面
- miniTest 生成
- 通用 TypeScript 跨文件类型求值

旧目录 `src`、`test` 和 `miniTest` 仅作为参考，不作修改。完整计划已保存，作为本轮完成记录。

## 后续建议（待确认后另立计划）

1. **Linter 文件生命周期**：以删除、重命名、恢复组件文件为单独业务规则，先固定 VS Code 文件事件与缓存失效的可重复测试，再实现诊断清理与恢复；不和 WXML 规则改动混做。
2. **命令与发布核查**：逐项核对 `package.json` 的命令贡献、实际注册和 `annil.check-all` 行为；通过后执行 VSIX 打包烟测，但不发布扩展。
3. **迁移维护清理**：盘点空模块、过期注释和遗留测试入口；每次目录迁移保持 fixture 与测试文件原子移动，并完成全量门禁。

### 后续计划执行记录（2026-08-01）

- 已为 Linter 增加组件文件创建、删除、重命名时的目录状态清理、兄弟 parser 缓存失效和重新检查入口。
- 已修正解析失败后仍写入 `#checkedDirs` 的问题：只有完整检查成功才标记目录。
- 已保留并验证 JSON 编辑/保存后的诊断刷新测试；全量 Extension Host 回归通过。
- `workspace.fs.delete()` 在当前 Extension Host 环境中未稳定触发可观察的删除诊断事件，因此删除/恢复测试暂不纳入稳定回归，后续需先确定可靠的文件事件触发方式再补测。
- 已核对命令贡献与实际注册，仅保留已注册的 `annil.fix-all`；移除未迁移的 `annil.check-all`、创建组件/页面、miniTest 和旧注释命令贡献。
- 已收紧 `.vscodeignore`，VSIX 从 161 个文件缩减为 8 个运行时/发布文件；`vscode-annil-0.10.20.vsix` 打包成功。
- 发布前 `pnpm check`、`pnpm compile` 和完整 Extension Host 测试均通过。
