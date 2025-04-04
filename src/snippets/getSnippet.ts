import * as fs from "fs";
import * as path from "path";
import { defaultSnippets } from "./defaultSnippets";
import { getUserSnippetsPath } from "./getUserSnippetsPath";
import type { SnippetDefinition, SnippetFileType } from "./types";

/**
 * 从对应文件类型的代码片段文件获取代码片段
 * @param fileType 文件类型 (json, typescript, wxml, wxss)
 * @param snippetName 代码片段名称，默认为"annil-default"
 */
export function getSnippet(fileType: SnippetFileType, isPage: boolean): string {
  const snippetName = isPage ? "annil-page-default" : "annil-component-default";
  try {
    const snippetsFilePath = path.join(getUserSnippetsPath(), `${fileType}.json`);

    if (fs.existsSync(snippetsFilePath)) {
      const content = fs.readFileSync(snippetsFilePath, "utf8");
      const snippets = JSON.parse(content) as SnippetDefinition;
      if (snippets[snippetName] !== undefined) {
        const body = snippets[snippetName].body;

        return Array.isArray(body) ? body.join("\n") : body;
      }
    }

    // 使用默认代码片段
    const defaultSnippet = defaultSnippets[fileType][snippetName] as SnippetDefinition[typeof snippetName] | undefined;
    if (defaultSnippet) {
      const body = defaultSnippet.body;

      // 处理空数组情况
      if (Array.isArray(body) && body.length === 0) {
        return "";
      }

      return Array.isArray(body) ? body.join("\n") : body;
    }

    return "";
  } catch (error) {
    console.error("获取代码片段失败:", error);

    return "";
  }
}
