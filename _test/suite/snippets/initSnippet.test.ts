import { assert } from "#deps";
import { describe, it as test } from "mocha";
import { defaultSnippets, initSnippet, snippetNames } from "../../../_src/snippets/index.js";
import { readSnippet, restoreInitialSnippets, writeSnippet } from "./snippetTestHelper.js";

describe("代码片段初始化", () => {
  beforeEach(() => {
    restoreInitialSnippets();
  });

  afterEach(() => {
    restoreInitialSnippets();
  });

  test("补充缺失的默认片段并保留用户自定义片段", () => {
    initSnippet();

    for (const fileType of ["typescript", "json", "wxml", "wxss"] as const) {
      const snippets = readSnippet(fileType);
      assert.deepStrictEqual(
        snippets.customSnippet?.body,
        fileType === "typescript"
          ? ["const customSnippet = true;"]
          : fileType === "json"
          ? ["{\\\"customSnippet\\\": true}"]
          : fileType === "wxml"
          ? ["<view data-custom-snippet=\\\"true\\\"></view>"]
          : [".custom-snippet {}"],
      );
      assert.deepStrictEqual(snippets[snippetNames.component], defaultSnippets[fileType][snippetNames.component]);
      assert.deepStrictEqual(snippets[snippetNames.page], defaultSnippets[fileType][snippetNames.page]);
    }
  });

  test("重复初始化不会覆盖已经存在的用户片段", () => {
    initSnippet();
    const snippets = readSnippet("typescript");
    snippets[snippetNames.component] = {
      prefix: snippetNames.component,
      body: ["const userDefinedComponent = true;"],
      description: "user component snippet",
    };
    snippets[snippetNames.page] = {
      prefix: snippetNames.page,
      body: ["const userDefinedPage = true;"],
      description: "user page snippet",
    };

    writeSnippet("typescript", snippets);
    initSnippet();

    const updated = readSnippet("typescript");
    assert.deepStrictEqual(updated[snippetNames.component]?.body, ["const userDefinedComponent = true;"]);
    assert.deepStrictEqual(updated[snippetNames.page]?.body, ["const userDefinedPage = true;"]);
  });
});
