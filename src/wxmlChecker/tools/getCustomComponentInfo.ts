import type { CustomComponentInfo, CustomComponentInfos } from "../../componentManager/tsFileManager/types";

// 获取自定义组件的配置信息
export function getCustomComponentInfo(
  markName: string,
  customComponentInfos: CustomComponentInfos,
): CustomComponentInfo | undefined {
  return customComponentInfos[markName];
}
