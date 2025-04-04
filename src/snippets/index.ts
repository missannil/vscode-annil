import * as fs from "fs";
import * as path from "path";
import { defaultSnippets } from "./defaultSnippets";
import { getUserSnippetsPath } from "./getUserSnippetsPath";

export { defaultSnippets } from "./defaultSnippets";

export { getSnippet } from "./getSnippet";

export { getUserSnippetsPath } from "./getUserSnippetsPath";
export * from "./types";

/**
 * 初始化代码片段
 */
export function initSnippet(): void {
  try {
    const snippetsPath = getUserSnippetsPath();

    // 确保代码片段文件夹存在
    if (!fs.existsSync(snippetsPath)) {
      fs.mkdirSync(snippetsPath, { recursive: true });
    }

    // 为每种文件类型创建或更新代码片段文件
    Object.entries(defaultSnippets).forEach(([fileType, snippetDefs]) => {
      const snippetFilePath = path.join(snippetsPath, `${fileType}.json`);

      if (!fs.existsSync(snippetFilePath)) {
        // 文件不存在，创建新文件
        fs.writeFileSync(
          snippetFilePath,
          JSON.stringify(snippetDefs, null, 2),
          "utf8",
        );
        // console.log(`已创建默认代码片段文件: ${snippetFilePath}`);
      } else {
        // 文件存在，合并新的代码片段
        const content = fs.readFileSync(snippetFilePath, "utf8");
        let existingSnippets: Record<string, object>;

        try {
          existingSnippets = JSON.parse(content);
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

        if (updated) {
          fs.writeFileSync(
            snippetFilePath,
            JSON.stringify(existingSnippets, null, 2),
            "utf8",
          );
          // console.log(`已更新代码片段文件: ${snippetFilePath}`);
        }
      }
    });
  } catch (error) {
    console.error("初始化代码片段文件失败:", error);
  }
}
