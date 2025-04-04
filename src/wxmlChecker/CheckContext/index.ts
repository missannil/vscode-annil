import type { Element } from "domhandler";
import * as vscode from "vscode";
import type { TsFileInfo } from "../../componentManager/tsFileManager/types";
import { configuration } from "../../configuration";
import { assertNonNullable } from "../../utils/assertNonNullable";
import type { WxForVariables } from "../checkNodeList/checkElementNode/checkNativeTag/checkBlockTag/checkWxForBlock";
import { CommentManager } from "./CommentManager";

export type ConditionAttrName = "wx:if" | "wx:elif" | "wx:else";

export type WxForInfos = { itemNames: string[]; indexNames: string[] };

// 之前的条件节点属性名（wx:if, wx:elif, wx:else =>null）用于后续条件节点的检测(比如之前为null,则后续的条件节点只能为wx:if)
export type PreConditionAttrName = Exclude<ConditionAttrName, "wx:else"> | null;

// 待检测的条件元素信息(条件元素的属性值不是立即检测的，而是在后续的某个时间点检测)
export type PendingConditionBlockInfo = null | {
  conditionAttrName: ConditionAttrName;
  mustacheValue: string;
  startLine: number;
};

export class CheckContext extends CommentManager {
  // wxml文件 文本行列表
  #textlines!: string[];
  public get textlines(): string[] {
    return this.#textlines;
  }
  // ts文件信息
  #tsFileInfo: TsFileInfo;
  public get tsFileInfo(): TsFileInfo {
    return this.#tsFileInfo;
  }
  // 忽略的字段
  public get ignoreFeilds(): string[] {
    return configuration.ignoreFeilds;
  }
  public get ignoreTags(): string[] {
    return configuration.ignoreTags;
  }
  // 允许的未知属性
  public get allowUnknownAttributes(): string[] {
    return configuration.allowUnknownAttributes;
  }
  public isAllowedUnknownAttribute(attrName: string): boolean {
    return this.allowUnknownAttributes.includes(attrName);
  }
  // 外层chunk标签的标记 tagName or id
  #outerChunkTagMarks: string[] = [];
  public get outerChunkTagMasks(): string[] {
    return this.#outerChunkTagMarks;
  }
  public saveChunkTagMark(value: string): void {
    this.#outerChunkTagMarks.push(value);
  }
  public popChunkTagMarks(): void {
    this.#outerChunkTagMarks.pop();
  }
  public getOuterChunkTagVariables(): string[] {
    return this.#outerChunkTagMarks.flatMap((id) =>
      assertNonNullable(this.tsFileInfo.chunkComopnentInfos[id]).dataList
    );
  }
  // 之前的条件节点属性名
  #preConditionAttrName: PreConditionAttrName = null;
  public get preConditionAttrName(): PreConditionAttrName {
    return this.#preConditionAttrName;
  }
  public set preConditionAttrName(conditionAttrName: PreConditionAttrName) {
    this.#preConditionAttrName = conditionAttrName;
  }
  // 诊断列表
  #diagnosticList = [] as vscode.Diagnostic[];
  public get diagnosticList(): vscode.Diagnostic[] {
    return this.#diagnosticList;
  }
  // 待检测的自定义组件列表(ts文件中的定义的自定义组件)
  #pendingCustomTags!: string[];
  public get pendingCustomTags(): string[] {
    return this.#pendingCustomTags;
  }
  // 待检测的chunk组件列表(ts文件中的定义的chunk组件)
  #pendingChunkTags!: string[];
  public get pendingChunkTags(): string[] {
    return this.#pendingChunkTags;
  }
  // 已检测完的组件列表
  #checkedComponentTags: string[] = [];
  public get checkedCustomTags(): string[] {
    return this.#checkedComponentTags;
  }
  public saveCheckedComponentTags(customTagName: string): void {
    this.#checkedComponentTags.push(customTagName);
  }
  // 已存在的id列表
  #existingIdList: string[] = [];
  public get existingIdList(): string[] {
    return this.#existingIdList;
  }
  // 保存元素id
  public saveElementId(elementId: string): void {
    this.#existingIdList.push(elementId);
  }
  // 元素是否为文件头部位置，用于检测某些元素是否在文件头部位置(比如全局注释)
  #isHeadLocation: boolean = true;
  public get isHeadLocation(): boolean {
    return this.#isHeadLocation;
  }
  public set isHeadLocation(value: false) {
    this.#isHeadLocation = value;
  }

  public isCustomTag(elementNode: Element): boolean {
    return this.#pendingCustomTags.includes(elementNode.name);
  }
  public isChunkTag(elementNode: Element): boolean {
    // chunk组件名对应标签的id
    return this.#pendingChunkTags.includes(elementNode.name) || this.#pendingChunkTags.includes(elementNode.attribs.id);
  }
  public getChunkTagMark(elementNode: Element): string {
    // chunk组件名对应标签的id
    return this.#pendingChunkTags.includes(elementNode.name) ? elementNode.name : elementNode.attribs.id;
  }
  public isCheckedSubComponentTag(tagMark: string): boolean {
    return this.#checkedComponentTags.includes(tagMark);
  }

  public isIgnoreAttr(rawAttrName: string): boolean {
    return rawAttrName.startsWith("data-") || this.ignoreFeilds.includes(rawAttrName);
  }

  // 待检测的条件元素信息
  #pendingConditionBlockInfo: PendingConditionBlockInfo = null;
  public get pendingConditionBlockInfo(): PendingConditionBlockInfo {
    return this.#pendingConditionBlockInfo;
  }
  public set pendingConditionBlockInfo(conditionBlockInfo: PendingConditionBlockInfo) {
    this.#pendingConditionBlockInfo = conditionBlockInfo;
  }
  // wx:for元素信息
  #wxForInfos: WxForInfos = { indexNames: [], itemNames: [] };
  public get wxForInfos(): WxForInfos {
    return this.#wxForInfos;
  }
  public addWxForInfos(wxForVariables: WxForVariables): void {
    this.#wxForInfos.itemNames.push(wxForVariables["wx:for-item"]);
    this.#wxForInfos.indexNames.push(wxForVariables["wx:for-index"]);
  }
  public popWxForInfos(): void {
    this.#wxForInfos.itemNames.pop();
    this.#wxForInfos.indexNames.pop();
  }
  public constructor(
    textlines: string[],
    tsFileInfo: TsFileInfo,
  ) {
    super();
    this.#textlines = textlines;
    this.#tsFileInfo = tsFileInfo;
    this.#pendingCustomTags = Object.keys(tsFileInfo.customComponentInfos);
    this.#pendingChunkTags = Object.keys(tsFileInfo.chunkComopnentInfos);
  }
}
