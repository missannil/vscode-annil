# TypeScript / ESM / CJS / Node.js 配置总结

## 模块系统

当前项目(重构)使用esm模块系统。

在node.js中，模块系统有两种：CommonJS（CJS）和ES Module（ESM）。
v12.0.0：开始实验性支持 ESM（需配合 --experimental-modules 标志使用）。
v13.2.0：正式支持 ESM，但运行时仍会抛出“实验性警告（ExperimentalWarning）”。
v14.13+：ESM 成为完全稳定的特性，移除了实验性警告，开发者可以放心在生产环境中使用。
VS Code 核心代码迁移到 ESM：v1.94 版本（2024年9月）
扩展（插件）正式支持 ESM：v1.100 版本（2025年5月）

- `"type": "module"` 告诉 **Node.js 项目中的`.js` 文件 按 ESM 加载**，不控制 TS 源码写什么,
- `"module": "NodeNext"` / `"moduleResolution": "NodeNext"` 是 TS 编译器配置，控制 TS 如何解析导入和输出格式

## NodeNext 后缀规则（TS 6.0）

- `import type` 永远不需要后缀（编译时擦除）
- npm 包路径永远不需要后缀（`"lodash"`, `"vscode"`）
- 相对路径值导入理论上需要 `.js` 后缀，
- node内置模块（`fs`, `path`, `url`）建议使用node:前缀（`import fs from "node:fs"`），避免与npm包冲突

## 想让ts代码中使用require时报错(即强制只写 import)的方法

- ESLint 规则 `@typescript-eslint/no-require-imports: "error"`

## Rollup → esbuild 迁移

- Rollup 需要 resolve/ts/commonjs/json 等多个插件
- esbuild 一行命令搞定，内置 TS/CJS/JSON/node_modules 支持
- esbuild 没有 `--config` 标志，用 `node config.mjs` 执行

## 配置文件(esbuild.config.js)类型提示

- 使用 `// @ts-check` 开启类型检查 对 node:process 报错,可能与@ts-check 查找类型方式与pnpm有冲突?
- 在tsconfig的include中添加 `"esbuild.config.js"` 让tsserver识别类型可以，但要开启`"checkJs": true`，否则不会报错,但这样ts会认为编译会使得esbuild.config.js修改自身,所以报错，既然使用esbuild打包时自动编译ts所以，就在tsconfig中加入 `noEmit: true`, 让tsserver不再编译esbuild.config.js, 这样就不会报错了

## 关于 dprint

- dprint 支持 npm 包（不是 Deno 专属），被 pnpm 正常管理
