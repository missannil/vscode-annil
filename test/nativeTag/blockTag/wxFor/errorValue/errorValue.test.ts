import { DiagnosticErrorType, type NonArrType } from "../../../../../src/diagnosticFixProvider/errorType";

import type { CheckType } from "../../../../../src/runTest";

export const state: boolean = true;

export const checkType: CheckType = "wxml";

// 对wx:for的检测,值为单一变量的情况判断是否为数组(不是数组则报错),若值为"xxx.ddd"的情况则不做处理
export const expectedDiagnosticList = [
  `${DiagnosticErrorType.nonArrType}` satisfies NonArrType,
  `${DiagnosticErrorType.nonArrType}` satisfies NonArrType,
  `${DiagnosticErrorType.nonArrType}` satisfies NonArrType,
];

export const fiexedDiagnosticList = [
  `${DiagnosticErrorType.nonArrType}` satisfies NonArrType,
  `${DiagnosticErrorType.nonArrType}` satisfies NonArrType,
  `${DiagnosticErrorType.nonArrType}` satisfies NonArrType,
];
