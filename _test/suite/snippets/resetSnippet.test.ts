import { assert } from "#deps";
import { describe, it as test } from "mocha";
import { defaultSnippets, resetSnippet, snippetNames } from "../../../_src/snippets/index.js";
import { readSnippet, restoreInitialSnippets, writeSnippet } from "./snippetTestHelper.js";

describe("代码片段重置", () => {
  beforeEach(() => {
    restoreInitialSnippets();
  });

  afterEach(() => {
    restoreInitialSnippets();
  });

  test("重置组件片段时保留页面片段和其他用户配置", () => {
    const snippets = readSnippet("typescript");
    snippets[snippetNames.page] = {
      prefix: snippetNames.page,
      body: ["const pageSnippet = true;"],
      description: "user page snippet",
    };

    writeSnippet("typescript", snippets);

    const content = resetSnippet("typescript", false);
    const updated = readSnippet("typescript");

    assert.strictEqual(content, defaultSnippets.typescript[snippetNames.component]?.body.join("\n"));
    assert.deepStrictEqual(updated[snippetNames.component], defaultSnippets.typescript[snippetNames.component]);
    assert.deepStrictEqual(updated[snippetNames.page]?.body, ["const pageSnippet = true;"]);
    assert.deepStrictEqual(updated.customSnippet?.body, ["const customSnippet = true;"]);
  });

  test("重置页面片段时不会覆盖组件片段", () => {
    const snippets = readSnippet("typescript");
    snippets[snippetNames.component] = {
      prefix: snippetNames.component,
      body: ["const componentSnippet = true;"],
      description: "user component snippet",
    };

    writeSnippet("typescript", snippets);
    resetSnippet("typescript", true);

    const updated = readSnippet("typescript");
    assert.deepStrictEqual(updated[snippetNames.component]?.body, ["const componentSnippet = true;"]);
    assert.deepStrictEqual(updated[snippetNames.page], defaultSnippets.typescript[snippetNames.page]);
  });
});
