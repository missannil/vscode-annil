import type { SubComponentInfoRecord } from "../../../_src/core/types/index.js";

/**
 * 与 _test/miniprogram/pages/index/index.ts 中 DefineComponent({ subComponents }) 引用的 SubComponent 一一对应
 *
 * 注意：
 * - chunkComp 虽然声明了，但未在 subComponents 数组中引用 → traverseAst 不会收集
 * - subInline 为内部定义且被 subComponents 引用的完整 SubComponent
 * - subExternal 定义在 useSubExternal.ts 外部文件中，traverseAst 不跨文件解析，因此不在此预期中
 *
 * fsPath 和 line 由测试运行时动态拼接。
 */
export function expectedSubComponentInfoRecord(fsPath: string): SubComponentInfoRecord {
  return {
    subInline: {
      line: 24,
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
      dataList: ["subInline_cid", "subInline_userList", "subInline_isReady"],
      events: ["subInline_onTap", "subInline_eventA_catch"],
    },
  };
}
