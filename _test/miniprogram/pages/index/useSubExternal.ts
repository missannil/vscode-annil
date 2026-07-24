import { CustomComponent } from "annil";
import type { $SubExternal } from "~/subExternal/subExternal.js";
import type { Root } from "./index.js";

/**
 * 收集说明：
 * 1 数组类型是为了wxml中block for中数据类型的验证
 * 2 布尔类型是为了wxml中block if中数据类型的验证
 * 3 events是为了wxml中bind:xxx和catch:xxx中事件数据的验证
 */
export const subExternal = CustomComponent<Root, $SubExternal>()({
  inherit: {
    subExternal_str: "propRequiredOther",
  },
  data: {
    subExternal_cid: "subExternal",
  },
  store: {
    subExternal_userList: () => [],
    _subExternal_xxx: () => {},
  },
  computed: {
    subExternal_isReady() {
      return true;
    },
  },
  events: {
    subExternal_onTap() {
      // ...
    },
    subExternal_eventA_catch() {
      // ...
    },
  },
});
