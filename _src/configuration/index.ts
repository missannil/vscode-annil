import { vscode } from "#deps";
/**
 * 插件配置模块
 */
class Configuration {
  #defualtIgnoreFields: string[] = ["data-"];
  #userIgnoreFields!: string[];
  #ignoreFields!: string[];
  #ignoreTags!: string[];
  #validDatas!: string[];
  #innerDataPrefix = "_";
  public get validDatas(): string[] {
    return this.#validDatas;
  }
  public updateValidDatas(): void {
    this.#validDatas = vscode.workspace.getConfiguration("annil").get("validDatas") ?? [];
  }
  public get ignoreTags(): string[] {
    return this.#ignoreTags;
  }
  public get innerDataPrefix(): string {
    return this.#innerDataPrefix;
  }
  #allowUnknownAttributes!: string[];
  private updateIgnoreFields(): void {
    this.#userIgnoreFields = vscode.workspace.getConfiguration("annil").get("ignoreFields") ?? [];
    this.#ignoreFields = [...this.#defualtIgnoreFields, ...this.#userIgnoreFields];
  }
  private updateIgnoreTags(): void {
    this.#ignoreTags = vscode.workspace.getConfiguration("annil").get<string[]>("ignoreTags") ?? [];
  }
  private updateInnerDataPrefix(): void {
    this.#innerDataPrefix = vscode.workspace.getConfiguration("annil").get<string>("innerDataPrefix") ?? "_";
  }
  private updateAllowUnknownAttributes(): void {
    try {
      const configValue = vscode.workspace.getConfiguration("annil").get<string[]>("allowUnknownAttributes") ?? [];
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
  public get ignoreFields(): string[] {
    return this.#ignoreFields;
  }
  public get allowUnknownAttributes(): string[] {
    return this.#allowUnknownAttributes;
  }
  public isIgnoreFields(attrName: string): boolean {
    return this.ignoreFields.includes(attrName);
  }
  public isAllowedAttribute(attrName: string): boolean {
    // `data-*` 是小程序/WXML 的通用透传属性，不属于具体组件契约。
    // 与 miniTest 对 data-* 属性的既有识别规则保持一致，无需用户逐项配置。
    return attrName.startsWith("data-") || this.#allowUnknownAttributes.includes(attrName);
  }
  // 注册工作区配置变化监听器，当配置变化时，更新配置
  private ondidChangeConfiguration(context: vscode.ExtensionContext): void {
    const configChangeListener = vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration("annil")) {
        // 处理配置变化
        this.updateIgnoreFields();
        this.updateIgnoreTags();
        this.updateAllowUnknownAttributes();
        this.updateValidDatas();
        this.updateInnerDataPrefix();
      }
    });

    // 将监听器添加到上下文中，以便在扩展停用时自动清理
    context.subscriptions.push(configChangeListener);
  }
  public constructor() {}
  public init(context: vscode.ExtensionContext): void {
    this.ondidChangeConfiguration(context);
    this.updateIgnoreFields();
    this.updateIgnoreTags();
    this.updateAllowUnknownAttributes();
    this.updateValidDatas();
    this.updateInnerDataPrefix();
  }
}

export const configuration = new Configuration();
