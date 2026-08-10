import { assert } from "#deps";
import { describe as suite, it as test } from "mocha";
import { configuration } from "../../../_src/configuration/index.js";
import { diagnoseUnusedData, UnusedDataDiagnosticCode } from "../../../_src/core/tsAnalyzer/unusedDataAnalyzer.js";

suite("unusedDataAnalyzer", () => {
  test("检查 Root、Custom 内部字段和 Chunk 数据，并识别 inherit 引用", () => {
    const source = `
      const root = RootComponent()({
        data: {
          rootUsed: 1,
          rootTsOnly: 2,
          rootUnused: 2,
          _rootInternalUsed: 3,
        },
        computed: {
          derived() {
            return this.rootTsOnly + this._rootInternalUsed;
          },
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
      diagnostics.map((diagnostic) => [diagnostic.range.start.line, diagnostic.message, diagnostic.code]),
      [
        [4, "建议改为内部字段", UnusedDataDiagnosticCode.suggestInternal],
        [5, "未使用到的数据", UnusedDataDiagnosticCode.unusedData],
        [9, "未使用到的数据", UnusedDataDiagnosticCode.unusedData],
        [18, "未使用到的数据", UnusedDataDiagnosticCode.unusedData],
        [29, "未使用到的数据", UnusedDataDiagnosticCode.unusedData],
      ],
    );
  });

  test("外部 CustomComponent 的 computed 引用 Root 数据时不报告未使用", () => {
    const source = `
      const root = RootComponent()({
        properties: {
          disableCheckBox: Boolean,
        },
      });
    `;
    const externalSource = `
      const checkBox = CustomComponent()({
        computed: {
          checkBox_status() {
            return this.data.disableCheckBox ? "disabled" : "selected";
          },
        },
      });
    `;

    const diagnostics = diagnoseUnusedData(
      source,
      configuration.innerDataPrefix,
      new Set(),
      [externalSource],
    );

    assert.strictEqual(diagnostics.length, 1);
    assert.strictEqual(diagnostics[0].message, "建议改为内部字段");
    assert.strictEqual(diagnostics[0].code, UnusedDataDiagnosticCode.suggestInternal);
  });

  test("外部 CustomComponent 解构 this.data 引用 Root 数据时不报告未使用", () => {
    const source = `
      const root = RootComponent()({
        properties: {
          attribuites: { type: Object, value: {} },
        },
      });
    `;
    const externalSource = `
      const name = CustomComponent()({
        computed: {
          badgeList() {
            const { attribuites: { isNew = false, temperature = "" } } = this.data;
            return [isNew, temperature];
          },
        },
      });
    `;

    const diagnostics = diagnoseUnusedData(
      source,
      configuration.innerDataPrefix,
      new Set(),
      [externalSource],
    );

    assert.strictEqual(diagnostics.length, 1);
    assert.strictEqual(diagnostics[0].message, "建议改为内部字段");
    assert.strictEqual(diagnostics[0].code, UnusedDataDiagnosticCode.suggestInternal);
  });

  test("外部 CustomComponent watch 监听 Root 字段时计为已使用", () => {
    const source = `
      const root = RootComponent()({
        properties: {
          isActive: Boolean,
        },
      });
    `;
    const externalSource = `
      const sub = CustomComponent()({
        watch: {
          isActive(value) {
            return value;
          },
        },
      });
    `;

    const diagnostics = diagnoseUnusedData(
      source,
      configuration.innerDataPrefix,
      new Set(),
      [externalSource],
    );

    assert.strictEqual(diagnostics.length, 1);
    assert.strictEqual(diagnostics[0].message, "建议改为内部字段");
    assert.strictEqual(diagnostics[0].code, UnusedDataDiagnosticCode.suggestInternal);
  });

  test("import、函数参数、局部对象属性、其他对象解构不误判为字段引用", () => {
    const source = `
      import { goods } from "./goods";
      function helper(bar: number) { return bar; }
      const root = RootComponent()({
        data: {
          goods: 1,
          foo: 2,
          bar: 3,
          baz: 4,
        },
      });
      const other = { foo: 99 };
      const { baz } = other;
    `;

    const diagnostics = diagnoseUnusedData(
      source,
      configuration.innerDataPrefix,
      new Set(),
    );

    // 4 个字段都未被组件数据访问语法使用 → 全部报“未使用到的数据”
    assert.strictEqual(diagnostics.length, 4);
    for (const diagnostic of diagnostics) {
      assert.strictEqual(diagnostic.message, "未使用到的数据");
      assert.strictEqual(diagnostic.code, UnusedDataDiagnosticCode.unusedData);
    }
  });

  test("this.xxx、this.data.xxx、this.data[字符串] 与 this.data 解构都被视为使用", () => {
    const source = `
      const root = RootComponent()({
        data: {
          a: 1,
          b: 2,
          c: 3,
          d: 4,
          e: 5,
        },
      });
    `;
    const externalSource = `
      const sub = CustomComponent()({
        computed: {
          sub_derived() {
            const { a } = this.data;
            return this.b + this.data.c + this.data["d"] + this.e + a;
          },
        },
      });
    `;

    const diagnostics = diagnoseUnusedData(
      source,
      configuration.innerDataPrefix,
      new Set(),
      [externalSource],
    );

    // a~e 都被外部引用 → Root 非内部字段仅被 TS 使用 → 全部建议改为内部字段
    assert.strictEqual(diagnostics.length, 5);
    for (const diagnostic of diagnostics) {
      assert.strictEqual(diagnostic.message, "建议改为内部字段");
      assert.strictEqual(diagnostic.code, UnusedDataDiagnosticCode.suggestInternal);
    }
  });

  test("inherit 数组候选值不视为引用，Chunk 字段检查未使用数据", () => {
    const source = `
      const root = RootComponent()({
        data: {
          rootA: 1,
          rootB: 2,
        },
      });
      const custom = CustomComponent()({
        inherit: { attr: ["rootA", "rootB"] },
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
      new Set(["chunkUsed"]),
    );

    assert.deepStrictEqual(
      diagnostics.map((diagnostic) => diagnostic.message),
      ["未使用到的数据", "未使用到的数据", "未使用到的数据"],
    );
  });
});
