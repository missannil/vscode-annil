import type { WxForInfos } from "../CheckContext";

export function isValidValueOfPreWxforItem(rawAttrValue: string, wxForInfos: WxForInfos): boolean {
  const allPreValueList = wxForInfos.indexNames.concat(wxForInfos.itemNames);

  // 允许使用存在的item值或以值的起始字符以之前的wx:for-item的值为准，后可接 .或[0]。 例如 上层循环后的wx:for-item值为`item`,则下层循环的wx:for-item值可以为`item`或item.xxx`或`item[0]`等后续
  // 判断rawAttrValue是否符合上述规则
  return allPreValueList.some((preValue) =>
    rawAttrValue === preValue
    || rawAttrValue.startsWith(preValue)
      && (rawAttrValue[preValue.length] === "." || rawAttrValue[preValue.length] === "[")
  );
}
