import type { SubComponentInfoRecord } from "../../../_src/core/types/index.js";

/**
 * 与 _test/miniprogram/pages/index/index.ts 中 DefineComponent({ subComponents }) 引用的 SubComponent 一一对应
 *
 * - chunkComp：内部定义且被 subComponents 引用的 SubComponent（inherit + events）
 * - subInline：内部定义且被 subComponents 引用的完整 SubComponent（inherit + data + store + computed + events）
 * - subExternal 定义在 useSubExternal.ts 外部文件中，traverseAst 不跨文件解析，因此不在此预期中
 *
 * fsPath 和 line 由测试运行时动态拼接。
 */
export function expectedSubComponentInfoRecord(fsPath: string): SubComponentInfoRecord {
  return {
    chunkComp: {
      line: 19,
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
      line: 40,
      fsPath,
      componentTypeName: "$SubInline",
      configInfo: {
        subInline_str: { type: "Root", value: "propRequiredOther" },
        subInline_cid: { type: "Self", value: "subInline_cid" },
        subInline_userList: { type: "Self", value: "subInline_userList" },
        subInline_isReady: { type: "Self", value: "subInline_isReady" },
        "bind:onTap": { type: "Events", value: "subInline_onTap" },
        "catch:eventA": { type: "Events", value: "subInline_eventA_catch" },
      },
      arrTypeDatas: ["subInline_userList"],
      boolTypeDatas: [],
      events: ["subInline_onTap", "subInline_eventA_catch"],
    },
  };
}
