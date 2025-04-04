import * as fs from "fs";
import * as path from "path";
import { getAbsolutePath } from "./getAbsolutePath";

export async function getWxmlFsPath(configPath: string, currentFsPath: string): Promise<string> {
  let componentPath: string; // 小程序配置自定义组件路径时没有后缀名
  // 以`/`开头的路径是从小程序project.config.json的miniprogramRoot字段开始的
  if (configPath.startsWith("/")) {
    componentPath = await getAbsolutePath(currentFsPath, configPath);
  } else {
    // 相对路径(./开始的),vscode拓展(`WXML`)也有此功能,但不支持绝对路径
    componentPath = path.join(path.dirname(currentFsPath), configPath);
  }
  const tempPath = componentPath + ".wxml";
  const wxmlFsPath = fs.existsSync(tempPath)
    ? tempPath
    : path.join(componentPath, "index.wxml");

  return wxmlFsPath;
}
