import { fs, jsonc, path } from "#deps";
import { defaultSnippets, snippetNames } from "./defaultSnippets.js";
import { getSnippet } from "./getSnippet.js";
import { getUserSnippetsPath } from "./getUserSnippetsPath.js";
import type { SnippetDefinition, SnippetFileType } from "./types.js";

export { defaultSnippets, getSnippet, getUserSnippetsPath, snippetNames };

export type * from "./types.js";

export function resetSnippet(fileType: SnippetFileType, isPage: boolean): string {
  const snippetName = isPage ? snippetNames.page : snippetNames.component;
  const defaultSnippet = defaultSnippets[fileType][snippetName];
  if (defaultSnippet === undefined) return "";

  const snippetsPath = getUserSnippetsPath();
  if (!fs.existsSync(snippetsPath)) fs.mkdirSync(snippetsPath, { recursive: true });
  const snippetFilePath = path.join(snippetsPath, `${fileType}.json`);
  let snippets: SnippetDefinition = {};
  if (fs.existsSync(snippetFilePath)) {
    snippets = jsonc.parse(fs.readFileSync(snippetFilePath, "utf8"), [], {
      allowTrailingComma: true,
    }) as SnippetDefinition;
  }

  snippets[snippetName] = defaultSnippet;

  fs.writeFileSync(snippetFilePath, JSON.stringify(snippets, null, 2), "utf8");

  return defaultSnippet.body.join("\n");
}

export function initSnippet(): void {
  try {
    const snippetsPath = getUserSnippetsPath();
    if (!fs.existsSync(snippetsPath)) fs.mkdirSync(snippetsPath, { recursive: true });
    for (const [fileType, snippetDefs] of Object.entries(defaultSnippets) as [SnippetFileType, object][]) {
      const snippetFilePath = path.join(snippetsPath, `${fileType}.json`);
      if (!fs.existsSync(snippetFilePath)) {
        fs.writeFileSync(snippetFilePath, JSON.stringify(snippetDefs, null, 2), "utf8");
        continue;
      }
      const parseErrors: { error: number; offset: number; length: number }[] = [];
      const existingSnippets = jsonc.parse(
        fs.readFileSync(snippetFilePath, "utf8"),
        parseErrors,
        { allowTrailingComma: true },
      ) as Record<string, object>;
      if (parseErrors.length > 0) {
        console.error(`解析代码片段文件失败: ${snippetFilePath}`, parseErrors);
        continue;
      }
      let updated = false;
      for (const [key, value] of Object.entries(snippetDefs)) {
        if (existingSnippets[key] === undefined) {
          existingSnippets[key] = value;
          updated = true;
        }
      }
      if (updated) fs.writeFileSync(snippetFilePath, JSON.stringify(existingSnippets, null, 2), "utf8");
    }
  } catch (error) {
    console.error("初始化代码片段文件失败:", error);
  }
}
