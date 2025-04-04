import * as vscode from "vscode";

import type { DiagnosticMessage } from "../../out/diagnosticFixProvider/errorType";
import { getDiagnosticList } from "./getDiagnosticList";

export function assertStrictEquality(actual: unknown[], expected: unknown[], decs: string = ""): void {
  if (actual.length !== expected.length) {
    throw new Error(`${decs} 长度不一致,当前:${actual.length} ,预期:${expected.length}`);
  }
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== expected[i]) {
      throw new Error(`${decs} 索引 ${i}的值 "${actual[i]}" 不符合预期 "${expected[i]}"`);
    }
  }
}

export async function assertErrorMessages(
  uri: vscode.Uri,
  diagnosticMessageList: DiagnosticMessage[],
  decs: string = "",
): Promise<void> {
  const diagnosticList = await getDiagnosticList(uri);

  return assertStrictEquality(
    diagnosticList.map((diagnostic) => diagnostic.message),
    diagnosticMessageList,
    decs,
  );
}
