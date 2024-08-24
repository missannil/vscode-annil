// void test(componentUri, "wxml", []);
import { DiagnosticErrorType, type ErrorValue } from "../../../src/diagnosticFixProvider/errorType";
import type { CheckType } from "../../../src/runTest";

// 忽略的属性在没有预期值(ts中未定义)的情况下跳过值检测。有值会检测
export const state: boolean = true;

export const checkType: CheckType = "wxml";

export const expectedDiagnosticList = [
  `${DiagnosticErrorType.errorValue}:twClass` satisfies ErrorValue,
];

export const fiexedDiagnosticList = [];
