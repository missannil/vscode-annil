import { fs, jsonc, path } from "#deps";
import { defaultSnippets, snippetNames } from "./defaultSnippets.js";
import { getUserSnippetsPath } from "./getUserSnippetsPath.js";
import type { SnippetDefinition, SnippetFileType } from "./types.js";

export function getSnippet(fileType: SnippetFileType, isPage: boolean): string {
  const snippetName = isPage ? snippetNames.page : snippetNames.component;
  try {
    const snippetsFilePath = path.join(getUserSnippetsPath(), `${fileType}.json`);
    if (fs.existsSync(snippetsFilePath)) {
      const snippets = jsonc.parse(fs.readFileSync(snippetsFilePath, "utf8"), [], {
        allowTrailingComma: true,
      }) as SnippetDefinition;
      const body = snippets[snippetName]?.body;

      if (body !== undefined) return body.join("\n");
    }

    return defaultSnippets[fileType][snippetName]?.body.join("\n") ?? "";
  } catch (error) {
    console.error("获取代码片段失败:", error);

    return "";
  }
}
