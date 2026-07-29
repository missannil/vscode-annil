import { assert } from "#deps";
import { type Diagnostic, type Uri, workspace } from "vscode";
import { applyCodeActionAndWaitForDiagnostics, waitForQuickFix } from "../../wxmlValidator/codeActionHelper.js";

const COMPONENT_NAME = "validComponent";
const INSERT_ACTION_TITLE = `添加缺失占位组件 “${COMPONENT_NAME}”`;

/** 请求并应用“缺少占位组件”规则的真实 Quick Fix。 */
export async function applyMissingPlaceholderQuickFix(uri: Uri, diagnostic: Diagnostic): Promise<void> {
  const action = await waitForQuickFix(uri, diagnostic, INSERT_ACTION_TITLE);
  assert.strictEqual(action.kind?.value, "quickfix");

  assert.deepStrictEqual(
    await applyCodeActionAndWaitForDiagnostics(uri, action, (current) => current.length === 0),
    [],
  );
  assert.deepStrictEqual(JSON.parse((await workspace.openTextDocument(uri)).getText()), {
    component: true,
    usingComponents: { validComponent: "/components/subExternal/subExternal" },
    componentPlaceholder: { validComponent: "view" },
  });
}
