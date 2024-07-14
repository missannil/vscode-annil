/* eslint-disable complexity */
import type { Element } from "domhandler";
import * as vscode from "vscode";
import { type RootComponentInfo, type WxForDefault } from "../../../componentManager/tsFileManager";
import {
  type ConditionalAttrExisted,
  DiagnosticErrorType,
  type InvalidValue,
  type MissingNeedfulAttr,
  type MissPrerequisite,
  type MustacheSyntax,
  type NonArrType,
  type ShouldwithoutValue,
  type UnknownAttr,
  type WithoutValue,
} from "../../../diagnosticFixProvider/errorType";
import { getMustacheValue } from "../../../utils/getMustacheValue";
import { ignoreAttrs } from "../../../utils/ignoreAttrs";
import { isMustacheStr } from "../../../utils/isMustacheStr";
import { isVariableStr } from "../../../utils/isVariableStr";
import { isWithoutValue } from "../../../utils/isWithoutValue";
import { generateDiagnostic } from "../../generateDiagnostic";
import { rangeRegexp } from "../../rangeRegexp";

const conditionalAttrs: ConditionState[] = ["wx:if", "wx:elif", "wx:else"];
type LoopAttrs = "wx:for" | "wx:for-item" | "wx:for-index" | "wx:key";
const loopAttrs: LoopAttrs[] = ["wx:for", "wx:for-item", "wx:for-index", "wx:key"];
const blockTagLegalAttrList = [...conditionalAttrs, ...loopAttrs];

export type ConditionState = "wx:if" | "wx:elif" | "wx:else";

export type WxForInfo = Record<WxForDefault, string>;

export type ConditionBlock = { conditionState: ConditionState; diagnosticList: vscode.Diagnostic[] };

export type WxForBlock = { wxForInfo: WxForInfo; diagnosticList: vscode.Diagnostic[] };

export type BlockTagInfo = ConditionBlock | WxForBlock;

