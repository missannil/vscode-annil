import { fs, path } from "#deps";
import { defaultSnippets } from "./defaultSnippets.js";
import { getUserSnippetsPath } from "./getUserSnippetsPath.js";
import type { SnippetDefinition, SnippetFileType } from "./types.js";

export function getSnippet(fileType: SnippetFileType, isPage: boolean): string {
  const snippetName = isPage ? "annil-page-default" : "annil-component-default";
  try {
    const snippetsFilePath = path.join(getUserSnippetsPath(), `${fileType}.json`);
    if (fs.existsSync(snippetsFilePath)) {
      const snippets = JSON.parse(fs.readFileSync(snippetsFilePath, "utf8")) as SnippetDefinition;
      const body = snippets[snippetName]?.body;

      if (body !== undefined) return body.join("\n");
    }

    return defaultSnippets[fileType][snippetName]?.body.join("\n") ?? "";
  } catch (error) {
    console.error("获取代码片段失败:", error);

    return "";
  }
}
