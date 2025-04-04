import * as vscode from "vscode";
/**
 * 插件配置
 */
class Configuration {
  #defualtIgnoreFeilds: string[] = ["data-"];
  #userIgnoreFeilds!: string[];
  #ignoreFeilds!: string[];
  #ignoreTags!: string[];
  public get ignoreTags(): string[] {
    return this.#ignoreTags;
  }
  #allowUnknownAttributes!: string[];
  private updateIgnoreFeilds(): void {
    this.#userIgnoreFeilds = vscode.workspace.getConfiguration("annil").get("ignoreFeilds") || [];
    this.#ignoreFeilds = [...this.#defualtIgnoreFeilds, ...this.#userIgnoreFeilds];
  }

  private updateAllowUnknownAttributes(): void {
    try {
      const configValue = vscode.workspace.getConfiguration("annil").get<string[]>("allowUnknownAttributes");
      // 如果配置值存在且是数组，则使用该值；否则使用默认值
      this.#allowUnknownAttributes = Array.isArray(configValue) && configValue.length > 0
        ? configValue
        : [];
    } catch (error) {
      console.error("获取allowUnknownAttributes配置失败:", error);
      // 发生错误时使用默认值
      this.#allowUnknownAttributes = [];
    }
  }

  public get ignoreFeilds(): string[] {
    return this.#ignoreFeilds;
  }

  public get allowUnknownAttributes(): string[] {
    return this.#allowUnknownAttributes;
  }

  public isIgnoreFeilds(attrName: string): boolean {
    return this.ignoreFeilds.includes(attrName);
  }

  public isAllowedAttribute(attrName: string): boolean {
    return this.#allowUnknownAttributes.includes(attrName);
  }

  // 注册工作区配置变化监听器，当配置变化时，更新配置
  private ondidChangeConfiguration(context: vscode.ExtensionContext): void {
    const configChangeListener = vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration("annil")) {
        // 处理配置变化
        this.updateIgnoreFeilds();
        this.updateAllowUnknownAttributes();
      }
    });

    // 将监听器添加到上下文中，以便在扩展停用时自动清理
    context.subscriptions.push(configChangeListener);
  }

  public constructor() {
  }

  public init(context: vscode.ExtensionContext): void {
    this.ondidChangeConfiguration(context);
    this.updateIgnoreFeilds();
    this.updateAllowUnknownAttributes();
    this.#ignoreTags = vscode.workspace.getConfiguration("annil").get("ignoreTags") || [];
  }
}

export const configuration = new Configuration();
