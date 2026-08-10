import { vscode } from "#deps";
import { GithubStarAuthorization } from "../authorization/githubStar.js";
import { registerFixAllCommand } from "./fixAll.js";
import { generateRegisteredJsonFixes } from "./jsonFixRegistry.js";
import { generateRegisteredTsFixes } from "./tsFixRegistry.js";
import { generateRegisteredWxmlFixes } from "./wxmlFixRegistry.js";

const EXTENSION_NAME = "vscode-annil";

/** 根据注册的规则修复器生成 WXML Code Action。 */
function generateWxmlCodeActions(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  return generateRegisteredWxmlFixes(document, diagnostic);
}

function generateJsonCodeActions(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  return generateRegisteredJsonFixes(document, diagnostic);
}

function generateTsCodeActions(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  return generateRegisteredTsFixes(document, diagnostic);
}

function generateCodeActionsForDiagnostic(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  if (document.languageId === "wxml") return generateWxmlCodeActions(document, diagnostic);
  if (document.languageId === "json") return generateJsonCodeActions(document, diagnostic);

  return [];
}

// ---------- CodeActionProvider ----------

class WxmlCodeActionProvider implements vscode.CodeActionProvider {
  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    if (context.diagnostics.length === 0) return [];

    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      // 只处理本插件产生的诊断
      if (diagnostic.source !== EXTENSION_NAME) continue;
      // 只处理与请求范围相交的诊断（VS Code 可能传入文件中全部诊断）
      if (!diagnostic.range.intersection(range)) continue;
      actions.push(...generateWxmlCodeActions(document, diagnostic));
    }

    return actions;
  }
}

/** 为 JSON 配置诊断提供最小 Quick Fix 集合。 */
class JsonCodeActionProvider implements vscode.CodeActionProvider {
  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    return context.diagnostics.flatMap((diagnostic) => {
      if (diagnostic.source !== EXTENSION_NAME) return [];
      if (!diagnostic.range.intersection(range)) return [];

      return generateJsonCodeActions(document, diagnostic);
    });
  }
}

/** 为 TypeScript 诊断提供手动 Quick Fix；这些修复不参与 fix-all。 */
class TypeScriptCodeActionProvider implements vscode.CodeActionProvider {
  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    return context.diagnostics.flatMap((diagnostic) => {
      if (diagnostic.source !== EXTENSION_NAME) return [];
      if (!diagnostic.range.intersection(range)) return [];

      return generateTsCodeActions(document, diagnostic);
    });
  }
}

// ---------- 注册 ----------

/**
 * 注册 WXML/JSON/TypeScript CodeActionProvider 和组件级全局修复命令。
 * fix-all 使用的 resolver 刻意不包含 TypeScript 修复。
 */
export function registerCodeActionProvider(context: vscode.ExtensionContext): void {
  const authorization = new GithubStarAuthorization(context);
  context.subscriptions.push(authorization.startDailyValidation());
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider("wxml", new WxmlCodeActionProvider()),
  );
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider("json", new JsonCodeActionProvider()),
  );
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider("typescript", new TypeScriptCodeActionProvider()),
  );
  registerFixAllCommand(context, generateCodeActionsForDiagnostic, authorization);
}
