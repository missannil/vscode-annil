import { assert } from "#deps";
import { type Diagnostic, type Uri, workspace } from "vscode";
import { applyCodeActionAndWaitForDiagnostics, waitForQuickFix } from "../../wxmlValidator/codeActionHelper.js";

const UNKNOWN_COMPONENT = "unknownComponent";
const DELETE_ACTION_TITLE = `移除 “${UNKNOWN_COMPONENT}”`;

/** 请求并应用“未知导入”规则的真实 Quick Fix。 */
export async function applyUnknownImportQuickFix(uri: Uri, diagnostic: Diagnostic): Promise<void> {
  const action = await waitForQuickFix(uri, diagnostic, DELETE_ACTION_TITLE);
  assert.strictEqual(action.kind?.value, "quickfix");

  assert.deepStrictEqual(
    await applyCodeActionAndWaitForDiagnostics(uri, action, (current) => current.length === 0),
    [],
  );
  const fixedText = (await workspace.openTextDocument(uri)).getText();
  assert.strictEqual(fixedText.includes(UNKNOWN_COMPONENT), false);
  assert.deepStrictEqual(JSON.parse(fixedText), {
    component: true,
    usingComponents: {},
    componentPlaceholder: {},
  });
}
