import path from "path";

/**
 * 获取用户代码片段目录的路径
 */
export function getUserSnippetsPath(): string {
  let appDataPath;

  if (process.platform === "win32") {
    appDataPath = process.env.APPDATA;
  } else if (process.platform === "darwin") {
    appDataPath = path.join(process.env.HOME as string, "Library/Application Support");
  } else {
    appDataPath = path.join(process.env.HOME as string, ".config");
  }

  return path.join(appDataPath as string, "Code", "User", "snippets");
}
