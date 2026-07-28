## 当前评估

静态类型检查目前没有发现错误，但核心链路仍有以下问题：

### 高优先级

2. **WXML 合法数据集合不完整**
   - `validNames` 目前只有 Root 数据和用户配置。
   - 没有合并 CustomComponent `configInfo` 中 `Root`、`Self` 类型的数据。
   - 位置见 `_src/core/wxmlValidator/wxmlChecker.ts` 第 23 行。

3. **ChunkComponent 尚未进入 WXML 校验**
   - TS 分析已经生成 `chunkComponentInfoRecord`，但 WXML 入口完全没有消费它。
   - `WxmlValidationContext` 虽预留 chunk 作用域，当前仍为空壳。
   - 相关位置：`_src/core/types/TsFileInfo.ts` 第 90–114 行、`_src/core/wxmlValidator/context.ts` 第 20–30 行。

4. **循环作用域未实现**
   - 当前直接永久放过 `item` 和 `index`。
   - 不支持 `wx:for-item`、`wx:for-index` 自定义名称，也不能判断变量是否已经离开循环作用域。
   - 位置见 `_src/core/wxmlValidator/wxmlChecker.ts` 的 `checkMustacheMatches()`。

5. **大部分 WXML Quick Fix 实际无法触发**
   - Code Action 只处理 `source === "vscode-annil"` 的诊断。
   - 除注释诊断外，大部分 WXML 诊断没有设置 `source`。
   - 过滤位置见 `_src/codeActionProvider/index.ts` 的 `WxmlCodeActionProvider`。

6. **JSON 校验尚未接入**
   - JSON 校验代码已经存在，但 Linter 中被注释。
   - 不能简单解除注释，因为当前 TS 分析还没有提供可靠的“组件标签 → import 路径”映射。
   - 相关位置：`_src/linter/index.ts`、`_src/core/jsonValidator/index.ts`。

### 中优先级

- 重复 mustache 会被定位到第一次出现的位置：`_src/core/wxmlValidator/wxmlChecker.ts` 的 `findMustachePosition()`。
- CustomComponent 诊断范围固定从行首开始：`_src/core/wxmlValidator/customComponent/validateCustomComponent.ts` 的 `addDiagnostic()`。
- `allowUnknownAttributes` 配置尚未用于属性验证。
- 加法、函数调用、三元表达式被直接跳过，存在明显漏报。
- 首次读取兄弟文件失败后仍会将目录加入 `#checkedDirs`，后续可能无法恢复。
- 配置变化只更新内存值，不会清缓存或重新诊断。
- `package.json` 暴露了多个尚未注册的命令。

## 后续计划：稳定核心诊断

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

旧目录 `src`、`test` 和 `miniTest` 仅作为参考，不作修改。完整计划已保存，可在确认后交接执行。
