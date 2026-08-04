# 重构测试目录说明

## 目录职责

- `miniprogram/`：共享的小程序项目环境。这里保留 `app`、页面、共享组件、别名、项目配置和跨文件依赖，用于项目级或基础逻辑测试。
- `suite/`：测试套件及规则专属 fixture。
- `suite/wxmlValidator/`：WXML 规则测试。每个规则目录拥有独立的最小真实组件，不依赖 `miniprogram/` 中的业务组件。

## WXML 规则测试

每条 WXML 规则在 `suite/wxmlValidator/<规则目录>/` 下维护以下同名文件：

```text
<规则目录>/
├─ <场景>.ts
├─ <场景>.json
├─ <场景>.wxml
└─ <场景>.test.ts
```

测试必须在 Extension Host 中打开真实组件文件，等待插件发布诊断后断言诊断消息、`source`、`code` 和 `Range`。不要直接调用 `_src` 中的 parser、analyzer 或 validator，也不要以字符串构造虚拟组件源码。

每条诊断规则均应包含反向与正向覆盖：反向用例验证非法输入产生指定诊断，正向覆盖优先由功能用例验证合法输入的实际作用及不产生诊断。仅在没有功能用例可覆盖时，才新增独立的最小合法用例。正向用例必须等待目标文档完成一次诊断发布后才断言空列表，不能在打开文档后立即读取空诊断列表。

## WXML 规则归类

- `comment/`：Annil 注释状态、位置和注释修复。
- `element/`：与组件 API 无关的通用元素规则，例如 `duplicateId/`、`unknownTag/`。
- `element/chunkTag/`：Chunk 标签识别、Chunk 数据或事件作用域、嵌套 Chunk。
- `dataBinding/`：RootComponent 数据、插值、表达式、未知数据和定位。
- `scope/`：`wx:for`、`wx:for-item`、`wx:for-index`、嵌套和变量遮蔽。
- `customComponent/`：CustomComponent 的属性名、属性值、事件绑定和 `Root`、`Self`、`Custom`、`Ternary` 契约。

如果一个场景涉及多项规则，按主要断言的业务所有者放置；另一个规则仅作为 fixture 前置条件。

## CustomComponent 示例目录规范

`customComponent/` 下的目录应与 `wxmlChecker` 对自定义组件的校验阶段保持一一对应，先按规则阶段归类，再按属性契约类型拆分场景：

```text
customComponent/
├─ missingAttr/
│  ├─ missingAttrRoot/      # Root 属性缺失
│  ├─ missingAttrEvents/    # Events 属性缺失
│  ├─ missingAttrSelf/      # Self 属性缺失
│  ├─ missingAttrCustom/    # Custom 属性缺失
│  └─ missingAttrTernary/   # Ternary 属性缺失
├─ invalidValue/
│  ├─ eventsValue/          # Events 值错误
│  ├─ rootValue/            # Root 值错误
│  ├─ selfValue/            # Self 值错误
│  ├─ customValue/          # Custom 值错误（后续新增）
│  └─ ternaryValue/         # Ternary 值错误（后续新增）
└─ unknownAttr/
  ├─ plainName/            # 普通属性名形式的未知属性
  └─ kebabCase/            # 连字符属性名的规范化校验
```

当前实现中的校验顺序如下，测试示例应优先覆盖对应阶段，而不要仅按诊断消息随意命名目录：

1. 通过 `customComponentInfoRecord[node.name]` 判断当前标签是否为已识别的 `CustomComponent`；当前实现没有单独的 `isComponentElement` 函数。
2. 检查重复组件标签。
3. 校验组件上的 `wx:*` 属性；该校验使用当前 WXML 作用域。
4. 根据 `configInfo` 检查缺失属性，示例放入 `missingAttr/`。
5. 检查实际属性名是否未知，示例放入 `unknownAttr/`。
6. 对已识别的属性值按 `AttrValue` 类型校验：`Events`、`Root`、`Self`、`Custom`、`Ternary`，错误值示例放入 `invalidValue/`。

