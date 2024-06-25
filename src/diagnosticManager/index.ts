import * as vscode from "vscode";
import type { WxmlUri } from "../componentManager/isComponentUri";

class DiagnosticManager {
  #diagnosticCollection = vscode.languages.createDiagnosticCollection(`annil`);
  public has(wxmlUri: WxmlUri): boolean {
    return this.#diagnosticCollection.has(wxmlUri);
  }
  public delete(wxmlUri: WxmlUri): void {
    this.#diagnosticCollection.delete(wxmlUri);
  }
  public get(wxmlUri: WxmlUri): readonly vscode.Diagnostic[] | undefined {
    return this.#diagnosticCollection.get(wxmlUri);
  }
  public getAll(): vscode.DiagnosticCollection {
    return this.#diagnosticCollection;
  }
  public set(
    wxmlUri: WxmlUri,
    diagnosticList: vscode.Diagnostic[],
  ): void {
    this.#diagnosticCollection.set(wxmlUri, diagnosticList);
  }
  public init(context: vscode.ExtensionContext): void {
    context.subscriptions.push(this.#diagnosticCollection);
  }
}

export const diagnosticManager = new DiagnosticManager();
