import path from "path";
import { fs } from "../publicModule";

// function isFilePathByExtension(fsPath: string): boolean {
// 	// 检查路径是否包含文件扩展名
// 	return fsPath.lastIndexOf('.') > fsPath.lastIndexOf(path.sep);
// }

/**
 * 获取最近的json文件文件路径(逐级向上查找文件)
 *
 * @param dirPath 起始目录路径
 * @returns 文件路径 或 null
 */
export function getNearestJosnFilePath(dirPath: string, fileName: string): string | null {
  // 规范化路径
  const normalizedPath = path.normalize(dirPath);
  if (normalizedPath === path.dirname(normalizedPath)) {
    console.warn(`未找到 ${fileName} 文件`);

    // 如果到达根目录，则返回 null
    return null;
  }
  // 在当前路径中查找 tsconfig.json 文件
  const filePath = path.join(normalizedPath, fileName);
  if (fs.existsSync(filePath)) {
    return filePath;
  } else {
    // 如果没有找到，递归向上查找父目录
    return getNearestJosnFilePath(path.dirname(normalizedPath), fileName);
  }
}
