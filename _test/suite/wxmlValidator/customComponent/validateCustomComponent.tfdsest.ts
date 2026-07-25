import { assert, parseDocument } from "#deps";
import { describe as suite, it as test } from "mocha";
import type { TsFileInfo } from "../../../../_src/core/types/index.js";
import { checkWxml } from "../../../../_src/core/wxmlValidator/wxmlChecker.js";

const componentInfo: TsFileInfo = {
  rootComponentInfo: {
    arrTypeDatas: [],
    boolTypeDatas: [],
    dataList: ["parentTitle", "rootValue", "condition", "first", "second"],
    events: [],
  },
  customComponentInfoRecord: {
    child: {
      line: 1,
      fsPath: "/test/child.ts",
      configInfo: {
        title: { type: "Root", value: "parentTitle" },
        active: { type: "Self", value: "child_active" },
        "bind:submit": { type: "Events", value: "child_onSubmit" },
        customProp: { type: "Custom", value: "自定义" },
        choice: { type: "Ternary", values: ["first", "second"] },
      },
      arrTypeDatas: [],
      boolTypeDatas: [],
      events: ["child_onSubmit"],
    },
  },
  chunkComponentInfoRecord: {},
};

function validate(wxml: string): string[] {
  const document = parseDocument(wxml, { xmlMode: true, withStartIndices: true });

  return checkWxml(wxml, document, componentInfo, []).map((diagnostic) => diagnostic.message);
}

suite("CustomComponent WXML 校验", () => {
  test("合法的属性契约不产生诊断", () => {
    const diagnostics = validate(
      "<child title=\"{{ parentTitle }}\" active=\"{{child_active}}\" bind:submit=\"child_onSubmit\" custom-prop=\"{{rootValue}}\" choice=\"{{condition ? first : second}}\" />",
    );

    assert.deepStrictEqual(diagnostics, []);
  });

  test("错误属性和值产生对应诊断", () => {
    const diagnostics = validate(
      "<child title=\"{{wrongTitle}}\" active=\"{{child_active}}\" bind:submit=\"wrongHandler\" custom-prop=\"{{unknownRoot}}\" choice=\"{{condition ? first : other}}\" unexpected=\"value\" />",
    );

    assert.deepStrictEqual(diagnostics, [
      "属性 \"title\" 应绑定 \"{{parentTitle}}\"",
      "事件属性 \"bind:submit\" 应绑定 \"child_onSubmit\"",
      "未知数据: \"unknownRoot\"",
      "属性 \"choice\" 应为 \"{{condition ? first : second}}\"",
      "未知属性: \"unexpected\"",
    ]);
  });

  test("缺少的组件属性逐项产生诊断", () => {
    const diagnostics = validate("<child />");

    assert.deepStrictEqual(diagnostics, [
      "缺少属性: \"title\"",
      "缺少属性: \"active\"",
      "缺少属性: \"bind:submit\"",
      "缺少属性: \"customProp\"",
      "缺少属性: \"choice\"",
    ]);
  });
});