CustomComponent 的 Custom 值表示由 WXML 调用上下文提供，不能因为它不是 Root 或 Self 数据就直接视为错误。属性值中的表达式应使用当前有效作用域校验，包括 Root 数据、`wx:for-item`、`wx:for-index` 和外层 Chunk 数据；因此 `missingAttr/missingAttrCustom/` 应保留 `wx:for` 场景作为正向覆盖。

Annil 组件控制流的 WXML 约定是：`wx:if`、`wx:for` 等控制属性写在外层 `block` 上，由 `block` 包裹 `CustomComponent`；不要直接把这些属性写在自定义组件标签上。涉及循环变量的 fixture 应使用 `<block wx:for="{{list}}"><subInline ... /></block>` 形式。

每个叶子示例目录继续使用同名的 `.ts`、`.json`、`.wxml` 和 `.test.ts` 文件。若某一规则出现并列的属性契约类型，应先建立规则总目录，再在其下建立类型子目录；不要将同一规则的并列示例继续放在 `customComponent/` 根目录。

迁移、拆分或删除 fixture 时，必须同步迁移、更新或删除所有引用旧 fixture 路径的 `*.test.ts`。测试入口按源测试文件发现测试，不会因为同目录 `.ts`、`.json` 或 `.wxml` 已删除而自动排除遗留测试。

## 聚焦运行单个测试

未指定 CLI 筛选参数时，测试入口运行 `_test/index.ts` 的
`manuallyFocusedTests` 数组中的文件或目录；路径相对于 `_test/suite`，使用源文件
`.test.ts` 路径即可。例如：

```ts
const manuallyFocusedTests: readonly string[] = [
  "wxmlValidator/element/chunkTag/chunkTag.test.ts",
  // "wxmlValidator/dataBinding/",
];
```

完成一个测试示例并通过后，应将其路径改为注释而非删除，以保留最近执行记录；新增下一示例时只取消注释当前路径。`manuallyFocusedTests` 没有启用条目时恢复全量测试，确保 CI 和完整回归覆盖所有测试。

## CLI 自动运行

`pnpm test:extension` 会在独立的 Extension Host 中运行测试，不会关闭或修改当前打开的 VS Code。运行器优先使用本机已安装的 VS Code；仅在未找到本机可执行文件时下载测试版本。测试用户数据和扩展缓存隔离在临时 profile 中，测试结束后自动删除。

通过 `ANNIL_TEST_FILTER` 指定相对于 `_test/suite` 的测试文件或目录，避免编辑 `manuallyFocusedTests`：

```text
ANNIL_TEST_FILTER=wxmlValidator/comment/textError/textError.test.ts pnpm test:extension
```

不设置该变量时，CLI 使用 `manuallyFocusedTests`；该数组为空时才运行全部测试。设置变量后，该路径会覆盖手动聚焦配置。不要使用命令行 `--` 传递路径，当前运行器会将其作为路径的一部分。CLI 不执行 `clean`，并会在运行期间创建临时锁文件以阻止两个 CLI 测试进程并发。测试成功时仅输出一行 `PASS`；失败时才输出 Extension Host 的完整日志。自动化代理应自行运行 CLI 并读取结果，无需用户手动执行或反馈。

## Extension Host 测试运行流程

执行 **Run Annil (调试)** 时，VS Code 会先执行 `tsc-watch` 任务，将 `_src/` 和 `_test/`
编译到 `out/`。随后启动新的 Extension Host，并传入：

```text
<workspace>/_test
--extensionDevelopmentPath=<workspace>
```

Extension Host 手动调试时按以下顺序启动：

1. 加载 `out/extension.js`，激活 Annil 扩展。
2. 以 `<workspace>/_test` 作为 Extension Host 的初始工作区。

自动测试通过 `pnpm test:extension` 运行：它额外编译测试入口、加载 `out/_test/index.js`，再递归扫描 `out/_test/suite/**/*.test.js` 并执行 Mocha 测试。

测试运行的是 `out/` 中的 JavaScript，而不是直接运行 `_test/` 中的 TypeScript。

## 启动与测试配置

