import { assert } from "#deps";
import { type Diagnostic, type Uri, workspace } from "vscode";
import { applyCodeActionAndWaitForDiagnostics, waitForQuickFix } from "../../wxmlValidator/codeActionHelper.js";

const COMPONENT_NAME = "validComponent";
const COMPONENT_PATH = "/components/subExternal/subExternal";
const ACTION_TITLE = `添加缺失导入 “${COMPONENT_NAME}”`;

/** 请求并应用“缺少导入”规则的真实 Quick Fix。 */
export async function applyMissingImportQuickFix(uri: Uri, diagnostic: Diagnostic): Promise<void> {
  const action = await waitForQuickFix(uri, diagnostic, ACTION_TITLE);
  assert.strictEqual(action.kind?.value, "quickfix");

  const updatedDiagnostics = await applyCodeActionAndWaitForDiagnostics(
    uri,
    action,
    (current) => current.length === 1 && current[0]?.message === "缺少占位组件",
  );
  assert.strictEqual(updatedDiagnostics[0]?.message, "缺少占位组件");
  assert.deepStrictEqual(JSON.parse((await workspace.openTextDocument(uri)).getText()), {
    component: true,
    usingComponents: { [COMPONENT_NAME]: COMPONENT_PATH },
    componentPlaceholder: {},
  });
}
