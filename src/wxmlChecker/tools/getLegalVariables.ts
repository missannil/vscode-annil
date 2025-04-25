import type { CheckContext } from "../CheckContext";

export function getLegalVariables(checkContext: CheckContext): string[] {
  const { tsFileInfo, wxForInfos } = checkContext;

  return tsFileInfo.rootComponentInfo.dataList.concat(
    wxForInfos.itemNames,
    wxForInfos.indexNames,
    checkContext.getOuterChunkTagVariables(),
  );
  // if (outerChunkTagMasks.length > 0) {
  //   return checkContext.getOuterChunkTagVariables().concat(
  //     wxForInfos.itemNames,
  //     wxForInfos.indexNames,
  //   );
  // } else {
  //   return tsFileInfo.rootComponentInfo.dataList.concat(
  //     wxForInfos.itemNames,
  //     wxForInfos.indexNames,
  //   );
  // }
}
