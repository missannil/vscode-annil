import { type Domhandler, type vscode } from "#deps";
import { configuration } from "../../configuration/index.js";
import type { TsFileInfo } from "../types/TsFileInfo.js";
import { checkAnnilCommentNode } from "./comment/checkAnnilCommentNode.js";
import { WxmlValidationContext } from "./context.js";
import { resolveChunkId, validateChunkComponent } from "./customComponent/validateChunkComponent.js";
import { validateCustomComponent } from "./customComponent/validateCustomComponent.js";
import { validateConditionStructure } from "./element/condition/validateConditionStructure.js";
import { findOpeningTagAttributeValueRange, positionAt } from "./element/openingTag.js";
import { validateBlockAttributes } from "./element/validateBlockAttributes.js";
import { validateDuplicateId } from "./element/validateDuplicateId.js";
import { validateEmptyBlock } from "./element/validateEmptyBlock.js";
import { validateNativeEvents } from "./element/validateNativeEvent.js";
import { validateRepeatSubComponentTag } from "./element/validateRepeatSubComponentTag.js";
import { isNativeTag, validateUnknownTag } from "./element/validateUnknownTag.js";
import { validateWxForAttributes } from "./element/validateWxForAttributes.js";
import { validateWxForStructure } from "./element/validateWxForStructure.js";
import { validateAttributeValues, validateMustacheText } from "./expression/validateMustache.js";
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
  const existingIds = new Set<string>();

  walkWxmlNodeList(wxmlDocument.children, context, {
    onEnterNodeList(currentContext) {
      currentContext.pushConditionScope();
    },
    onElementNode(node, startLine, currentContext) {
      validateDuplicateId(node, startLine, currentContext.textlines, existingIds, currentContext.diagnosticList);

      currentContext.traversal.isHeadLocation = false;

      if (currentContext.comment.isCommented()) return;

      validateConditionStructure(
        node,
        startLine,
        currentContext,
        getEffectiveValidNames(validNames, currentContext, tsFileInfo),
        getEffectiveBooleanNames(currentContext, tsFileInfo),
        node.startIndex ?? undefined,
      );

      const customComponentInfo = tsFileInfo.customComponentInfoRecord[node.name];

      if (customComponentInfo) {
        validateRepeatSubComponentTag(
          node,
          startLine,
          currentContext.textlines,
          currentContext.scope.checkedSubComponentTags,
          currentContext.comment.repeatTagStatus,
          currentContext.diagnosticList,
        );
        // wx:* 控制属性在当前作用域中校验（不含本元素的 wx:for 作用域）
        const effectiveNames = getEffectiveValidNames(validNames, currentContext, tsFileInfo);
        validateAttributeValues(
          Object.entries(node.attribs).filter(([name]) => name.startsWith("wx:")),
          effectiveNames,
          currentContext.diagnosticList,
          (name, value) => findOpeningTagAttributeValueRange(currentContext.textlines, startLine, name, value).start,
        );
        validateCustomComponent(
          node,
          startLine,
          customComponentInfo,
          effectiveNames,
          currentContext.textlines,
          currentContext.diagnosticList,
        );

        return;
      }

      if (!isNativeTag(node.name) && !configuration.ignoreTags.includes(node.name)) {
        validateUnknownTag(node, startLine, currentContext.textlines, currentContext.diagnosticList);

        return;
      }

      validateBlockAttributes(node, startLine, currentContext.textlines, currentContext.diagnosticList);
      validateEmptyBlock(node, startLine, currentContext.textlines, currentContext.diagnosticList);
      validateWxForStructure(
        node,
        startLine,
        currentContext.textlines,
        currentContext.diagnosticList,
        node.startIndex ?? undefined,
      );
      validateWxForAttributes(node, startLine, currentContext, tsFileInfo);

      // ChunkComponent：原生元素 + id 命中 chunkComponentInfoRecord
      const chunkId = resolveChunkId(node, tsFileInfo.chunkComponentInfoRecord);
      if (chunkId !== undefined) {
        currentContext.pushChunkMark(chunkId);
        validateChunkComponent(
          node,
          startLine,
          chunkId,
          tsFileInfo,
          validNames,
          currentContext.diagnosticList,
          currentContext.textlines,
        );

        return;
      }

      // 普通原生元素
      validateNativeEvents(
        node,
        startLine,
        currentContext.textlines,
        tsFileInfo.rootComponentInfo.events,
        currentContext.diagnosticList,
      );
      validateAttributeValues(
        Object.entries(node.attribs).filter(([name]) => {
          const isConditionAttribute = name === "wx:if" || name === "wx:elif" || name === "wx:else";

          return !name.startsWith("wx:for") && name !== "wx:key" && !(node.name === "block" && isConditionAttribute);
        }),
        getEffectiveValidNames(validNames, currentContext, tsFileInfo),
        currentContext.diagnosticList,
        (name, value) => findOpeningTagAttributeValueRange(currentContext.textlines, startLine, name, value).start,
      );
    },
    onBeforeElementChildren(node, _, currentContext) {
      // wx:for 作用域在元素自身属性校验完成后、子节点递归前建立
      if ("wx:for" in node.attribs) {
        currentContext.pushWxForScope(
          node.attribs["wx:for-item"] ?? "item",
          node.attribs["wx:for-index"] ?? "index",
        );
      }
    },
    onTextNode(node, startLine, currentContext) {
      if (node.data.trim() === "" || currentContext.comment.isCommented()) return;

      validateMustacheText(
        node.data,
        getEffectiveValidNames(validNames, currentContext, tsFileInfo),
        currentContext.diagnosticList,
        positionAt(currentContext.textlines, node.startIndex ?? 0),
      );
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
    onAfterElementNode(node, _, nodeLevelMark, currentContext) {
      if ("wx:for" in node.attribs) {
        currentContext.popWxForScope();
      }
      // 离开 ChunkComponent 作用域
      if (node.attribs.id !== undefined && tsFileInfo.chunkComponentInfoRecord[node.attribs.id] !== undefined) {
        currentContext.popChunkMark();
      }

      currentContext.comment.tryExpireStatus("afterElement", nodeLevelMark);
      currentContext.comment.disableRepeatTag();
    },
    onLeaveNodeList(nodeLevelMark, currentContext) {
      currentContext.popConditionScope();
      currentContext.comment.tryExpireStatus("afterNodeList", nodeLevelMark);
    },
  });

  return context.diagnosticList;
}

