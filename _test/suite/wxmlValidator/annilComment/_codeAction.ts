/**
 * annil 注释规则 — CodeAction 修复测试
 *
 * 本文件不会被 Mocha 自动扫描（非 .test.ts），仅供 commentTest.test.ts 导入。
 */
import { assert, fs } from "#deps";
import type { CodeAction, Diagnostic } from "vscode";
import { commands, languages, Range, Uri, window, workspace } from "vscode";

export function registerCodeActionTests(wxmlPath: string): void {
  const { describe, it: test, before, after } = globalThis as unknown as {
    describe: Mocha.SuiteFunction;
    it: Mocha.TestFunction;
    before: Mocha.HookFunction;
    after: Mocha.HookFunction;
  };

  let wxmlUri: Uri;
  let originalWxml: string;

  // ---------- 工具函数 ----------

  async function restoreWxml(): Promise<void> {
    const editor = await window.showTextDocument(wxmlUri);
    const document = editor.document;

    await editor.edit((editBuilder) => {
      editBuilder.replace(
        new Range(0, 0, document.lineCount, 0),
        originalWxml,
      );
    });

    // applyEdit 只修改 VS Code 内存中的 TextDocument；必须保存，避免
    // VS Code 关闭时把被 CodeAction 删除的内容再次写回磁盘。
    await document.save();
  }

  async function loadDiagnostics(): Promise<readonly Diagnostic[]> {
    await restoreWxml();
    await new Promise((resolve) => setTimeout(resolve, 800));

    return languages.getDiagnostics(wxmlUri);
  }

  async function getActions(diag: Diagnostic): Promise<CodeAction[]> {
    return (await commands.executeCommand(
      "vscode.executeCodeActionProvider",
      wxmlUri,
      diag.range,
    )) as CodeAction[];
  }

  async function applyFixAndWait(action: CodeAction, expectedCount: number): Promise<readonly Diagnostic[]> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await workspace.applyEdit(action.edit!);
    const start = Date.now();
    while (Date.now() - start < 3000) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const diags = languages.getDiagnostics(wxmlUri);
      if (diags.length === expectedCount) return diags;
    }

    return languages.getDiagnostics(wxmlUri);
  }

  // ---------- 测试套件 ----------

  describe("CodeAction 修复", () => {
    before(async () => {
      wxmlUri = Uri.file(wxmlPath);
      originalWxml = fs.readFileSync(wxmlPath, "utf-8");
    });

    // 全部测试跑完后恢复磁盘，防止 workspace.applyEdit 写坏了文件
    after(async () => {
      await restoreWxml();
    });

    test("diagnostics[0]「无效的注释」→ 「替换为：全局关闭检查」后诊断数 → 0", async () => {
      const diags = await loadDiagnostics();
      assert.strictEqual(diags.length, 6);
      const fix = (await getActions(diags[0] as Diagnostic)).find((a) => a.title === "替换为：全局关闭检查");
      assert.ok(fix);
      assert.strictEqual((await applyFixAndWait(fix, 0)).length, 0);
    });

    test("diagnostics[1]「还没有开始注释不可结束」→ 「删除无效的 end 注释」后诊断数 → 5", async () => {
      const diags = await loadDiagnostics();
      assert.strictEqual(diags.length, 6);
      const fix = (await getActions(diags[1] as Diagnostic)).find((a) => a.title === "删除无效的 end 注释");
      assert.ok(fix);
      assert.strictEqual((await applyFixAndWait(fix, 5)).length, 5);
    });

    test("diagnostics[2]「重复的注释(line)」→ 「删除重复的注释」后诊断数 → 5", async () => {
      const diags = await loadDiagnostics();
      assert.strictEqual(diags.length, 6);
      const fix = (await getActions(diags[2] as Diagnostic)).find((a) => a.title === "删除重复的注释");
      assert.ok(fix);
      assert.strictEqual((await applyFixAndWait(fix, 5)).length, 5);
    });

    test("diagnostics[3]「重复的注释(start)」→ 「删除重复的注释」后诊断数 → 5", async () => {
      const diags = await loadDiagnostics();
      assert.strictEqual(diags.length, 6);
      const fix = (await getActions(diags[3] as Diagnostic)).find((a) => a.title === "删除重复的注释");
      assert.ok(fix);
      assert.strictEqual((await applyFixAndWait(fix, 5)).length, 5);
    });

    test("diagnostics[4]「重复的注释(repeatTag)」→ 「删除重复的注释」后诊断数 → 5", async () => {
      const diags = await loadDiagnostics();
      assert.strictEqual(diags.length, 6);
      const fix = (await getActions(diags[4] as Diagnostic)).find((a) => a.title === "删除重复的注释");
      assert.ok(fix);
      assert.strictEqual((await applyFixAndWait(fix, 5)).length, 5);
    });

    test("diagnostics[5]「注释应写在文件头部」→ 「删除位置错误的 all 注释」后诊断数 → 5", async () => {
      const diags = await loadDiagnostics();
      assert.strictEqual(diags.length, 6);
      const fix = (await getActions(diags[5] as Diagnostic)).find((a) => a.title === "删除位置错误的 all 注释");
      assert.ok(fix);
      assert.strictEqual((await applyFixAndWait(fix, 5)).length, 5);
    });

    test("fix-all 为所有有修复操作的诊断执行第一个修复操作", async () => {
      const diags = await loadDiagnostics();
      assert.strictEqual(diags.length, 6);

      await commands.executeCommand("annil.fix-all");

      const start = Date.now();
      while (Date.now() - start < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        if (languages.getDiagnostics(wxmlUri).length === 0) break;
      }

      assert.strictEqual(languages.getDiagnostics(wxmlUri).length, 0);
      assert.match(window.activeTextEditor?.document.getText() ?? "", /annil disable all/);
    });
  });
}
