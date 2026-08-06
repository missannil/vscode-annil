import { vscode } from "#deps";
import { getSnippet } from "../snippets/index.js";

type CreationInput = {
  fileName: string;
  pagePath?: string;
};

async function getCreationInput(
  uri: vscode.Uri,
  isPage: boolean,
  inputBox: (options?: vscode.InputBoxOptions) => Thenable<string | undefined>,
): Promise<CreationInput | undefined> {
  const fileName = uri.path.split("/").pop();
  if (fileName === undefined) return undefined;
  const fileNameWithoutExt = fileName.split(".")[0];
  const componentType = isPage ? "页面" : "组件";
  const newFileName = await inputBox({
    prompt: `请输入新${componentType}名称`,
    value: fileNameWithoutExt,
  });
  if (newFileName === undefined) return undefined;

  const pagePath = isPage
    ? await inputBox({
      prompt: "请输入页面路径",
      value: newFileName,
    })
    : undefined;
  if (isPage && pagePath === undefined) return undefined;

  return { fileName: newFileName, ...(pagePath === undefined ? {} : { pagePath }) };
}

export async function createAnnilComponent(
  uri: vscode.Uri,
  isPage: boolean,
  inputBox: (options?: vscode.InputBoxOptions) => Thenable<string | undefined> = vscode.window.showInputBox,
): Promise<void> {
  const creationInput = await getCreationInput(uri, isPage, inputBox);
  if (creationInput === undefined) return;
  const { fileName: newFileName, pagePath } = creationInput;

  const newDirUri = vscode.Uri.joinPath(uri, newFileName);
  await vscode.workspace.fs.createDirectory(newDirUri);
  for (const fileType of ["typescript", "json", "wxml", "wxss"] as const) {
    const extension = fileType === "typescript" ? "ts" : fileType;
    const fileUri = vscode.Uri.joinPath(newDirUri, `${newFileName}.${extension}`);
    const content = fileType === "typescript"
      ? processSnippet(getSnippet(fileType, isPage), newFileName, pagePath)
      : getSnippet(fileType, isPage);
    await vscode.workspace.fs.writeFile(fileUri, new TextEncoder().encode(content));
  }
  void vscode.window.showTextDocument(vscode.Uri.joinPath(newDirUri, `${newFileName}.ts`));
}

export function processSnippet(snippet: string, fileName: string, pagePath?: string): string {
  if (!snippet) return "";

  const componentType = fileName.charAt(0).toUpperCase() + fileName.slice(1);

  return snippet
    .replaceAll("\\$${1/(.*)/${1:/pascalcase}/}", `$${componentType}`)
    .replace(/\$1/g, fileName)
    .replace(/\$2/g, pagePath ?? componentType)
    .replace(/\$0/g, "");
}
