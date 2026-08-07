import { assert } from "#deps";
import { describe, it as test } from "mocha";
import { generatePython } from "../../../_src/miniTest/generator.js";
import { scanWxml } from "../../../_src/miniTest/scanner.js";

describe("miniTest 代码生成", () => {
  test("识别根元素、循环元素和条件元素", () => {
    const tags = scanWxml(
      `<view id="root" class="root"><block wx:for="{{items}}"><text id="item" class="item">文本</text></block><block wx:if="{{visible}}"><button id="action" class="action" /></block></view>`,
      ["class", "style"],
    );

    assert.deepStrictEqual(tags.map(tag => [tag.element.tagName, tag.isRoot, tag.scope]), [
      ["view", true, []],
      ["text", false, ["wxFor"]],
      ["button", false, ["wxIf"]],
    ]);
  });

  test("根据配置生成属性读取和组件信息方法", async () => {
    const content = await generatePython(
      "/workspace/components/card/card.wxml",
      `<view id="card" class="card" data-state="ready" bind:tap="onTap"><text id="title">标题</text></view>`,
      { outputPath: "miniTest/components", generatedAttributes: ["class", "style"] },
    );

    assert.match(content, /class CardComponent\(Common\):/);
    assert.match(content, /def getClass\(self\) -> str:/);
    assert.match(content, /def tapCard\(self, count: int = 1\) -> None:/);
    assert.match(content, /def getInnerTextOfTitle\(self\) -> str:/);
    assert.match(content, /"card_data-state": str/);
    assert.match(content, /def assertComponentInfo\(/);
  });
});