/**
 * 合并当前作用域下所有有效变量名：
 *   - rootData
 *   - wx:for item/index 栈
 *   - 外层 ChunkComponent 的 dataList
 */
function getEffectiveValidNames(
  baseNames: ReadonlySet<string>,
  context: WxmlValidationContext,
  tsFileInfo: TsFileInfo,
): Set<string> {
  const { wxForItemNames, wxForIndexNames, outerChunkTagMarks } = context.scope;
  let merged = new Set(baseNames);

  if (wxForItemNames.length > 0 || wxForIndexNames.length > 0) {
    merged = new Set([...merged, ...wxForItemNames, ...wxForIndexNames]);
  }

  // 合并外层 chunk 的 dataList
  for (const mark of outerChunkTagMarks) {
    const chunkInfo = tsFileInfo.chunkComponentInfoRecord[mark];
    if (chunkInfo !== undefined) {
      for (const name of chunkInfo.dataList) merged.add(name);
    }
  }

  return merged;
}

/** 合并当前作用域中可作为简单条件使用的布尔变量名。 */
function getEffectiveBooleanNames(
  context: WxmlValidationContext,
  tsFileInfo: TsFileInfo,
): Set<string> {
  const booleanNames = new Set([
    ...tsFileInfo.rootComponentInfo.boolTypeDatas,
    ...context.scope.wxForItemNames,
  ]);

  for (const mark of context.scope.outerChunkTagMarks) {
    const chunkInfo = tsFileInfo.chunkComponentInfoRecord[mark];
    if (chunkInfo !== undefined) {
      for (const name of chunkInfo.boolTypeDatas) booleanNames.add(name);
    }
  }

  return booleanNames;
}
