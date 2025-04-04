import type { CheckContext } from "../CheckContext";

export function getLegalVariables(checkContext: CheckContext): string[] {
  const { tsFileInfo, wxForInfos, outerChunkTagMasks } = checkContext;
  if (outerChunkTagMasks.length > 0) {
    return checkContext.getOuterChunkTagVariables().concat(
      wxForInfos.itemNames,
      wxForInfos.indexNames,
    );
  } else {
    return tsFileInfo.rootComponentInfo.dataList.concat(
      wxForInfos.itemNames,
      wxForInfos.indexNames,
    );
  }
}
