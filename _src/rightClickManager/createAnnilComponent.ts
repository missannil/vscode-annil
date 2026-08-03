import { vscode } from "#deps";
import { getSnippet } from "../snippets/index.js";

export async function createAnnilComponent(uri: vscode.Uri, isPage: boolean): Promise<void> {
  const fileName = uri.path.split("/").pop();
  if (fileName === undefined) return;
  const fileNameWithoutExt = fileName.split(".")[0];
  const componentType = isPage ? "页面" : "组件";
  const newFileName = await vscode.window.showInputBox({
    prompt: `请输入新${componentType}名称`,
    value: fileNameWithoutExt,
  });
  if (newFileName === undefined) return;

  const newDirUri = vscode.Uri.joinPath(uri, newFileName);
  await vscode.workspace.fs.createDirectory(newDirUri);
  for (const fileType of ["typescript", "json", "wxml", "wxss"] as const) {
    const extension = fileType === "typescript" ? "ts" : fileType;
    const fileUri = vscode.Uri.joinPath(newDirUri, `${newFileName}.${extension}`);
    const content = fileType === "typescript"
      ? processSnippet(getSnippet(fileType, isPage), newFileName)
      : getSnippet(fileType, isPage);
    await vscode.workspace.fs.writeFile(fileUri, new TextEncoder().encode(content));
  }
  void vscode.window.showTextDocument(vscode.Uri.joinPath(newDirUri, `${newFileName}.ts`));
}

export function processSnippet(snippet: string, fileName: string): string {
  if (!snippet) return "";

  const componentType = fileName.charAt(0).toUpperCase() + fileName.slice(1);

  return snippet.replace(/\$1/g, fileName).replace(/\$2/g, componentType);
}
