/* eslint-disable complexity */
import type { ChildNode, Element } from "domhandler";
import * as vscode from "vscode";
import { ignoreTags } from "../../src/utils/ignoreAttrs";
import { type TsFileInfo } from "../componentManager/tsFileManager";
import { type WxmlFileInfo } from "../componentManager/wxmlFileManager";
import {
  DiagnosticErrorType,
  type DuplicateId,
  type MissingComopnent,
  type UnknownTag,
} from "../diagnosticFixProvider/errorType";
import { assertNonNullable } from "../utils/assertNonNullable";
import {
  BlockTagChecker,
  type BlockTagInfo,
  type ConditionBlock,
  type ConditionState,
  type WxForInfo,
} from "./checker/checknativeTag/checkBlockTag";
import { CustomTagChecker } from "./checker/customTagChecker";
import { generateDiagnostic } from "./generateDiagnostic";
import { nodeType } from "./getNodeType";
import { rangeRegexp } from "./rangeRegexp";

export class WxmlChecker {
  // 诊断错误的集合,最后返回给调用者
  private diagnosticList: vscode.Diagnostic[] = [];
  // 初始化时,记录tsFileInfo中所有的自定义组件,在检测wxml时,如果有匹配到的自定义组件,则从这里删除,最后检测这个列表,如果不为空,则说明有未匹配到的自定义组件,诊断为`丢失的自定义组件`。诊断中确定是否为自定义组件标签时也会根据这个列表来判断。
  private expectCustomComponentList: readonly string[] = [];
  private currentCustomComponents: string[] = [];
  // 记录元素节点的id,为了id重复检测
  private idList: string[] = [];
  private wxmlTextlines: string[] = [];
  // 检测缺少的自定义组件
  private checkMissingComponentTag(): void {
    const missingComponentList = this.expectCustomComponentList.filter((customComponentName) =>
      !this.currentCustomComponents.includes(customComponentName)
    );
    // 有必要做成多个诊断错误吗？就一个不行么？使用join连接起来不可以么？
    missingComponentList.forEach((customComponentName) => {
      this.diagnosticList.push(
        new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 0),
          `${DiagnosticErrorType.missingComopnent}:${customComponentName}` satisfies MissingComopnent,
          vscode.DiagnosticSeverity.Error,
        ),
      );
    });
  }
  // 获取行号
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
  // 删除当前匹配到的自定义组件,避免wxml中多个重复组件匹配到同一个自定义组件配置。
  private saveCustomComponent(element: Element): void {
    const tagName = element.name;
    const elementId = element.attribs.id as string | undefined;
    if (elementId !== undefined && this.expectCustomComponentList.includes(elementId)) {
      this.currentCustomComponents.push(elementId);
    } else {
      this.currentCustomComponents.push(tagName);
    }
  }
  // 未匹配的自定义组件
  // private getUnMatchedSubCompList(tsFileInfo: TsFileInfo): string[] {
  //   return Object.keys(tsFileInfo.subComponentInfo).filter((subCompKey) => !this.matchedTagList.includes(subCompKey));
  // }

  private isConditionBlock(blockTagInfo: BlockTagInfo): blockTagInfo is ConditionBlock {
    return (blockTagInfo as ConditionBlock).conditionState !== undefined;
  }
  private checkBlockTag(
    childNode: Element,
    startLine: number,
    wxForInfoList: WxForInfo[],
    preConditionState: ConditionState | null,
  ): { curWxForInfoList: WxForInfo[]; preConditionState: ConditionState | null } {
    const blockTagChecker: BlockTagChecker = new BlockTagChecker(
      childNode,
      startLine,
      this.wxmlTextlines,
      wxForInfoList,
      this.tsFileInfo.rootComponentInfo,
      preConditionState,
    );
    const blockTagInfo: BlockTagInfo = blockTagChecker.start();
    this.diagnosticList.push(...blockTagInfo.diagnosticList);
    const curWxForInfoList = [...wxForInfoList];
    if (this.isConditionBlock(blockTagInfo)) {
      preConditionState = blockTagInfo.conditionState;
    } else {
      curWxForInfoList.push(blockTagInfo.wxForInfo);
    }

    return { curWxForInfoList, preConditionState };
  }
  private duplicatedIdCheck(childNode: Element): boolean {
    const id = childNode.attribs.id as string | undefined;
    if (id !== undefined) {
      if (this.idList.includes(id)) {
        // 生成重复id错误
        this.diagnosticList.push(
          generateDiagnostic(
            rangeRegexp.getFullAttrRegexp("id"),
            `${DiagnosticErrorType.duplicateId}` satisfies DuplicateId,
            this.wxmlTextlines,
            this.getLineNumber(this.wxmlTextlines, assertNonNullable(childNode.startIndex)),
          ),
        );

        return true;
      } else {
        this.idList.push(id);
      }
    }

    return false;
  }
  private isIgnoreTag(childNode: Element): boolean {
    const tagName = childNode.tagName;
    // 忽略的标签
    if (ignoreTags.includes(tagName)) {
      return true;
    }

    return false;
  }
  /**
   * 递归检测节点列表
   * 1. 一层的节点共用一个wxForInfoList,下一层的节点会继承上一层的wxForInfoList
   * 2. 一层节点的preConditionState会记录上一个条件节点的状态,初始化为null,如果当前检测的是条件节点,需要更新preConditionState
   * 3. 所有节点产生的diagnotic都会push到this.diagnosticList中
   * 4. 遇到自定义组件,需要记录到exsitingCustomComponents中,用于丢失自定义组件的检测
   */
  private checkNodeList(
    childNodeList: ChildNode[],
    wxForInfoList: WxForInfo[],
  ): void {
    // 在遍历同级子节点前初始化一个条件节点的状态(null),作为后续同级条件节点的诊断条件之一,后续的条件节点诊断后应更新这个状态。
    // 比如 第一个节点是 <block wx:if = "{{true}}" /block> ,第二个节点是 <block wx:elif = "{{true}}" /block> 在检测第二个节点时,需要用到第一个节点的状态。比如 elif 的前一个节点是 wx:if,则elif是合法的,否则是非法的。preConditionState就是用来记录前一个条件节点的状态。
    let preConditionState: ConditionState | null = null;
    // 遍历同级子节点
    for (const childNode of childNodeList) {
      // 元素节点 有可能是自定义组件或原生组件(swiper,block),也有可能是未知组件(小程序新出的原生组件或重复的自定义组件)
      if (nodeType.isElement(childNode)) {
        if (this.duplicatedIdCheck(childNode)) {
          continue;
        }
        // 被忽略时返回true,不再继续检测
        if (this.isIgnoreTag(childNode)) {
          continue;
        }
        const tagName = childNode.tagName;
        // 获取当前节点的行号,后续查找位置时从行号开始找,性能更好
        const startLine = this.getLineNumber(this.wxmlTextlines, assertNonNullable(childNode.startIndex));
        if (nodeType.isCustomTag(childNode, this.expectCustomComponentList)) {
          // 如果是根据id匹配的自定义组件,则使用id作为key,否则使用tagName作为key
          this.saveCustomComponent(childNode);
          // 获取自定义组件的配置
          const attributeConfig = assertNonNullable(
            this.tsFileInfo.subComponentInfo[tagName] || this.tsFileInfo.subComponentInfo[childNode.attribs.id],
          );
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
            // wx:for 属于原生(block)组件,所以把上一层的wxForInfoList直接传递给下一层的节点,为了避免同层后面(相比这里)节点的wx:for影响到前面(这里)的节点(后续如果遇到wxFor信息会加入wxForInfoList中),所以这里传递时要用扩展运算符,好比克隆了一份。
            this.checkNodeList(children, [...wxForInfoList]);
          }
        } else if (nodeType.isNativeTag(childNode)) {
          if (childNode.tagName === "block") {
            const res = this.checkBlockTag(
              childNode,
              startLine,
              wxForInfoList,
              preConditionState,
            );
            preConditionState = res.preConditionState;
            const children = childNode.children;
            if (children.length > 0) {
              this.checkNodeList(children, res.curWxForInfoList);
              continue;
            }
          }
          const children = childNode.children;
          if (children.length > 0) {
            this.checkNodeList(children, wxForInfoList);
          }
        } else {
          // 生成未知标签错误
          this.diagnosticList.push(
            generateDiagnostic(
              rangeRegexp.getTagNameRegexp(tagName),
              `${DiagnosticErrorType.unknownTag}:${tagName}` satisfies UnknownTag,
              this.wxmlTextlines,
              startLine,
            ),
          );
        }
      } else if (nodeType.isTextNode(childNode)) {
        // 文本节点以后再写
        // const text = (childNode as Text).data.trim().split(/\r?\n/);
      } else {
        // nodeType === NodeType["otherTag"] 注释节点等
      }
    }
  }
  public constructor(private wxmlFileInfo: WxmlFileInfo, private tsFileInfo: TsFileInfo) {
    this.expectCustomComponentList = Object.keys(tsFileInfo.subComponentInfo);
    // 把wxml按`\n`变为数组,为了后面手动找到错误位置(行号,开始索引,列号,结束索引),因为解析器(htmlparser2只有startIndex,endIndex,没有position信息)
    this.wxmlTextlines = this.wxmlFileInfo.text.split(/\n/);
  }
  public start(): vscode.Diagnostic[] {
    this.checkNodeList(this.wxmlFileInfo.wxmlDocument.children, []);
    this.checkMissingComponentTag();

    return this.diagnosticList;
  }
}
