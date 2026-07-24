import { type Domhandler, vscode } from "#deps";
import type { TsFileInfo } from "../types/TsFileInfo.js";
import { checkAnnilCommentNode } from "./comment/checkAnnilCommentNode.js";
import { WxmlValidationContext } from "./context.js";
import { walkWxmlNodeList } from "./walkNodeList.js";

/**
 * WXML 校验的唯一入口。
 *
 * Linter 只负责提供已解析的文件信息并发布诊断；所有 WXML 规则都从这里进入。
 * 后续新增子组件属性、wx:for 等校验时，应在本模块中组合，而不要泄漏到 Linter。
 */
export function checkWxml(
  text: string,
  wxmlDocument: Domhandler.Document,
  tsFileInfo: TsFileInfo,
  validDatas: readonly string[],
): vscode.Diagnostic[] {
  const textlines = text.split("\n");
  const validNames = new Set([...tsFileInfo.rootComponentInfo.dataList, ...validDatas]);
  const context = new WxmlValidationContext(textlines);

  // 所有 WXML 规则复用同一套遍历和诊断上下文。
  walkWxmlNodeList(wxmlDocument.children, context, {
    onElementNode(node, _, currentContext) {
      // 第一个元素之后，`annil disable all` 不再允许出现。
      currentContext.traversal.isHeadLocation = false;
      // 注释状态由本模块维护，生效时跳过当前元素的全部校验规则。
      if (currentContext.comment.isCommented()) return;

      const subComponentInfo = tsFileInfo.subComponentInfoRecord[node.name];
      // 如果是自定义组件
      if (subComponentInfo) {
        // 自定义组件的普通属性必须按 configInfo 精确校验，不能当作根数据直接扫描。
        // 当前先校验仍处于父级模板作用域的 wx:* 控制属性；普通属性校验将在此处接入。
        checkRootDataAttributes(
          Object.entries(node.attribs).filter(([name]) => name.startsWith("wx:")),
          currentContext.textlines,
          validNames,
          currentContext.diagnosticList,
        );

        return;
      }

      // 非自定义组件的所有属性值都在 RootComponent 数据作用域中。
      checkRootDataAttributes(
        Object.entries(node.attribs),
        currentContext.textlines,
        validNames,
        currentContext.diagnosticList,
      );
    },
    onTextNode(node, _, currentContext) {
      // 空白文本或被 Annil 注释屏蔽的文本不执行数据校验。
      if (node.data.trim() === "" || currentContext.comment.isCommented()) return;

      // 文本插值不属于组件属性，始终按 RootComponent 数据作用域校验。
      checkMustacheMatches(node.data, currentContext.textlines, validNames, currentContext.diagnosticList);
    },
    onCommentNode(node, startLine, nodeLevelMark, currentContext) {
      const commentData = node.data;
      if (typeof commentData !== "string" || !currentContext.comment.isAnnilComment(commentData)) return;

      const commentType = checkAnnilCommentNode(
        commentData,
        startLine,
        currentContext.comment,
        currentContext.diagnosticList,
        currentContext.textlines,
        currentContext.traversal.isHeadLocation,
      );
      if (commentType) {
        currentContext.comment.setStatus(commentType, nodeLevelMark);
      }
    },
    onAfterElementNode(_, __, nodeLevelMark, currentContext) {
      currentContext.comment.tryExpireStatus("afterElement", nodeLevelMark);
      currentContext.comment.disableRepeatTag();
    },
    onLeaveNodeList(nodeLevelMark, currentContext) {
      currentContext.comment.tryExpireStatus("afterNodeList", nodeLevelMark);
    },
  });

  return context.diagnosticList;
}

const MUSTACHE_RE = /\{\{(.+?)\}\}/g;

/** 校验处于 RootComponent 数据作用域中的一组元素属性。 */
function checkRootDataAttributes(
  attributes: Array<[string, string]>,
  textlines: string[],
  validNames: Set<string>,
  diagnostics: vscode.Diagnostic[],
): void {
  for (const [, value] of attributes) {
    checkMustacheMatches(value, textlines, validNames, diagnostics);
  }
}

/** 扫描文本中的 {{...}}，逐个校验根组件数据引用。 */
function checkMustacheMatches(
  text: string,
  textlines: string[],
  validNames: Set<string>,
  diagnostics: vscode.Diagnostic[],
): void {
  for (const match of text.matchAll(MUSTACHE_RE)) {
    const expr = match[1].trim();

    if (expr === "item" || expr === "index" || expr.startsWith("...")) continue;
    if (expr.includes("(") || expr.includes("+") || expr.includes("?")) continue;

    const topVar = expr.split(".")[0];
    if (validNames.has(topVar)) continue;

    const { line, col } = findMustachePosition(match, textlines);
    diagnostics.push(
      new vscode.Diagnostic(
        new vscode.Range(line, col, line, col + match[0].length),
        `未知数据: "${topVar}"`,
        vscode.DiagnosticSeverity.Warning,
      ),
    );
  }
}

/** 在源码行数组中定位指定 mustache 的位置。 */
function findMustachePosition(
  match: RegExpMatchArray,
  textlines: string[],
): { line: number; col: number } {
  const needle = match[0];

  for (let i = 0; i < textlines.length; i++) {
    const col = textlines[i].indexOf(needle);
    if (col >= 0) return { line: i, col };
  }

  return { line: 0, col: 0 };
}
