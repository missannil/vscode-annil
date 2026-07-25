import type { CustomComponentInfoRecord } from "../../../_src/core/types/index.js";

/**
 * 与 _test/miniprogram/pages/index/index.ts 中 DefineComponent({ subComponents }) 引用的 CustomComponent 一一对应
 *
 * - chunkComp：内部定义且被 subComponents 引用的 CustomComponent（inherit + events）
 * - subInline：内部定义且被 subComponents 引用的完整 CustomComponent（inherit + data + store + computed + events）
 * - subExternal 定义在 useSubExternal.ts 外部文件中，当前 traverseAst 不跨文件解析，因此不在此预期中
 *
 * fsPath 和 line 由测试运行时动态拼接。
 */
export function expectedCustomComponentInfoRecord(fsPath: string): CustomComponentInfoRecord {
  return {
    chunkComp: {
      line: 25,
      fsPath,
      componentTypeName: "$ChunkA",
      configInfo: {
        chunkA_customProp: { type: "Custom", value: "自定义" },
        chunkA_ternary: { type: "Ternary", values: ["propRequiredList", "propOptionalList"] },
        chunkA_propRequiredList: { type: "Root", value: "propRequiredList" },
        chunkA_propOptionalList: { type: "Root", value: "propOptionalList" },
        chunkA_propRequiredBool: { type: "Root", value: "propRequiredBool" },
        chunkA_propOptionalBool: { type: "Root", value: "propOptionalBool" },
        "bind:eventsOnTap": { type: "Events", value: "chunkA_eventsOnTap" },
      },
      arrTypeDatas: [],
      boolTypeDatas: [],
      events: ["chunkA_eventsOnTap"],
    },
    subInline: {
      line: 46,
      fsPath,
      componentTypeName: "$SubInline",
      configInfo: {
        subInline_inheritBool: { type: "Root", value: "propRequiredBool" },
        subInline_inheritList: { type: "Root", value: "propRequiredList" },
        subInline_cid: { type: "Self", value: "subInline_cid" },
        subInline_dataBool: { type: "Self", value: "subInline_dataBool" },
        subInline_dataList: { type: "Self", value: "subInline_dataList" },
        subInline_storeList: { type: "Self", value: "subInline_storeList" },
        subInline_storeBool: { type: "Self", value: "subInline_storeBool" },
        subInline_isReady: { type: "Self", value: "subInline_isReady" },
        subInline_computedList: { type: "Self", value: "subInline_computedList" },
        subInline_computedBool: { type: "Self", value: "subInline_computedBool" },
        "bind:onTap": { type: "Events", value: "subInline_onTap" },
        "catch:eventA": { type: "Events", value: "subInline_eventA_catch" },
      },
      arrTypeDatas: ["subInline_dataList", "subInline_storeList", "subInline_computedList"],
      boolTypeDatas: ["subInline_dataBool", "subInline_storeBool", "subInline_isReady", "subInline_computedBool"],
      events: ["subInline_onTap", "subInline_eventA_catch"],
    },
  };
}
