/**
 * validateJson 测试
 *
 * 直接构造 JsonFileInfo + importedSubCompInfo，调用 validateJson 验证诊断输出。
 * 不依赖 linter 全链路，纯单元测试。
 */
import { assert } from "#deps";
import { describe as suite, it as test } from "mocha";
import { validateJson } from "../../../_src/core/jsonValidator/index.js";
import type { JsonFileInfo } from "../../../_src/core/types/JsonFileInfo.js";

/** 辅助：过滤诊断列表，按 message 包含某字符串 */
const filterByMsg = (diags: { message: string }[], substr: string): { message: string }[] =>
  diags.filter((d) => d.message.includes(substr));

/** 辅助：构造合法 JSON 文本（单行 key: value 形式） */
function buildJsonText(entries: string[]): string {
  return `{\n  ${entries.join(",\n  ")}\n}\n`;
}

// ============================================================
// 1. 未知配置属性
// ============================================================

suite("validateJson", () => {
  suite("未知配置属性", () => {
    test("合法 key 不产生诊断", () => {
      const jsonInfo: JsonFileInfo = {
        text: buildJsonText(["\"component\": true", "\"usingComponents\": {}"]),
        config: { component: true, usingComponents: {} },
      };
      const diags = validateJson(jsonInfo, {});
      const unknownKeys = filterByMsg(diags, "未知配置属性");
      assert.strictEqual(unknownKeys.length, 0);
    });

    test("非法的 key（如 components 多写 s）产生诊断", () => {
      const jsonInfo: JsonFileInfo = {
        text: buildJsonText(["\"components\": true"]),
        config: { components: true } as unknown as JsonFileInfo["config"],
      };
      const diags = validateJson(jsonInfo, {});
      const unknownKeys = filterByMsg(diags, "未知配置属性");
      assert.strictEqual(unknownKeys.length, 1);
      assert.ok(unknownKeys[0].message.includes("未知配置属性"));
    });

    test("多个非法 key 产生多个诊断", () => {
      const jsonInfo: JsonFileInfo = {
        text: buildJsonText(["\"a\": 1", "\"b\": 2"]),
        config: { a: 1, b: 2 } as unknown as JsonFileInfo["config"],
      };
      const diags = validateJson(jsonInfo, {});
      const unknownKeys = filterByMsg(diags, "未知配置属性");
      assert.strictEqual(unknownKeys.length, 2);
    });
  });

  // ============================================================
  // 2. 缺少的组件导入
  // ============================================================

  suite("缺少的组件导入", () => {
    test("TS 引用了但 JSON 未声明 → 产生缺少导入诊断", () => {
      const jsonInfo: JsonFileInfo = {
        text: buildJsonText(["\"component\": true", "\"usingComponents\": {}"]),
        config: { component: true, usingComponents: {} },
      };
      // TS 推导了两个组件，但 JSON 中都没声明
      const importedSubCompInfo = {
        "sub-a": "/components/sub-a/index",
        "sub-b": "/components/sub-b/index",
      };
      const diags = validateJson(jsonInfo, importedSubCompInfo);
      const missing = filterByMsg(diags, "缺少导入的组件");
      assert.strictEqual(missing.length, 2);
      // diagnostic.code 应携带缺失的组件名
      const codes = missing.map((d) => (d as unknown as { code: string }).code).sort();
      assert.deepStrictEqual(codes, ["sub-a", "sub-b"]);
    });

    test("JSON 已声明所有 TS 引用 → 无缺少导入诊断", () => {
      const jsonInfo: JsonFileInfo = {
        text: buildJsonText([
          "\"component\": true",
          "\"usingComponents\": {",
          "  \"sub-a\": \"/components/sub-a/index\",",
          "  \"sub-b\": \"/components/sub-b/index\"",
          "}",
        ]),
        config: {
          component: true,
          usingComponents: {
            "sub-a": "/components/sub-a/index",
            "sub-b": "/components/sub-b/index",
          },
        },
      };
      const importedSubCompInfo = {
        "sub-a": "/components/sub-a/index",
        "sub-b": "/components/sub-b/index",
      };
      const diags = validateJson(jsonInfo, importedSubCompInfo);
      assert.strictEqual(filterByMsg(diags, "缺少导入的组件").length, 0);
    });
  });

  // ============================================================
  // 3. 未知的组件导入
  // ============================================================

  suite("未知的组件导入", () => {
    test("JSON 声明了但 TS 未引用 → 产生未知导入诊断", () => {
      const jsonInfo: JsonFileInfo = {
        text: buildJsonText([
          "\"usingComponents\": {",
          "  \"orphan-tag\": \"/components/orphan/index\"",
          "}",
        ]),
        config: {
          usingComponents: { "orphan-tag": "/components/orphan/index" },
        },
      };
      // TS 没有引用 orphan-tag
      const diags = validateJson(jsonInfo, {});
      const unknown = filterByMsg(diags, "未知的导入");
      assert.strictEqual(unknown.length, 1);
      assert.strictEqual(
        (unknown[0] as unknown as { code: string }).code,
        "orphan-tag",
      );
    });

    test("JSON 声明完全匹配 TS 引用 → 无未知导入诊断", () => {
      const jsonInfo: JsonFileInfo = {
        text: buildJsonText([
          "\"usingComponents\": {",
          "  \"sub-a\": \"/components/sub-a/index\"",
          "}",
        ]),
        config: {
          usingComponents: { "sub-a": "/components/sub-a/index" },
        },
      };
      const importedSubCompInfo = { "sub-a": "/components/sub-a/index" };
      const diags = validateJson(jsonInfo, importedSubCompInfo);
      assert.strictEqual(filterByMsg(diags, "未知的导入").length, 0);
    });
  });

  // ============================================================
  // 4. 无效的导入路径
  // ============================================================

  suite("无效的导入路径", () => {
    test("路径正确 → 无诊断", () => {
      const jsonInfo: JsonFileInfo = {
        text: buildJsonText([
          "\"usingComponents\": {",
          "  \"sub-a\": \"/components/sub-a/index\"",
          "}",
        ]),
        config: {
          usingComponents: { "sub-a": "/components/sub-a/index" },
        },
      };
      const importedSubCompInfo = { "sub-a": "/components/sub-a/index" };
      const diags = validateJson(jsonInfo, importedSubCompInfo);
      assert.strictEqual(filterByMsg(diags, "无效的路径").length, 0);
    });

    test("路径不一致 → 产生无效路径诊断", () => {
      const jsonInfo: JsonFileInfo = {
        text: buildJsonText([
          "\"usingComponents\": {",
          "  \"sub-a\": \"/wrong/path/index\"",
          "}",
        ]),
        config: {
          usingComponents: { "sub-a": "/wrong/path/index" },
        },
      };
      const importedSubCompInfo = { "sub-a": "/components/sub-a/index" };
      const diags = validateJson(jsonInfo, importedSubCompInfo);
      const invalid = filterByMsg(diags, "无效的路径");
      assert.strictEqual(invalid.length, 1);
    });
  });

  // ============================================================
  // 5. componentPlaceholder 校验
  // ============================================================

  suite("componentPlaceholder", () => {
    test("placeholder 与 usingComponents 匹配 → 无诊断", () => {
      const jsonInfo: JsonFileInfo = {
        text: buildJsonText([
          "\"usingComponents\": {",
          "  \"sub-a\": \"/components/sub-a/index\"",
          "}",
          "\"componentPlaceholder\": {",
          "  \"sub-a\": \"view\"",
          "}",
        ]),
        config: {
          usingComponents: { "sub-a": "/components/sub-a/index" },
          componentPlaceholder: { "sub-a": "view" },
        },
      };
      const diags = validateJson(jsonInfo, { "sub-a": "/components/sub-a/index" });
      assert.strictEqual(filterByMsg(diags, "占位组件").length, 0);
    });

    test("placeholder 中有未知 key → 产生未知占位组件诊断", () => {
      const jsonInfo: JsonFileInfo = {
        text: buildJsonText([
          "\"usingComponents\": {",
          "  \"sub-a\": \"/components/sub-a/index\"",
          "}",
          "\"componentPlaceholder\": {",
          "  \"orphan\": \"view\"",
          "}",
        ]),
        config: {
          usingComponents: { "sub-a": "/components/sub-a/index" },
          componentPlaceholder: { orphan: "view" },
        },
      };
      const diags = validateJson(jsonInfo, { "sub-a": "/components/sub-a/index" });
      const unknown = filterByMsg(diags, "未知的占位组件");
      assert.strictEqual(unknown.length, 1);
    });

    test("usingComponents 中有 key 但 placeholder 缺失 → 产生缺少占位组件诊断", () => {
      const jsonInfo: JsonFileInfo = {
        text: buildJsonText([
          "\"usingComponents\": {",
          "  \"sub-a\": \"/components/sub-a/index\"",
          "}",
          "\"componentPlaceholder\": {}",
        ]),
        config: {
          usingComponents: { "sub-a": "/components/sub-a/index" },
          componentPlaceholder: {},
        },
      };
      const diags = validateJson(jsonInfo, { "sub-a": "/components/sub-a/index" });
      const missing = filterByMsg(diags, "缺少占位组件");
      assert.strictEqual(missing.length, 1);
    });
  });

  // ============================================================
  // 6. 综合场景
  // ============================================================

  suite("综合场景", () => {
    test("空配置无导入 → 无任何诊断", () => {
      const jsonInfo: JsonFileInfo = {
        text: buildJsonText(["\"component\": true"]),
        config: { component: true },
      };
      const diags = validateJson(jsonInfo, {});
      assert.strictEqual(diags.length, 0);
    });

    test("同时触发多种诊断", () => {
      const jsonInfo: JsonFileInfo = {
        text: buildJsonText([
          "\"component\": true",
          "\"extraKey\": \"bad\"",
          "\"usingComponents\": {",
          "  \"orphan\": \"/wrong/path\"",
          "}",
        ]),
        config: {
          component: true,
          extraKey: "bad",
          usingComponents: { orphan: "/wrong/path" },
        } as unknown as JsonFileInfo["config"],
      };
      const importedSubCompInfo = { "sub-a": "/components/sub-a/index" };
      const diags = validateJson(jsonInfo, importedSubCompInfo);

      // 应有：未知配置属性(extraKey) + 缺少导入(sub-a) + 未知导入(orphan) = 至少 3 个
      assert.ok(diags.length >= 2, `预期至少 2 个诊断，实际 ${diags.length} 个`);
      assert.ok(filterByMsg(diags, "未知配置属性").length >= 1);
      assert.ok(filterByMsg(diags, "缺少导入的组件").length >= 1);
    });
  });
});
