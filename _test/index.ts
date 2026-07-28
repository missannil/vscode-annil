import Mocha from "mocha";
import { readdirSync } from "node:fs";
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
  // "tsAnalyzer/traverseAst.test.ts",
  // "guardCheck.test.ts",
  // "jsonParser/jsonParser.test.ts",
  "wxmlValidator/comment/invalidComment/invalidComment.test.ts",
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

function shouldRunTest(filePath: string, testsRoot: string): boolean {
  if (focusedTests.length === 0) return true;

  const relativePath = path.relative(testsRoot, filePath).split(path.sep).join("/");

  return focusedTests
    .map(normalizeFocusedTestPath)
    .some((focusedPath) => relativePath === focusedPath || relativePath.startsWith(`${focusedPath}/`));
}

// VS Code 通过 --extensionTestsPath 加载时，要求 export 此函数
export async function run(): Promise<void> {
  // dot 报告器仅输出最小进度；失败详情仍由 Mocha 输出。
  const mocha = new Mocha({ ui: "bdd", color: true, reporter: "dot" });
  // 测试文件所在目录 = 当前文件同级
  const testsRoot = path.resolve(__dirname, "./suite");
  // 扫描 suite/ 目录下所有 .test.js 文件（递归）
  const files = readdirSync(testsRoot, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".test.js"))
    .map((d) => path.join(d.parentPath, d.name))
    .filter((filePath) => shouldRunTest(filePath, testsRoot));
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
