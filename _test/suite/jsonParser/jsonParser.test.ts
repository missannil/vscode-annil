/**
 * jsonParser 测试
 *
 * 读取同目录的 demo.json，调用 jsonParser.parse 获取 JsonFileInfo，
 * 与 expectJsonInfo.ts 中的预期数据做验证。
 */
import { assert, fileURLToPath, path } from "#deps";
import { describe as suite, it as test } from "mocha";
import { Uri } from "vscode";

import { jsonParser } from "../../../_src/core/fileManager/jsonParser.js";
import { expectJsonInfo } from "./expectJsonInfo.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 编译后 __dirname 在 out/_test/suite/jsonParser/，需回到项目根再进入 _test/
const PROJECT_ROOT = path.resolve(__dirname, "../../../..");

/** demo.json 的绝对路径 */
const DEMO_JSON_PATH = path.join(PROJECT_ROOT, "_test/suite/jsonParser/demo.json");

suite("jsonParser", () => {
  test("parse demo.json 返回的 JsonFileInfo 与 expectJsonInfo 一致", async () => {
    const uri = Uri.file(DEMO_JSON_PATH);

    // 清缓存确保从磁盘读取
    jsonParser.invalidate(uri.fsPath);

    const info = await jsonParser.parse(uri);

    assert.deepStrictEqual(info.config, expectJsonInfo.config);
    // 把\r\n换成\n再去掉换行符，避免不同平台换行符差异导致断言失败
    assert.strictEqual(
      info.text.replace(/\r\n/g, "\n").split("\n").join(""),
      expectJsonInfo.text.replace(/\r\n/g, "\n").split("\n").join(""),
    );
  });
});
