import type { ChildNode } from "domhandler";

import { DiagnosticErrorType } from "../diagnosticFixProvider/errorType";
import type { CheckContext } from "./CheckContext";
import { checkNodeList } from "./checkNodeList";
import type { WxForVariables } from "./checkNodeList/checkElementNode/checkNativeTag/checkBlockTag/checkWxForBlock";
import { checkPendingConditionValue } from "./checkNodeList/checkPendingConditionValue";

export function checkChildNodes(
  children: ChildNode[],
  checkContext: CheckContext,
  wxForVariables?: WxForVariables,
): void {
  if (children.length > 0) {
    wxForVariables && checkContext.addWxForInfos(wxForVariables);
    checkNodeList(children, checkContext);
    wxForVariables && checkContext.popWxForInfos();
  } else {
    const { tsFileInfo, wxForInfos } = checkContext;
    checkPendingConditionValue(
      tsFileInfo.rootComponentInfo.dataList.concat(wxForInfos.itemNames).concat(wxForInfos.indexNames).concat([
        "true",
        "false",
      ]),
      DiagnosticErrorType.nonRootComponentDataOrWxforVariable,
      checkContext,
    );
  }
}
