import { assert } from "#deps";
import { describe, it as test } from "mocha";
import { filterSourceBackedTestFiles, validateFocusedTestPaths } from "../index.js";

describe("测试筛选", () => {
  test("不存在的聚焦路径会在加载前显示错误提示", () => {
    assert.throws(
      () =>
        validateFocusedTestPaths(
          "/suite",
          ["wxmlValidator/comment/inalidComment/inalidComment.test.ts"],
        ),
      /聚焦测试路径不存在：.*inalidComment/,
    );
  });

  test("没有源文件的遗留编译测试不会被加载", () => {
    assert.deepStrictEqual(
      filterSourceBackedTestFiles(
        ["/out/suite/stale.test.js"],
        "/out/suite",
        "/source/suite",
      ),
      [],
    );
  });
});
