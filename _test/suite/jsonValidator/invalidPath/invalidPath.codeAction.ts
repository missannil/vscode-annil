import { assert } from "#deps";
import { type Diagnostic, type Uri, workspace } from "vscode";
import { applyCodeActionAndWaitForDiagnostics, waitForQuickFix } from "../../wxmlValidator/codeActionHelper.js";

const CORRECT_PATH = "/components/subExternal/subExternal";
const FIX_ACTION_TITLE = `修正导入路径为 “${CORRECT_PATH}”`;

/** 请求并应用“无效路径”规则的真实 Quick Fix。 */
export async function applyInvalidPathQuickFix(uri: Uri, diagnostic: Diagnostic): Promise<void> {
  const action = await waitForQuickFix(uri, diagnostic, FIX_ACTION_TITLE);
  assert.strictEqual(action.kind?.value, "quickfix");

  assert.deepStrictEqual(
    await applyCodeActionAndWaitForDiagnostics(uri, action, (current) => current.length === 0),
    [],
  );
  assert.deepStrictEqual(JSON.parse((await workspace.openTextDocument(uri)).getText()), {
    component: true,
    usingComponents: { validComponent: CORRECT_PATH },
    componentPlaceholder: { validComponent: "view" },
  });
}
