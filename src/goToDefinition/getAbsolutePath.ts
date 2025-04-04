import * as path from "path";
import { getMiniprogramRoot } from "./getMiniprogramRoot";

export async function getAbsolutePath(fsPath: string, configPath: string): Promise<string> {
  // 从当前文件路径向上查找到包含project.config.json文件的目录,拿到miniprogramRoot配置值
  const miniprogramRoot = await getMiniprogramRoot(fsPath);
  const parts = fsPath.split(path.sep);
  const index = parts.indexOf(miniprogramRoot.replace(/\//g, ""));

  return path.join(...parts.slice(0, index + 1), configPath);
}
