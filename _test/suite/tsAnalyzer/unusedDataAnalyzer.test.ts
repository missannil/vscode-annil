import { assert } from "#deps";
import { describe as suite, it as test } from "mocha";
import { configuration } from "../../../_src/configuration/index.js";
import { diagnoseUnusedData } from "../../../_src/core/tsAnalyzer/unusedDataAnalyzer.js";

suite("unusedDataAnalyzer", () => {
  test("检查 Root、Custom 内部字段和 Chunk 数据，并识别 inherit 引用", () => {
    const source = `
      const root = RootComponent()({
        data: {
          rootUsed: 1,
          rootUnused: 2,
        },
      });
      const custom = CustomComponent()({
        inherit: { value: "rootUsed" },
        data: {
          _customUsed: 1,
          _customUnused: 2,
        },
        computed: {
          value() {
            return this._customUsed;
          },
        },
      });
      const chunk = ChunkComponent()({
        data: {
          chunkUsed: 1,
          chunkUnused: 2,
        },
      });
    `;

    const diagnostics = diagnoseUnusedData(
      source,
      configuration.innerDataPrefix,
      new Set(["rootUsed", "chunkUsed"]),
    );

    assert.deepStrictEqual(
      diagnostics.map((diagnostic) => [diagnostic.range.start.line, diagnostic.message]),
      [
        [4, "未使用到的数据"],
        [11, "未使用到的数据"],
        [22, "未使用到的数据"],
      ],
    );
  });
});
