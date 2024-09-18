import * as vscode from "vscode";
class Configuration {
  // id检测规则没有想好，先不检测
  private _defualtIgnoreAttrs: string[] = ["twClass", "class", "style", "twHoverClass"];
  private _userIgnoreAttrs!: string[];
  private _ignoreAttrs!: string[];
  private updateIgnoreAttrs(): void {
    this._userIgnoreAttrs = vscode.workspace.getConfiguration("annil").get("ignoreAttrs") || [];
    this._ignoreAttrs = [...this._defualtIgnoreAttrs, ...this._userIgnoreAttrs];
  }
  public get ignoreAttrs(): string[] {
    return this._ignoreAttrs;
  }
  private _ignoreTags!: string[];
  public get ignoreTags(): string[] {
    return this._ignoreTags;
  }
  private updateIgnoreTags(): void {
    this._ignoreTags = vscode.workspace.getConfiguration("annil").get("ignoreTags") || [];
  }

  private ondidChangeConfiguration(context: vscode.ExtensionContext): void {
    const configChangeListener = vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration("annil")) {
        // 处理配置变化
        this.updateIgnoreAttrs();
        this.updateIgnoreTags();
      }
    });

    // 将监听器添加到上下文中，以便在扩展停用时自动清理
    context.subscriptions.push(configChangeListener);
  }
  public constructor() {
  }
  public init(context: vscode.ExtensionContext): void {
    this.ondidChangeConfiguration(context);
    this.updateIgnoreAttrs();
    this.updateIgnoreTags();
  }
}

export const configuration = new Configuration();
