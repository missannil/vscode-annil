// 判断是否为相对路径
function isRelativePath(importPath: string): boolean {
  return importPath.startsWith("./") || importPath.startsWith("../");
}

function isNoSlashPath(importPath: string): boolean {
  return !importPath.startsWith("/") && !isRelativePath(importPath);
}

// 获取主ts文件中的json组件路径
export function generateJsonFilePath(
  typePath: string,
): string {
  if (isRelativePath(typePath)) {
    // ./xxx/@yyy  ../xxx/@yyy
    return typePath;
  }
  if (isNoSlashPath(typePath)) {
    // 命中了tsconfig.json中的baseUrl的路径,因为baseUrl与小程序project.config.json中miniprogramRoot一致,所以直接前面加/即可,因为在组件json配置中,/开头的路径是相对小程序根目录的路径。
    return "/" + typePath;
  }

  return "";
}
