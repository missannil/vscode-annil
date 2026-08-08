/**
 * collectExternalSubComponentSources 测试
 *
 * 验证 DefineComponent.subComponents 中通过值导入、定义在外部文件的子组件，
 * 能按 CustomComponent<Root, $X> 的第二个泛型参数 $X 找到类型导入源。
 */
import { assert, fileURLToPath, fs, path } from "#deps";
import { describe as suite, it as test } from "mocha";

import { configuration } from "../../../_src/configuration/index.js";
import {
  collectExternalComponentInfo,
  collectExternalSubComponentSources,
} from "../../../_src/core/tsAnalyzer/collectExternalSubComponentSources.js";
import { traverseAst, type TraverseAstResult } from "../../../_src/core/tsAnalyzer/index.js";
import { resolveImportedSubComponentPaths } from "../../../_src/core/tsAnalyzer/resolveImportedSubComponentPaths.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseFile(fsPath: string): Promise<TraverseAstResult> {
  return Promise.resolve(traverseAst(fsPath, fs.readFileSync(fsPath, "utf-8"), configuration.innerDataPrefix));
}

suite("collectExternalSubComponentSources", () => {
  const pageFsPath = path.resolve(
    __dirname,
    "../../../..",
    "_test/miniprogram/pages/index/index.ts",
  );

  test("合并外部文件中定义的子组件类型导入源", async () => {
    const pageInfo = traverseAst(
      pageFsPath,
      fs.readFileSync(pageFsPath, "utf-8"),
      configuration.innerDataPrefix,
    );
    const sources = await collectExternalSubComponentSources(pageFsPath, pageInfo, parseFile);

    assert.deepStrictEqual(sources, {
      subInline: "~/subInline/index.js",
      subExternal: "~/subExternal/subExternal.js",
    });
  });

  test("记录主组件依赖的外部 TS 文件", async () => {
    const pageInfo = traverseAst(
      pageFsPath,
      fs.readFileSync(pageFsPath, "utf-8"),
      configuration.innerDataPrefix,
    );
    const info = await collectExternalComponentInfo(pageFsPath, pageInfo, parseFile);

    assert.deepStrictEqual(info.dependencies, [
      path.resolve(__dirname, "../../../..", "_test/miniprogram/pages/index/useSubExternal.ts"),
    ]);
  });

  test("合并后的来源可解析为 usingComponents 路径", async () => {
    const pageInfo = traverseAst(
      pageFsPath,
      fs.readFileSync(pageFsPath, "utf-8"),
      configuration.innerDataPrefix,
    );
    const sources = await collectExternalSubComponentSources(pageFsPath, pageInfo, parseFile);
    const paths = resolveImportedSubComponentPaths(pageFsPath, sources);

    assert.deepStrictEqual(paths, {
      subInline: "/components/subInline/index",
      subExternal: "/components/subExternal/subExternal",
    });

    assert.deepStrictEqual(
      resolveImportedSubComponentPaths(pageFsPath, {
        cart: "./components/cart/cart",
        page: "~/subExternal/subExternal",
      }),
      {
        cart: "/pages/index/components/cart/cart",
        page: "/components/subExternal/subExternal",
      },
    );
  });
});