export class BlockTagChecker {
  private diagnosticList: vscode.Diagnostic[] = [];
  private wxForInfo: WxForInfo = { item: "item", index: "index" };
  private currentConditionState?: ConditionState;
  public constructor(
    private readonly element: Element,
    private readonly startLine: number,
    private readonly wxmlTextlines: string[],
    private readonly wxForInfoList: WxForInfo[],
    private readonly rootComponentInfo: RootComponentInfo,
    private readonly preConditionState: ConditionState | null,
  ) {}
  private islegal(value: string): boolean {
    return this.rootComponentInfo.dataList.includes(value);
  }
  private getConditionAttrs(allRawAttrNames: string[]): string[] {
    return allRawAttrNames.filter((attrName) => this.isConditionalAttr(attrName));
  }
  // 互斥的属性检测 (wx:if 、 wx:elif 、 wx:else 互斥),除了第一个属性外,其他属性报错,返回报错的属性
  private checkMutuallyExclusiveAttrs(allRawAttrNames: string[]): string[] {
    const conditionAttrs = this.getConditionAttrs(allRawAttrNames);
    // 没有或只有一个条件属性,表示没有互斥属性.
    if (conditionAttrs.length <= 1) return [];
    const mutuallyExclusiveAttrs = conditionAttrs.slice(1);
    for (const conditionAttr of mutuallyExclusiveAttrs) {
      this.diagnosticList.push(
        generateDiagnostic(
          rangeRegexp.getFullAttrRegexp(conditionAttr),
          `${DiagnosticErrorType.conditionalAttrExisted}:${conditionAttrs[0]}` satisfies ConditionalAttrExisted,
          this.wxmlTextlines,
          this.startLine,
        ),
      );
    }

    return mutuallyExclusiveAttrs;
  }
  private isConditionalAttr(rawAttrName: string): rawAttrName is ConditionState {
    return conditionalAttrs.includes(rawAttrName as ConditionState);
  }
  private checkLoopValue(rawAttrName: LoopAttrs, rawAttrValue: string): void {
    // 0. 无值检测 报错在属性上 例如: wx:for (注意,无值指未写值的属性` wx:for="" `值为空串而非无值)
    if (isWithoutValue(rawAttrName, rawAttrValue, this.wxmlTextlines, this.startLine)) {
      // 传fixCode字段
      const fixCode = rawAttrName === "wx:for"
        ? "wx:for=\"{{数组类型变量名}}\""
        : rawAttrName === "wx:key"
        ? `${rawAttrName}="子字段名或*this"`
        : `${rawAttrName}="变量名"`;
      this.diagnosticList.push(
        generateDiagnostic(
          rangeRegexp.getFullAttrRegexp(rawAttrName),
          `${DiagnosticErrorType.withoutValue}:${rawAttrName}` satisfies WithoutValue,
          this.wxmlTextlines,
          this.startLine,
          fixCode,
        ),
      );

      return;
    }
    if (rawAttrName === "wx:for") {
      // 1. wx:for的值语法不是mustache
      if (!isMustacheStr(rawAttrValue)) {
        this.diagnosticList.push(
          generateDiagnostic(
            rangeRegexp.getFullValueRegexp(rawAttrName, rawAttrValue),
            `${DiagnosticErrorType.mustacheSyntax}:${rawAttrName}` satisfies MustacheSyntax,
            this.wxmlTextlines,
            this.startLine,
            `{{数组类型变量名}}`,
          ),
        );

        return;
      }
      // 2. wx:for的值不合法(只允许使用rootComponentInfo中的数组数据)
      const mustacheValue = getMustacheValue(rawAttrValue);
      const legalVaueList = this.rootComponentInfo.arrTypeData;
      if (!legalVaueList.includes(mustacheValue)) {
        this.diagnosticList.push(
          generateDiagnostic(
            rangeRegexp.getMustacheValueRegexp(rawAttrName, mustacheValue),
            `${DiagnosticErrorType.nonArrType}` satisfies NonArrType,
            this.wxmlTextlines,
            this.startLine,
            `数组类型变量名`,
          ),
        );

        return;
      }
    }
    if (rawAttrName === "wx:for-item") {
      if (isVariableStr(rawAttrValue)) {
        this.wxForInfo.item = rawAttrValue;
      } else {
        this.diagnosticList.push(
          generateDiagnostic(
            rangeRegexp.getFullValueRegexp(rawAttrName, rawAttrValue),
            `${DiagnosticErrorType.invalidValue}:${rawAttrName}` satisfies InvalidValue,
            this.wxmlTextlines,
            this.startLine,
            `变量名`,
          ),
        );
      }

      return;
    }
    if (rawAttrName === "wx:for-index") {
      if (isVariableStr(rawAttrValue)) {
        this.wxForInfo.index = rawAttrValue;
      } else {
        this.diagnosticList.push(
          generateDiagnostic(
            rangeRegexp.getFullValueRegexp(rawAttrName, rawAttrValue),
            `${DiagnosticErrorType.invalidValue}:${rawAttrName}` satisfies InvalidValue,
            this.wxmlTextlines,
            this.startLine,
            `变量名`,
          ),
        );
      }

      return;
    }
    if (rawAttrName === "wx:key") {
      if (isVariableStr(rawAttrValue) || rawAttrValue === "*this") return;
      this.diagnosticList.push(
        generateDiagnostic(
          rangeRegexp.getFullValueRegexp(rawAttrName, rawAttrValue),
          `${DiagnosticErrorType.invalidValue}:${rawAttrName}` satisfies InvalidValue,
          this.wxmlTextlines,
          this.startLine,
        ),
      );
    }
  }
  private checkConditionValue(rawAttrName: ConditionState, rawAttrValue: string): void {
    if (isWithoutValue(rawAttrName, rawAttrValue, this.wxmlTextlines, this.startLine)) {
      if (rawAttrName === "wx:else") return; // wx:else无值正常
      // 传fixCode字段
      this.diagnosticList.push(
        generateDiagnostic(
          rangeRegexp.getFullAttrRegexp(rawAttrName),
          `${DiagnosticErrorType.withoutValue}:${rawAttrName}` satisfies WithoutValue,
          this.wxmlTextlines,
          this.startLine,
          `${rawAttrName}="{{变量名}}"`,
        ),
      );

      return;
    }
    // 有值的情况
    if (rawAttrName === "wx:else") {
      this.diagnosticList.push(
        generateDiagnostic(
          rangeRegexp.getFullAttrRegexp(rawAttrName),
          `${DiagnosticErrorType.shouldwithoutValue}:${rawAttrName}` satisfies ShouldwithoutValue,
          this.wxmlTextlines,
          this.startLine,
          `wx:else`,
        ),
      );

      return;
    }
    // 1. 值不符合mustache语法
    if (!isMustacheStr(rawAttrValue)) {
      this.diagnosticList.push(
        generateDiagnostic(
          rangeRegexp.getFullValueRegexp(rawAttrName, rawAttrValue),
          `${DiagnosticErrorType.mustacheSyntax}:${rawAttrName}` satisfies MustacheSyntax,
          this.wxmlTextlines,
          this.startLine,
          `{{变量名}}`,
        ),
      );

      return;
    }
    // 2. 值不符合合法值(使用rootComponentInfo中的数据)
    // 得到所有的值,判断是否合法
    const mustacheValue = getMustacheValue(rawAttrValue);
    if (!this.islegal(mustacheValue)) {
      this.diagnosticList.push(
        generateDiagnostic(
          rangeRegexp.getMustacheValueRegexp(rawAttrName, mustacheValue),
          `${DiagnosticErrorType.invalidValue}:${rawAttrName}` satisfies InvalidValue,
          this.wxmlTextlines,
          this.startLine,
          // 不传fixCode字段不修复
        ),
      );

      return;
    }
  }
  // 因为checkValue是检测(循环的)最后阶段,所以返回值为void
  // 同样因为complexity过高,把属性值的检测分为两类分开检测
  private checkValue(rawAttrName: string, rawAttrValue: string): void {
    if (this.isLoopAttrs(rawAttrName)) {
      this.checkLoopValue(rawAttrName, rawAttrValue);

      return;
    }
    if (this.isConditionalAttr(rawAttrName)) {
      this.checkConditionValue(rawAttrName, rawAttrValue);
      // this.currentConditionState = rawAttrName;

      return;
    }
    throw Error("不应该有其他属性了");
  }
  // 缺少先决条件: 属性为`wx:elif` || `wx:else`时如果最后的lastConditionState中值null或为wx:else,这两个属性是缺少先决条件的)
  private missPrerequisite(rawAttrName: ConditionState, lastConditionState: ConditionState | null): boolean {
    return ["wx:elif", "wx:else"].includes(rawAttrName) && (!lastConditionState || lastConditionState === "wx:else");
  }
  private isLoopAttrs(rawAttrName: string): rawAttrName is LoopAttrs {
    return loopAttrs.includes(rawAttrName as LoopAttrs);
  }
  private isUnknownAttr(rawAttrName: string): rawAttrName is ConditionState | LoopAttrs {
    return !blockTagLegalAttrList.includes(rawAttrName as ConditionState | LoopAttrs);
  }
  private checkLoopAttrs(
    rawAttrName: LoopAttrs,
    isHasWxFor: boolean,
  ): boolean {
    // 0. 必要(Needful)属性检测: `wx:for-item` || `wx:for-index` || `wx:key`属性必须在有`wx:for`属性时才允许,没有wx:for前提下这三个属性都会报错)
    if (!isHasWxFor && rawAttrName !== "wx:for") {
      this.diagnosticList.push(
        generateDiagnostic(
          rangeRegexp.getFullAttrRegexp(rawAttrName),
          `${DiagnosticErrorType.missingNeedfulAttr}:wx:for` satisfies MissingNeedfulAttr,
          this.wxmlTextlines,
          this.startLine,
        ),
      );

      return true;
    }

    return false;
  }

