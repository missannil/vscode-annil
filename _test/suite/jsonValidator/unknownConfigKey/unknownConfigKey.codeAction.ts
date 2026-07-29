import { assert } from "#deps";
import { type Diagnostic, type Uri, workspace } from "vscode";
import { applyCodeActionAndWaitForDiagnostics, waitForQuickFix } from "../../wxmlValidator/codeActionHelper.js";

const UNKNOWN_CONFIG_KEY = "unknownConfig";
const DELETE_ACTION_TITLE = `移除未知配置项 “${UNKNOWN_CONFIG_KEY}”`;

/** 请求并应用“未知配置属性”规则的真实 Quick Fix。 */
export async function applyUnknownConfigKeyQuickFix(uri: Uri, diagnostic: Diagnostic): Promise<void> {
  const action = await waitForQuickFix(uri, diagnostic, DELETE_ACTION_TITLE);
  assert.strictEqual(action.kind?.value, "quickfix");

  assert.deepStrictEqual(
    await applyCodeActionAndWaitForDiagnostics(uri, action, (current) => current.length === 0),
    [],
  );
  assert.deepStrictEqual(JSON.parse((await workspace.openTextDocument(uri)).getText()), {
    component: true,
    usingComponents: {},
    componentPlaceholder: {},
  });
}
