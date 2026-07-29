import Mocha from "mocha";
import { existsSync, readdirSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// ESM 中手动推导 __filename
const __filename = fileURLToPath(import.meta.url);
// ESM 中手动推导 __dirname
const __dirname = path.dirname(__filename);

/**
 * 本地开发时只运行指定测试文件或目录；保持为空即运行全部测试。
 *
 * 在此取消注释目标条目即可切换，路径相对于 `_test/suite`，使用源文件的
 * `.test.ts` 后缀即可。目录会包含其下全部测试文件。
 */
const manuallyFocusedTests: readonly string[] = [
  // "testSelection.test.ts",
  // "tsAnalyzer/traverseAst.test.ts",
  // "guardCheck.test.ts",
  // "jsonParser/jsonParser.test.ts",
  // "jsonValidator/unknownImports/unknownImports.test.ts",
  // "jsonValidator/unknownPlaceholder/unknownPlaceholder.test.ts",
  // "jsonValidator/fixAll/fixAll.test.ts",
  // "jsonValidator/unknownConfigKey/unknownConfigKey.test.ts",
  // "jsonValidator/missingPlaceholder/missingPlaceholder.test.ts",
  // "jsonValidator/invalidPath/invalidPath.test.ts",
  // "jsonValidator/missingImports/missingImports.test.ts",
  // "jsonValidator/validAlias/validAlias.test.ts",
  // "wxmlValidator/element/duplicateId/duplicateId.test.ts",
  // "wxmlValidator/element/unknownTag/unknownTag.test.ts",
  // "wxmlValidator/comment/all/all.test.ts",
  // "wxmlValidator/comment/invalidComment/invalidComment.test.ts",
  // "wxmlValidator/comment/invalidComment/invalidComment.codeAction.test.ts",
  // "wxmlValidator/comment/line/line.test.ts",
  // "wxmlValidator/comment/startEnd/startEnd.test.ts",
  // "wxmlValidator/comment/startEnd/startEnd.codeAction.test.ts",
  // "wxmlValidator/comment/fixAll/fixAll.codeAction.test.ts",
  // "wxmlValidator/comment/noStart/noStart.test.ts",
  // "wxmlValidator/comment/noStart/noStart.codeAction.test.ts",
  // "wxmlValidator/comment/invalidLocation/invalidLocation.test.ts",
  // "wxmlValidator/comment/invalidLocation/invalidLocation.codeAction.test.ts",
  // "wxmlValidator/comment/repeatedLine/repeatedLine.test.ts",
  // "wxmlValidator/comment/repeatedLine/repeatedLine.codeAction.test.ts",
  // "wxmlValidator/comment/repeatedStart/repeatedStart.test.ts",
  // "wxmlValidator/comment/repeatedRepeatTag/repeatedRepeatTag.test.ts",
  // "wxmlValidator/comment/startScope/startScope.test.ts",
  // "wxmlValidator/comment/repeatTag/repeatTag.test.ts",
];

function getFocusedTests(): readonly string[] {
  const testFilter = process.env.ANNIL_TEST_FILTER;
  if (testFilter === undefined) return manuallyFocusedTests;

  return testFilter.split(",").map((testPath) => testPath.trim()).filter(Boolean);
}

const focusedTests = getFocusedTests();

function normalizeFocusedTestPath(testPath: string): string {
  return testPath
    .replaceAll("\\", "/")
    .replace(/\.test\.ts$/, ".test.js")
    .replace(/^\.\//, "")
    .replace(/\/$/, "");
}

/** 校验聚焦目标存在于测试目录内，并返回规范化后的相对路径。 */
export function validateFocusedTestPaths(
  sourceTestsRoot: string,
  configuredPaths: readonly string[],
): readonly string[] {
  if (configuredPaths.length === 0) return [];

  const focusedPaths = configuredPaths.map(normalizeFocusedTestPath);
  for (const focusedPath of focusedPaths) {
    const sourceRelativePath = focusedPath.replace(/\.test\.js$/, ".test.ts");
    const absolutePath = path.resolve(sourceTestsRoot, sourceRelativePath);
    const relativePath = path.relative(sourceTestsRoot, absolutePath);
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath) || !existsSync(absolutePath)) {
      throw new Error(`聚焦测试路径不存在：${focusedPath}`);
    }
  }

  return focusedPaths;
}

/** 过滤已删除源文件遗留在 out/ 中的编译测试。 */
export function filterSourceBackedTestFiles(
  discoveredFiles: readonly string[],
  compiledTestsRoot: string,
  sourceTestsRoot: string,
): string[] {
  return discoveredFiles.filter((filePath) => {
    const relativePath = path.relative(compiledTestsRoot, filePath);
    const sourcePath = path.resolve(
      sourceTestsRoot,
      relativePath.replace(/\.test\.js$/, ".test.ts"),
    );

    return existsSync(sourcePath);
  });
}

// VS Code 通过 --extensionTestsPath 加载时，要求 export 此函数
export async function run(): Promise<void> {
  // dot 报告器仅输出最小进度；失败详情仍由 Mocha 输出。
  const mocha = new Mocha({ ui: "bdd", color: true, reporter: "dot" });
  // 测试文件所在目录 = 当前文件同级
  const testsRoot = path.resolve(__dirname, "./suite");
  const sourceTestsRoot = path.resolve(__dirname, "../../_test/suite");
  // 扫描 suite/ 目录下所有 .test.js 文件（递归）
  const discoveredFiles = readdirSync(testsRoot, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".test.js"))
    .map((d) => path.join(d.parentPath, d.name));
  const sourceBackedFiles = filterSourceBackedTestFiles(discoveredFiles, testsRoot, sourceTestsRoot);
  const focusedPaths = validateFocusedTestPaths(sourceTestsRoot, focusedTests);
  const files = focusedPaths.length === 0
    ? sourceBackedFiles
    : sourceBackedFiles.filter((filePath) => {
      const relativePath = path.relative(testsRoot, filePath).split(path.sep).join("/");

      return focusedPaths.some((focusedPath) =>
        relativePath === focusedPath || relativePath.startsWith(`${focusedPath}/`)
      );
    });
  // 逐个添加测试文件到 Mocha
  files.forEach((f) => mocha.addFile(f));

  // 运行 Mocha，返回 Promise，失败则 reject
  return new Promise((resolve, reject) => {
    mocha.run((failures) => {
      // 若有测试失败，reject 并告知失败数量
      if (failures > 0) {
        reject(new Error(`${failures} tests failed.`));
      } else {
        // 全部通过则 resolve
        resolve();
      }
    });
  });
}
