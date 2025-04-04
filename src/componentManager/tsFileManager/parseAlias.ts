// 小程序导入组件模块时有可能因为设置了app.json的resolveAlias字段.所以需要解析, 从长到短匹配别名,并替换路径
export function parseAlias(importPath: string, resolveAlias: Record<string, string>): string {
  const pathArr = importPath.split("/"); // ["~", "components", "image", "image"]
  // 从整个路径开始匹配，逐渐减少路径的部分
  for (let i = pathArr.length; i > 0; i--) {
    const currentPathParts = pathArr.slice(0, i); // ["~", "components", "image", "image"] = > ["~", "components", "image"] => ["~", "components"] => ["~"]
    const currentPath = currentPathParts.join("/") + "/"; // "~/components/image/image/*" => "~/components/image/*" => "~/components/*"  =>  "~/*"
    const aliasPath: string | undefined = resolveAlias[`${currentPath}*`];
    if (aliasPath !== undefined) {
      // 替换匹配的路径部分 slice(0,-1)是为了去掉最后的 * 号(约定配置最后都有一个 * 号)
      const path = importPath.replace(currentPath, aliasPath.slice(0, -1));

      return path.startsWith("/") ? path : "/" + path;
    }
  }
  /**
   * 例如
   * app.json中的配置为
   * "resolveAlias": {
   *   "~/*": "/components/*"
   * }
   * tsconfig.json中的配置为
   *  "baseUrl": "./miniprogram",
   * "paths": {
   *   "~/*": ["components/*"]
   * }
   * 当ts文件中的路径为 "~/imageTabs/imageTabs" 时, tsconfig.json会解析为 "./miniprogram/components/imageTabs/imageTabs",不会引起ts的错误。 也不会引起编译后错误。只要记住小程序组件的json文件不支持app.json中的resolveAlias字段即可，如果以/开头的路径，是指向根目录的路径。确保ts配置的路径变量在转换后符合小程序的json文件的路径即可。
   */

  // 如果没有找到匹配项，返回原始路径
  return importPath;
}
