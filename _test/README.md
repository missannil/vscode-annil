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

可在命令后提供一个相对于 `_test/suite` 的测试文件或目录，避免编辑 `manuallyFocusedTests`：

```text
pnpm test:extension -- wxmlValidator/comment/textError/textError.test.ts
```

不提供路径时，CLI 使用 `manuallyFocusedTests`；该数组为空时才运行全部测试。提供路径时，该路径会覆盖手动聚焦配置。CLI 不执行 `clean`，并会在运行期间创建临时锁文件以阻止两个 CLI 测试进程并发。测试成功时仅输出一行 `PASS`；失败时才输出 Extension Host 的完整日志。自动化代理应自行运行 CLI 并读取结果，无需用户手动执行或反馈。

## Extension Host 测试运行流程

执行 **Run Annil Tests** 时，VS Code 会先执行默认构建任务，将 `_src/` 和 `_test/`
编译到 `out/`。随后启动新的 Extension Host，并传入：

```text
--extensionDevelopmentPath=<workspace>
--extensionTestsPath=<workspace>/out/_test/index.js
```

Extension Host 按以下顺序运行：

1. 加载 `out/extension.js`，激活 Annil 扩展。
2. 扩展初始化配置、Linter、诊断集合和 Code Action Provider。
3. 加载 `out/_test/index.js`，调用其导出的 `run()`。
4. 测试入口递归扫描 `out/_test/suite/**/*.test.js`，再按 CLI 路径或 `manuallyFocusedTests` 过滤。
5. Mocha 加载选中的测试文件，注册并执行 `describe`、`before`、`it`、`after`。
6. WXML 测试通过 Extension Host 打开同目录的真实 `.wxml` 组件文件。
7. Linter 读取组件的 `.ts`、`.json`、`.wxml`，发布诊断；测试等待并断言诊断结果。
8. Mocha 汇总结果：全部通过时 `run()` 成功返回，存在失败时拒绝并结束测试会话。

测试运行的是 `out/` 中的 JavaScript，而不是直接运行 `_test/` 中的 TypeScript。

## 两种启动配置

`.vscode/launch.json` 中的两个配置都会以当前工作区作为开发扩展启动，并在启动前执行默认构建任务。

| 配置                 | 额外参数                                  | 用途                                                           |
| -------------------- | ----------------------------------------- | -------------------------------------------------------------- |
| **Run Annil (调试)** | 无 `--extensionTestsPath`                 | 打开普通开发 Extension Host，用于手工操作插件和调试扩展功能。  |
| **Run Annil Tests**  | `--extensionTestsPath=out/_test/index.js` | 用于断点调试测试；日常自动验证优先使用 `pnpm test:extension`。 |

因此，二者的核心差异确实源于 `--extensionTestsPath`：它要求 VS Code 在扩展激活后加载测试入口并等待其结果。

## tasks.json 与 launch.json 的关系

`.vscode/tasks.json` 定义的是“任务”，`.vscode/launch.json` 定义的是“如何启动和调试”。
两者通过 `preLaunchTask` 连接起来。

当前任务关系如下：

```text
clean
  └─ 删除旧的 out/ 和遗留编译文件

dev（默认 build 任务）
  └─ dependsOn: clean
  └─ 执行 npm run dev，即 tsc --watch
  └─ 持续将 _src/、_test/ 编译到 out/

Run Annil / Run Annil Tests
  └─ preLaunchTask: ${defaultBuildTask}
  └─ 解析为 dev
  └─ dev 先执行 clean，再启动 tsc --watch
  └─ TypeScript 编译就绪后启动 Extension Host
```

`dev` 之所以是默认构建任务，是因为它配置了：

```jsonc
"group": {
  "kind": "build",
  "isDefault": true
}
```

所以 [launch.json](../.vscode/launch.json) 中的：

```jsonc
"preLaunchTask": "${defaultBuildTask}"
```

会自动选择 `dev`。而 `dev` 的：

```jsonc
"dependsOn": ["clean"]
```

会保证每次启动构建流程时先执行 `clean`。因此 `clean` 不是默认任务，但并不是没有作用；它是 `dev` 的依赖任务，也可以通过 **Tasks: Run Task** 手动执行。

### 两个任务的作用

| 任务    | 对应 npm script | 作用                                                  |
| ------- | --------------- | ----------------------------------------------------- |
| `clean` | `npm run clean` | 删除 `out/` 以及 `_src/`、`_test/` 中遗留的编译文件。 |
| `dev`   | `npm run dev`   | 先清理，再运行 `tsc --watch`，持续编译源码和测试。    |

`dev` 是后台任务，因为 `tsc --watch` 会持续运行；`$tsc-watch` problem matcher 用于通知 VS Code 编译是否已经就绪以及是否存在 TypeScript 错误。

### Run Annil Tests 的完整顺序

1. VS Code 读取 **Run Annil Tests** 的 `launch.json` 配置。
2. 执行 `preLaunchTask: ${defaultBuildTask}`，找到默认任务 `dev`。
3. `dev` 先执行依赖任务 `clean`。
4. `dev` 执行 npm 的 `predev` 生命周期脚本，准备 `out/extension.js` 的开发入口。
5. 执行 `tsc --watch`，编译 `_src/` 和 `_test/` 到 `out/`。
6. 编译任务通过 `$tsc-watch` 报告就绪后，VS Code 启动 Extension Host。
7. Extension Host 加载扩展，并根据 `--extensionTestsPath` 加载 `out/_test/index.js`。
8. 测试入口筛选测试文件，交给 Mocha 执行。

如果只是想手动编译并持续监听，可以在 **Tasks: Run Task** 中选择 `dev`；如果只想删除旧产物，可以单独选择 `clean`。通常不需要手动先运行 `clean` 再运行 `dev`，因为 `dev` 已经通过 `dependsOn` 自动依赖了它。

## 失败时调试

测试完成或失败后，测试入口会 resolve/reject，Extension Host 随之结束；这是测试运行器需要向 VS Code 返回明确结果的正常行为，不应在默认配置中永久保持进程运行。

推荐调试方式：

1. 在 `manuallyFocusedTests` 中只保留目标测试文件。
2. 在目标 `*.test.ts`、对应 fixture，或 `_src/` 规则实现中设置断点。
3. 使用 **Run Annil Tests** 启动；Extension Host 调试器会在断点处暂停，可检查诊断、缓存和当前编辑器状态。
4. 也可以启用 VS Code 的 _Caught Exceptions_ / _Uncaught Exceptions_ 异常断点，定位断言失败或插件异常。

如果确实需要在失败位置暂停而不是立即结束，应额外创建一个仅供本地使用的“测试调试”启动配置：用环境变量控制测试入口在失败后执行 `debugger`，检查完成后继续执行并让测试仍以失败状态结束。不要通过永不 resolve 的 Promise 阻塞默认测试，否则会使 CI 和正常回归测试挂起。

## Helper

`wxmlValidator` 根目录的 helper 只提供打开组件、等待诊断、编辑和清理等通用能力，不包含具体规则断言。