`.vscode/launch.json` 当前提供一个配置，以 `_test` 目录作为 Extension Host 的初始工作区，并在启动前执行 `tsc-watch`。

| 配置                 | 额外参数                  | 用途                                                          |
| -------------------- | ------------------------- | ------------------------------------------------------------- |
| **Run Annil (调试)** | 无 `--extensionTestsPath` | 打开普通开发 Extension Host，用于手工操作插件和调试扩展功能。 |

## tasks.json 与 launch.json 的关系

`.vscode/tasks.json` 定义的是“任务”，`.vscode/launch.json` 定义的是“如何启动和调试”。
两者通过 `preLaunchTask` 连接起来。

当前任务关系如下：

```text
create:extension-entry
  └─ 生成开发入口 out/extension.js

tsc-watch（默认 build 任务）
  └─ dependsOn: create:extension-entry
  └─ 执行 pnpm exec tsc --watch
  └─ 持续将 _src/、_test/ 编译到 out/

Run Annil (调试)
  └─ preLaunchTask: tsc-watch
  └─ TypeScript 编译就绪后启动 Extension Host
```

`dev` 之所以是默认构建任务，是因为它配置了：

```jsonc
"group": {
  "kind": "build",
  "isDefault": true
}
```

`launch.json` 直接指定 `preLaunchTask: "tsc-watch"`，不依赖 VS Code 推断默认任务。

### 两个任务的作用

| 任务                     | 对应 npm script         | 作用                              |
| ------------------------ | ----------------------- | --------------------------------- |
| `create:extension-entry` | shell 命令              | 生成开发入口 `out/extension.js`。 |
| `tsc-watch`              | `pnpm exec tsc --watch` | 持续编译源码和测试。              |

`tsc-watch` 是后台任务，因为 `tsc --watch` 会持续运行；`$tsc-watch` problem matcher 用于通知 VS Code 编译是否已经就绪以及是否存在 TypeScript 错误。

### Run Annil (调试) 的完整顺序

1. VS Code 读取 **Run Annil (调试)** 的 `launch.json` 配置。
2. 执行 `preLaunchTask: tsc-watch`。
3. `tsc-watch` 先执行 `create:extension-entry`，准备 `out/extension.js` 的开发入口。
4. 执行 `tsc --watch`，编译 `_src/` 和 `_test/` 到 `out/`。
5. 编译任务通过 `$tsc-watch` 报告就绪后，VS Code 启动 Extension Host。
6. Extension Host 加载扩展，并以 `<workspace>/_test` 作为初始工作区。

自动测试不使用该 F5 配置，直接运行 `pnpm test:extension`。

如果只是想手动编译并持续监听，可以在 **Tasks: Run Task** 中选择 `tsc-watch`。生产构建使用 `pnpm run build`，完整 Extension Host 测试使用 `pnpm test:extension`。

## 失败时调试

测试完成或失败后，测试入口会 resolve/reject，Extension Host 随之结束；这是测试运行器需要向 VS Code 返回明确结果的正常行为，不应在默认配置中永久保持进程运行。

推荐调试方式：

1. 在 `manuallyFocusedTests` 中只保留目标测试文件。
2. 在目标 `*.test.ts`、对应 fixture，或 `_src/` 规则实现中设置断点。
3. 使用 **Run Annil (调试)** 启动；自动化测试使用 `pnpm test:extension`，需要断点调试测试时应临时增加带 `--extensionTestsPath` 的专用配置。
4. 也可以启用 VS Code 的 _Caught Exceptions_ / _Uncaught Exceptions_ 异常断点，定位断言失败或插件异常。

如果确实需要在失败位置暂停而不是立即结束，应额外创建一个仅供本地使用的“测试调试”启动配置：用环境变量控制测试入口在失败后执行 `debugger`，检查完成后继续执行并让测试仍以失败状态结束。不要通过永不 resolve 的 Promise 阻塞默认测试，否则会使 CI 和正常回归测试挂起。

## Helper

`wxmlValidator` 根目录的 helper 只提供打开组件、等待诊断、编辑和清理等通用能力，不包含具体规则断言。
