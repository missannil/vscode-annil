import type { Element } from "domhandler";
import * as vscode from "vscode";
import {
  type AttrConfig,
  type AttrValue,
  CUSTOM,
  type Custom,
  isCustomValue,
  isEventsValue,
  isRootValue,
  isSelfValue,
} from "../../../componentManager/tsFileManager";
import {
  DiagnosticErrorType,
  type ErrorValue,
  type MustacheSyntax,
  type UnknownAttr,
  type WithoutValue,
} from "../../../diagnosticFixProvider/errorType";

// import type { DuplicateAttrsTest } from "../../../../test/customTag/duplicate/duplicate.test";
import { getDuplicate } from "../../../utils/getDuplicate";
import { getMustacheValue } from "../../../utils/getMustacheValue";
import { hyphenToCamelCase } from "../../../utils/hyphenToCamelCase";
import { ignoreAttrs } from "../../../utils/ignoreAttrs";
import { isMustacheStr, isValidSyntax } from "../../../utils/isMustacheStr";
import { isWithoutValue } from "../../../utils/isWithoutValue";
import { generateDiagnostic } from "../../generateDiagnostic";
import { rangeRegexp } from "../../rangeRegexp";
import type { WxForInfo } from "../checknativeTag/checkBlockTag";



export class CustomTagChecker {
  private diagnosticList: vscode.Diagnostic[] = [];
  public constructor(
    private readonly element: Element,
    private readonly startLine: number,
    private readonly wxmlTextlines: string[],
    private readonly wxForInfo: WxForInfo[],
    private readonly attributeConfig: AttrConfig,
  ) {
  }
  private getFixValue(configAttrValue: AttrValue): string {
    const expectAttrValue = configAttrValue.value;

    return isEventsValue(configAttrValue)
      ? expectAttrValue
      : isCustomValue(configAttrValue)
      ? `{{${CUSTOM}}}`
      : `{{${expectAttrValue}}}`;
  }
  private checkEventsValue(
    rawAttrName: string,
    rawAttrValue: string,
    configAttrValue: AttrValue,
    textlines: string[],
    startLine: number,
  ): void {
    const correct = configAttrValue.value;
    if (rawAttrValue !== configAttrValue.value) {
      this.diagnosticList.push(
        generateDiagnostic(
          rangeRegexp.getFullValueRegexp(rawAttrName, rawAttrValue),
          `${DiagnosticErrorType.errorValue}:${rawAttrName}` satisfies ErrorValue,
          textlines,
          startLine,
          `${correct}`,
        ),
      );
    }
  }
  // /**
  //  * 获取表达式中所有的变量值,判断是否包含wxfor中的变量,其他变量是否是root或self中的值
  //  *  mustache的值语法是否正确。值有可能为变量,比较表达式,运算表达式?,三元表达式,混合表达式
  //  *  验证每个变量值是否正确 比如 a > 1, a + b, a ? b : c, a + b ? c : d, a + b ? c : d + e
  //  *  值中必须含有wxFor中的变量,否则报错
  //  */
  // private checkMustacheExpression(mustacheValue: string, rawAttrName: string, textlines: string[], startLine: number): void {
  //   // 获取所有的值 如果有错误,则报错
  // }
  /**
   *  1. 值为{{自定义}}的诊断,报错,无修复。
   *  2. 语法诊断 全值报错,修复为{{自定义}}
   *  3. mustache值的诊断
   */
  private checkCustomValue(
    rawAttrName: string,
    rawAttrValue: string,
    configAttrValue: Custom,
    textlines: string[],
    startLine: number,
  ): void {
    // 1. 值为{{自定义}}的诊断,报错,无修复。
    if (isMustacheStr(rawAttrValue) && getMustacheValue(rawAttrValue) === CUSTOM) {
      this.diagnosticList.push(
        generateDiagnostic(
          rangeRegexp.getMustacheValueRegexp(rawAttrName, CUSTOM),
          `${DiagnosticErrorType.errorValue}:${rawAttrName}` satisfies ErrorValue,
          textlines,
          startLine,
        ),
      );
    }
    // 2. 语法诊断(必须有插值表达式,不存在非插值意外的`{` 或 `}` ) 全值报错,修复为{{自定义}}
    if (!isValidSyntax(rawAttrValue)) {
      this.diagnosticList.push(
        this.generateMustacheSyntaxDiagnostic(rawAttrName, rawAttrValue, textlines, startLine, CUSTOM),
      );

      return;
    }
    // 3. mustache值的诊断
    // const mustacheValueList = getMustacheValueList(rawAttrValue);
    // for (const mustacheValue of mustacheValueList) {
    //   this.checkMustacheExpression(mustacheValue, rawAttrName, textlines, startLine);
    // }
  }
  private generateMustacheSyntaxDiagnostic(
    rawAttrName: string,
    rawAttrValue: string,
    textlines: string[],
    startLine: number,
    fixCode: string,
  ): vscode.Diagnostic {
    return generateDiagnostic(
      rangeRegexp.getFullValueRegexp(rawAttrName, rawAttrValue),
      `${DiagnosticErrorType.mustacheSyntax}:${rawAttrName}` satisfies MustacheSyntax,
      textlines,
      startLine,
      `{{${fixCode}}}`,
    );
  }
  private checkRootOrSelfValue(
    rawAttrName: string,
    rawAttrValue: string,
    configAttrValue: AttrValue,
    textlines: string[],
    startLine: number,
  ): void {
    const expectAttrValue = configAttrValue.value;
    if (!isMustacheStr(rawAttrValue)) {
      this.diagnosticList.push(
        this.generateMustacheSyntaxDiagnostic(rawAttrName, rawAttrValue, textlines, startLine, expectAttrValue),
      );

      return;
    }
    const mustacheValue = getMustacheValue(rawAttrValue);
    if (mustacheValue !== expectAttrValue) {
      this.diagnosticList.push(
        generateDiagnostic(
          rangeRegexp.getMustacheValueRegexp(rawAttrName, mustacheValue),
          `${DiagnosticErrorType.errorValue}:${rawAttrName}` satisfies ErrorValue,
          textlines,
          startLine,
          `${expectAttrValue}`,
        ),
      );
    }
  }
  private checkErrorValue(
    rawAttrName: string,
    rawAttrValue: string,
    configAttrValue: AttrValue,
    textlines: string[],
    startLine: number,
  ): void {
    if (isEventsValue(configAttrValue)) {
      return this.checkEventsValue(rawAttrName, rawAttrValue, configAttrValue, textlines, startLine);
    }
    if (isRootValue(configAttrValue) || isSelfValue(configAttrValue)) {
      return this.checkRootOrSelfValue(rawAttrName, rawAttrValue, configAttrValue, textlines, startLine);
    }
    if (isCustomValue(configAttrValue)) {
      return this.checkCustomValue(rawAttrName, rawAttrValue, configAttrValue, textlines, startLine);
    }

    throw Error("不应该报错 checkErrorValue");
  }
  private checkDuplicateAttrs(elementAttrNames: string[]): string[] {
    const duplicateAttrs = getDuplicate(elementAttrNames);
    duplicateAttrs.forEach((attrName) => {
      this.diagnosticList.push(
        generateDiagnostic(
          rangeRegexp.getFullAttrRegexp(attrName),
          `${DiagnosticErrorType.duplicate}:${attrName}`,
          this.wxmlTextlines,
          this.startLine,
        ),
      );
    });

    return duplicateAttrs;
  }
  private checkMissingAttr(attrConfig: AttrConfig, currentAttrNames: string[]): void {
    const expectedAttrNameList = Object.keys(attrConfig);
    const missingAttr = expectedAttrNameList.filter(
      (attrName) => !currentAttrNames.includes(attrName),
    );
    missingAttr.forEach((attrName) => {
      const fixValue = this.getFixValue(attrConfig[attrName]);
      this.diagnosticList.push(
        generateDiagnostic(
          rangeRegexp.getTagNameRegexp(this.element.name),
          `${DiagnosticErrorType.missingAttr}:${attrName}`,
          this.wxmlTextlines,
          this.startLine,
          `${attrName}="${fixValue}"`,
        ),
      );
    });
  }
  /**
   * 属性检测
   * 0. 重复属性(连字符与驼峰属性)的诊断 {@link DuplicateAttrsTest}
   * 1. 忽略属性名跳过
   * 2. 未知属性名的诊断
   * 3. 缺少属性的诊断
   * 4. 错误属性值的诊断
   */
  public start(): vscode.Diagnostic[] {
    // console.log("检测自定义标签", this.element.name);
    const eleAttribs = this.element.attribs;
    const rawAttrNames = Object.keys(eleAttribs);
    // 0. 重复属性(连字符与驼峰属性)的诊断
    const duplicatedAttr = this.checkDuplicateAttrs(rawAttrNames);
    const remainingAttrNames = rawAttrNames.filter((attrName) => !duplicatedAttr.includes(attrName));
    const expectedAttrNameList = Object.keys(this.attributeConfig);
    // 1. 缺少属性的诊断
    this.checkMissingAttr(this.attributeConfig, hyphenToCamelCase(remainingAttrNames));
    for (const rawAttrName of remainingAttrNames) {
      const rawAttrValue = eleAttribs[rawAttrName];
      // 1. 忽略属性名跳过
      if (ignoreAttrs.includes(rawAttrName)) {
        // console.log(`${rawAttrName}属性被忽略了`);
        continue;
      }
      const expectAttrName = hyphenToCamelCase(rawAttrName);
      // 2. 未知属性名的诊断
      if (!expectedAttrNameList.includes(expectAttrName)) {
        // console.log('未知属性', rawAttrName);
        this.diagnosticList.push(
          generateDiagnostic(
            rangeRegexp.getFullAttrRegexp(rawAttrName),
            `${DiagnosticErrorType.unknownAttr}:${rawAttrName}` satisfies UnknownAttr,
            this.wxmlTextlines,
            this.startLine,
          ),
        );
        continue;
      }
      // 3.空值检测
      if (isWithoutValue(rawAttrName, rawAttrValue, this.wxmlTextlines, this.startLine)) {
        const fixValue = this.getFixValue(this.attributeConfig[expectAttrName]);
        this.diagnosticList.push(
          generateDiagnostic(
            rangeRegexp.getFullAttrRegexp(rawAttrName),
            `${DiagnosticErrorType.withoutValue}:${rawAttrName}` satisfies WithoutValue,
            this.wxmlTextlines,
            this.startLine,
            `${rawAttrName}="${fixValue}"`,
          ),
        );

        continue;
      }
      // 4. 错误属性值的诊断
      this.checkErrorValue(
        rawAttrName,
        rawAttrValue,
        this.attributeConfig[expectAttrName],
        this.wxmlTextlines,
        this.startLine,
      );
    }

    return this.diagnosticList;
  }
}
