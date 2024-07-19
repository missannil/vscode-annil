import * as vscode from "vscode";

class DiagnosticManager {
  #diagnosticCollection = vscode.languages.createDiagnosticCollection(`annil`);
  public has(uri: vscode.Uri): boolean {
    return this.#diagnosticCollection.has(uri);
  }
  public delete(uri: vscode.Uri): void {
    this.#diagnosticCollection.delete(uri);
  }
  public get(uri: vscode.Uri): readonly vscode.Diagnostic[] | undefined {
    return this.#diagnosticCollection.get(uri);
  }
  public getAll(): vscode.DiagnosticCollection {
    return this.#diagnosticCollection;
  }
  public set(
    uri: vscode.Uri,
    diagnosticList: vscode.Diagnostic[],
  ): void {
    this.#diagnosticCollection.set(uri, diagnosticList);
  }
  public init(context: vscode.ExtensionContext): void {
    context.subscriptions.push(this.#diagnosticCollection);
  }
}

export const diagnosticManager = new DiagnosticManager();
