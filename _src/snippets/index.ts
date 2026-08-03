import { fs, path } from "#deps";
import { defaultSnippets } from "./defaultSnippets.js";
import { getSnippet } from "./getSnippet.js";
import { getUserSnippetsPath } from "./getUserSnippetsPath.js";
import type { SnippetFileType } from "./types.js";

export { defaultSnippets, getSnippet, getUserSnippetsPath };

export type * from "./types.js";

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
      let existingSnippets: Record<string, object>;
      try {
        existingSnippets = JSON.parse(fs.readFileSync(snippetFilePath, "utf8")) as Record<string, object>;
      } catch (error) {
        console.error(`解析代码片段文件失败: ${snippetFilePath}`, error);
        existingSnippets = {};
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