  private checkConditionAttrs(
    rawAttrName: ConditionState,
  ): boolean {
    // 0. 缺少先决条件
    if (this.missPrerequisite(rawAttrName, this.preConditionState)) {
      this.diagnosticList.push(
        generateDiagnostic(
          rangeRegexp.getFullAttrRegexp(rawAttrName),
          `${DiagnosticErrorType.missPrerequisite}:wx:if | wx:elif` satisfies MissPrerequisite,
          this.wxmlTextlines,
          this.startLine,
        ),
      );

      return true;
    }

    return false;
  }
  /**
   * 属性的检测,若有错误则返回true,否则返回false
   * 0. 忽略的属性跳过
   * 1. 未知属性诊断
   * 为了避免complexity过高,把属性分为两类分开检测
   * 3.wxFor相关属性检测(loopAttrs)
   * 4.wx:if相关属性检测(conditionalAttrs)
   */
  private checkAttr(
    rawAttrName: string,
    isHasWxFor: boolean,
  ): boolean {
    // 0. 忽略的属性跳过
    if (ignoreAttrs.includes(rawAttrName)) {
      // console.log(`${rawAttrName}属性被忽略了`);
      return true;
    }
    // 1. 未知属性诊断
    if (this.isUnknownAttr(rawAttrName)) {
      this.diagnosticList.push(
        generateDiagnostic(
          rangeRegexp.getFullAttrRegexp(rawAttrName),
          `${DiagnosticErrorType.unknownAttr}:${rawAttrName}` satisfies UnknownAttr,
          this.wxmlTextlines,
          this.startLine,
        ),
      );

      return true;
    }
    // 2. wxFor相关属性检测
    if (this.isLoopAttrs(rawAttrName)) {
      return this.checkLoopAttrs(rawAttrName, isHasWxFor);
    }
    // 3. wx:if相关属性检测
    if (this.isConditionalAttr(rawAttrName)) {
      this.currentConditionState = rawAttrName;

      return this.checkConditionAttrs(rawAttrName);
    }

    throw Error("不应该有其他属性了");
  }
  /**
   * 检测可分为两个步骤(为了避免所有的检测逻辑写在一起,造成函数复杂度`complexity`过高),遍历标签元素的每个属性,先对属性进行检测,有错误加入错误列表并跳到下一个检测循环,无错误则对属性值进行检测,最终返回diagnosticList和blockTagInfoList。
   * 但block标签存在属性互斥的问题(某些属性不可以同时存在),所以在执行上述检测(遍历每个属性检测)流程前,先检测(排除)互斥属性,再把剩余的属性按上述流程检测。
   */
  public start(): BlockTagInfo {
    const rawAttribs = this.element.attribs;
    const allRawAttrNames = Object.keys(rawAttribs);
    // 0. 互斥的属性检测 (wx:if 、 wx:elif 、 wx:else 三个条件属性是互斥的,不能同时存在,除了第一个属性外,其他属性报错,返回报错的属性,没有互斥属性则返回空数组)
    const mutuallyExclusiveAttrs = this.checkMutuallyExclusiveAttrs(allRawAttrNames);
    const remainingRawAttrNames = allRawAttrNames.filter((attrName) => !mutuallyExclusiveAttrs.includes(attrName));
    const isHasWxFor = allRawAttrNames.includes("wx:for");

    // 1. 剩余属性的检测(去除互斥属性后的属性)。
    for (const rawAttrName of remainingRawAttrNames) {
      const rawAttrValue = rawAttribs[rawAttrName];
      const res = this.checkAttr(rawAttrName, isHasWxFor);
      if (res) continue;
      this.checkValue(rawAttrName, rawAttrValue);
    }

    return this.currentConditionState
      ? { conditionState: this.currentConditionState, diagnosticList: this.diagnosticList }
      : { wxForInfo: this.wxForInfo, diagnosticList: this.diagnosticList };
  }
}
