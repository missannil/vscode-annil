import type { ChildNode } from "domhandler";
import * as vscode from "vscode";
import {
  type RootComponentInfo,
  type SubComponentInfo,
  type TsFileInfo,
  type WxForDefault,
} from "../../componentManager/tsFileManager";
import { DiagnosticErrorType, type MissingComopnent } from "../../diagnosticFixProvider/errorType";
import { assertNonNullable } from "../../utils/assertNonNullable";
import { nodeType } from "../getNodeType";
import { checkNativeTag } from "./checknativeTag";
import { CustomTagChecker } from "./customTagChecker";

export type WxForInfo = Record<WxForDefault, string>;

export type ConditionState = "wx:if" | "wx:elif" | "wx:else";

export type BlockTagInfo = { wxFor?: WxForInfo; conditionState?: ConditionState };

export type BlockTagInfoList = BlockTagInfo[];

export class Checker {
  private diagnosticList: vscode.Diagnostic[] = [];
  private existingCustomTagList: string[] = [];
  public constructor(
    private nodeList: ChildNode[],
    private wxmlTextlines: string[],
    private tsFileInfo: TsFileInfo,
  ) {}
  private get subComponentInfo(): SubComponentInfo {
    return this.tsFileInfo.subComponentInfo;
  }
  private get rootComponentInfo(): RootComponentInfo {
    return this.tsFileInfo.rootComponentInfo;
  }
  private get subComponentNameList(): string[] {
    return Object.keys(this.subComponentInfo);
  }
  private checkMissingComponentTag(): void {
    const missingTags = this.subComponentNameList.filter((subCompKey) =>
      !this.existingCustomTagList.includes(subCompKey)
    );
    missingTags.forEach((customComponentName) => {
      this.diagnosticList.push(
        new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 0),
          `${DiagnosticErrorType.missingComopnent}:${customComponentName}` satisfies MissingComopnent,
          vscode.DiagnosticSeverity.Error,
        ),
      );
    });
  }
  private getLineNumber(lines: string[], startIndex: number): number {
    let stringLength = 0;
    for (let i = 0; i <= lines.length; i++) {
      // 加1是因为split的时候会把\n去掉,实际长度比split的长度多1
      stringLength += lines[i].length + 1;
      if (stringLength > startIndex) {
        return i;
      }
    }

    return -1; // 如果没有找到，返回-1
  }
  /**
   * 递归检测节点列表
   */
  private checkNodeList(childNodeList: ChildNode[], blockTagInfoList: BlockTagInfoList): void {
    for (const childNode of childNodeList) {
      if (nodeType.isElement(childNode)) {
        const tagName = childNode.name;
        const startLine = this.getLineNumber(this.wxmlTextlines, assertNonNullable(childNode.startIndex));
        if (nodeType.isCustomTag(childNode, this.subComponentNameList)) {
          // console.log(childNode., "customTag")
          const attributeConfig = assertNonNullable(
            this.subComponentInfo[tagName] || this.subComponentInfo[childNode.attribs.id],
          );
          this.existingCustomTagList.push(tagName);
          const customTagChecker = new CustomTagChecker(
            childNode,
            startLine,
            this.wxmlTextlines,
            blockTagInfoList,
            attributeConfig,
          );
          this.diagnosticList.push(...customTagChecker.start());
          const children = childNode.children;
          if (children.length > 0) {
            this.checkNodeList(children, blockTagInfoList);
          }
        } 
        else if (nodeType.isNativeTag(childNode, this.subComponentNameList)) {
          const checkResult = checkNativeTag(
            childNode,
            this.wxmlTextlines,
            startLine,
            [...blockTagInfoList],
            this.rootComponentInfo,
          );
          this.diagnosticList.push(...checkResult.diagnosticList);
          const children = childNode.children;
          if (children.length > 0) {
            this.checkNodeList(children, checkResult.blockTagInfoList);
          }
        }
      } else if (nodeType.isTextNode(childNode)) {
        // const kkk = (childNode as Text).data.trim().split(/\r?\n/);
        // console.log(childNode, "text", childNode.prev?.type, childNode.previousSibling?.type);
        // diagnosticList.push(
        //   ...generateTextNodeDiagnostics(childNode as Text, wxForInfo, tsRootComponentInfo.data, currentTagStartLine),
        // );
      } else {
        // nodeType === NodeType["otherTag"] 注释节点
      }
    }
  }
  public start(): vscode.Diagnostic[] {
    this.checkNodeList(this.nodeList, []);
    this.checkMissingComponentTag();

    return this.diagnosticList;
  }
}
