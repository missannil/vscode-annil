import * as vscode from "vscode";
import type { ComponentDirPath } from "../componentManager/uriHelper";

class DiagnosticManager {
  #diagnosticCollection = vscode.languages.createDiagnosticCollection(`annil`);
  #checkedComponents: ComponentDirPath[] = [];
  public has(uri: vscode.Uri): boolean {
    return this.#diagnosticCollection.has(uri);
  }
  public delete(uri: vscode.Uri): void {
    this.#diagnosticCollection.delete(uri);
  }
  public get(uri: vscode.Uri): readonly vscode.Diagnostic[] | undefined {
    return this.#diagnosticCollection.get(uri);
  }
  public set(
    uri: vscode.Uri,
    diagnosticList: vscode.Diagnostic[],
  ): void {
    this.#diagnosticCollection.set(uri, diagnosticList);
  }
  public hasChecked(componentDirPath: ComponentDirPath): boolean {
    return this.#checkedComponents.includes(componentDirPath);
  }
  public addChecked(componentDirPath: ComponentDirPath): void {
    this.#checkedComponents.push(componentDirPath);
  }
  public removeChecked(componentDirPath: ComponentDirPath): void {
    const index = this.#checkedComponents.indexOf(componentDirPath);
    if (index !== -1) {
      this.#checkedComponents.splice(index, 1);
    }
  }
  public init(context: vscode.ExtensionContext): void {
    context.subscriptions.push(this.#diagnosticCollection);
  }
}

export const diagnosticManager = new DiagnosticManager();
