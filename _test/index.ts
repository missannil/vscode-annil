import Mocha from "mocha";
import { readdirSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// 顶层日志：确认模块被 VS Code 加载
console.log("[test] suite/index 模块已加载");

// ESM 中手动推导 __filename
const __filename = fileURLToPath(import.meta.url);
// ESM 中手动推导 __dirname
const __dirname = path.dirname(__filename);

// VS Code 通过 --extensionTestsPath 加载时，要求 export 此函数
export async function run(): Promise<void> {
  // 确认 run() 被 VS Code 调用
  console.log("[test] run() 被调用");
  // 创建 Mocha 实例，使用 BDD 风格（describe/it）
  const mocha = new Mocha({ ui: "bdd", color: true });
  // 测试文件所在目录 = 当前文件同级
  const testsRoot = path.resolve(__dirname, "./suite");
  // 扫描 suite/ 目录下所有 .test.js 文件（递归）
  const files = readdirSync(testsRoot, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".test.js"))
    .map((d) => path.join(d.parentPath, d.name));
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
