import { type vscode, vscode as vscodeModule } from "../publicModule";

const OUTPUT_CHANNEL_NAME = "Annil";

let outputChannel: vscode.OutputChannel | undefined;

function ensureOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    throw new Error("Logger has not been initialized. Call initLogger(context) in activate.");
  }

  return outputChannel;
}

function formatMessage(level: "INFO" | "WARN" | "ERROR", message: string): string {
  return `[${level}] ${new Date().toISOString()} ${message}`;
}

export function initLogger(context: vscode.ExtensionContext): void {
  if (outputChannel) {
    return;
  }

  outputChannel = vscodeModule.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
  context.subscriptions.push(outputChannel);
}

export function logInfo(message: string): void {
  ensureOutputChannel().appendLine(formatMessage("INFO", message));
}

export function logWarn(message: string): void {
  ensureOutputChannel().appendLine(formatMessage("WARN", message));
}

export function logError(message: string, error?: unknown): void {
  const details = error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error ?? "");
  const fullMessage = details ? `${message}\n${details}` : message;

  ensureOutputChannel().appendLine(formatMessage("ERROR", fullMessage));
}

export function showLogger(preserveFocus = true): void {
  ensureOutputChannel().show(preserveFocus);
}
