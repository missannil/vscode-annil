import * as vscode from "vscode";
import { initializeWxmlDiagnostics } from "./wxmlDiagnostics";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  initializeWxmlDiagnostics(context);
}

export function deactivate(): void {}
