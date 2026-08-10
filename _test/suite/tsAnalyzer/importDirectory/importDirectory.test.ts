import { assert, fileURLToPath, path } from "#deps";
import { describe as suite, it as test } from "mocha";
import { resolveImportedTsPath } from "../../../../_src/core/tsAnalyzer/tsConfigResolver.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Extension Host 测试运行在 out/ 编译目录，fixture 需要映射回源码 _test 目录。
const fixtureDir = path.resolve(
  __dirname,
  "../../../../../_test/suite/tsAnalyzer/importDirectory",
);

suite("importDirectory", () => {
  test("import 指向同名目录时不解析为导入目标，避免后续 readFileSync 抛 EISDIR", () => {
    const tsFsPath = path.join(fixtureDir, "importDirectory.ts");

    // `./subdir` 是目录（非文件）：候选 `subdir` 虽然存在，但不是文件，
    // 必须返回 undefined，不能把目录交给 fs.readFileSync。
    assert.strictEqual(resolveImportedTsPath(tsFsPath, "./subdir"), undefined);
  });

  test("同目录 .ts 与目录内 .ts 正常解析", () => {
    const tsFsPath = path.join(fixtureDir, "importDirectory.ts");

    assert.strictEqual(
      resolveImportedTsPath(tsFsPath, "./helper"),
      path.join(fixtureDir, "helper.ts"),
    );
    assert.strictEqual(
      resolveImportedTsPath(tsFsPath, "./subdir/helper"),
      path.join(fixtureDir, "subdir/helper.ts"),
    );
  });
});
