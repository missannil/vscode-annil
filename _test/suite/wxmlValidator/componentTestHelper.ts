import { fs, path, vscode } from "#deps";
import { waitForDiagnostics } from "./diagnosticHelper.js";

const EXTENSION_ID = "missannil.vscode-annil";

/** 将编译后 out 目录中的 fixture 路径映射回源码测试目录。 */
function resolveFixtureUri(uri: vscode.Uri): vscode.Uri {
  if (fs.existsSync(uri.fsPath)) return uri;

  const marker = `${path.sep}_test${path.sep}suite${path.sep}`;
  const markerIndex = uri.fsPath.indexOf(marker);
  if (markerIndex < 0) return uri;

  const sourcePath = uri.fsPath.slice(markerIndex);
  const outMarker = `${path.sep}out`;
  const outIndex = uri.fsPath.lastIndexOf(outMarker, markerIndex);
  const workspaceRoot = uri.fsPath.slice(0, outIndex >= 0 ? outIndex : markerIndex);

  return vscode.Uri.file(path.join(workspaceRoot, sourcePath));
}

/**
 * 在 Extension Host 中打开真实组件 WXML，并等待 Annil 发布至少一个诊断。
 *
 * 调用方必须提供与测试文件同目录的真实 `.ts`、`.json`、`.wxml` 组件文件，
 * 不得直接调用 `_src` 中的校验器或解析器。
 */
export async function getComponentDiagnostics(
  wxmlUri: vscode.Uri,
): Promise<readonly vscode.Diagnostic[]> {
  const extension = vscode.extensions.getExtension(EXTENSION_ID);
  if (extension === undefined) {
    throw new Error(`未找到待测扩展: ${EXTENSION_ID}`);
  }
  await extension.activate();

  const fixtureUri = resolveFixtureUri(wxmlUri);
  const document = await vscode.workspace.openTextDocument(fixtureUri);
  await vscode.window.showTextDocument(document);

  return waitForDiagnostics(fixtureUri, (diagnostics) => diagnostics.length > 0);
}
