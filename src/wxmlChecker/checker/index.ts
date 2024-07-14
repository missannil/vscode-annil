/* eslint-disable complexity */
import type { ChildNode } from "domhandler";
import * as vscode from "vscode";
import { type RootComponentInfo, type SubComponentInfo, type TsFileInfo } from "../../componentManager/tsFileManager";
import { DiagnosticErrorType, type MissingComopnent } from "../../diagnosticFixProvider/errorType";
import { assertNonNullable } from "../../utils/assertNonNullable";
import { nodeType } from "../getNodeType";
import {
  BlockTagChecker,
  type BlockTagInfo,
  type ConditionBlock,
  type ConditionState,
  type WxForInfo,
} from "./checknativeTag/checkBlockTag";
import { CustomTagChecker } from "./customTagChecker";

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
  private isConditionBlock(blockTagInfo: BlockTagInfo): blockTagInfo is ConditionBlock {
    return (blockTagInfo as ConditionBlock).conditionState !== undefined;
  }
  // export type BlockTagInfo = { wxFor?: WxForInfo; conditionState?: ConditionState };
  /**
   * 递归检测节点列表
   * 1. 一层的节点共用一个wxForInfoList,下一层的节点会继承上一层的wxForInfoList
   * 2. 一层节点的lastConditionState会记录上一个条件节点的状态,初始化为"",如果是条件节点,会更新lastConditionState
   * 3. 所有节点产生的diagnotic都会push到diagnosticList中,最后返回.
   */
  private checkNodeList(childNodeList: ChildNode[], wxForInfoList: WxForInfo[]): void {
    let preConditionState: ConditionState | null = null;

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
            wxForInfoList,
            attributeConfig,
          );
          this.diagnosticList.push(...customTagChecker.start());
          const children = childNode.children;
          if (children.length > 0) {
            this.checkNodeList(children, [...wxForInfoList]);
          }
        } else if (nodeType.isNativeTag(childNode, this.subComponentNameList)) {
          // 处理原生标签
          if (childNode.tagName === "block") {
            const blockTagChecker: BlockTagChecker = new BlockTagChecker(
              childNode,
              startLine,
              this.wxmlTextlines,
              wxForInfoList,
              this.rootComponentInfo,
              preConditionState,
            );
            const blockTagInfo: BlockTagInfo = blockTagChecker.start();
            const curWxForInfoList = [...wxForInfoList];
            if (this.isConditionBlock(blockTagInfo)) {
              preConditionState = blockTagInfo.conditionState;
            } else {
              curWxForInfoList.push(blockTagInfo.wxForInfo);
            }
            this.diagnosticList.push(...blockTagInfo.diagnosticList);
            const children = childNode.children;
            if (children.length > 0) {
              this.checkNodeList(children, curWxForInfoList);
              continue;
            }
          }
          const children = childNode.children;
          if (children.length > 0) {
            this.checkNodeList(children, wxForInfoList);
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
