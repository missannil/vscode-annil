import { DefineComponent, RootComponent, SubComponent, typeEqual } from "annil";
import type { ComponentDoc } from "annil/dist/api/DefineComponent/returnType/ComponentDoc.js";
import type { $SubInline } from "~/subInline/index.js";
import { subExternal } from "./useSubExternal.js";

type $ChunkA = ComponentDoc<{
  properties: {
    chunkA_propOptionalList?: unknown[];
    chunkA_propOptionalBool?: boolean;
    chunkA_propRequiredList: unknown[];
    chunkA_propRequiredBool: boolean;
  };
  events: {
    chunkA_eventsOnTap: string;
  };
}>;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const chunkComp = SubComponent<Root, $ChunkA>()({});
/**
 * 收集说明：
 * 1 数组类型是为了wxml中block for中数据类型的验证
 * 2 布尔类型是为了wxml中block if中数据类型的验证
 * 3 events是为了wxml中bind:xxx和catch:xxx中事件数据的验证
 */
const subInline = SubComponent<Root, $SubInline>()({
  inherit: {
    subInline_str: "propRequiredOther",
  },
  data: {
    subInline_cid: "subInline",
  },
  store: {
    subInline_userList: (): unknown[] => [],
    _subInline_xxx: () => {},
  },
  computed: {
    subInline_isReady() {
      return true;
    },
  },
  events: {
    subInline_onTap() {
      // ...
    },
    subInline_eventA_catch() {
      // ...
    },
  },
});

export type Root = typeof rootComponent;
/**
 * 收集说明：
 *  RootComponentInfo
 *  1 数组类型的数据名列表(arrTypeDatas: string[])，用于判断 wxml 中 wx:for 循环变量的类型
 *  2 布尔类型的数据名列表( boolTypeDatas: string[]),用于判断 wxml 中 wx:if 条件变量的类型
 *  3 事件名列表(events: string[])，用于判断 wxml 中 bind:xxx 和 catch:xxx 中事件数据的类型
 *  4 所有数据名列表(dataList: string[])，用于判断 wxml 中数据绑定的值是否正确
 */

const rootComponent = RootComponent()({
  properties: {
    // 1 & 4
    propRequiredList: Array,
    // 1 & 4
    propOptionalList: {
      type: Array,
      value: [],
    },
    // 2 & 4
    propRequiredBool: Boolean,
    // 2 & 4
    propOptionalBool: {
      type: Boolean,
      value: true,
    },
    propRequiredOther: String,
    propOptionalOther: {
      type: String,
      value: "otherData",
    },
  },
  computed: {
    // 1 & 4
    computedList(): unknown[] {
      return [];
    },
    // 2 & 4
    computedBool(): boolean {
      return true;
    },
    // 4
    computedOther(): string {
      return "otherData";
    },
  },
  store: {
    // 1 & 4
    storeList: (): unknown[] => [],
    // 2 & 4
    storeBool: (): boolean => true,
    // 4
    storeOther: (): string => {
      return "otherData";
    },
  },
  data: {
    // 1
    dataList: [],
    // 2
    dataBool: true,
    // 4
    dataOther: "otherData",
  },
  events: {
    // 3
    eventsOnTap() {
      // ...
    },
  },
});
const index = DefineComponent({
  name: "index",
  rootComponent,
  subComponents: [subInline, subExternal],
});

export type $Index = {
  properties: {
    index_propOptionalList?: unknown[];
    index_propOptionalBool?: boolean;
    index_propRequiredList: unknown[];
    index_propRequiredBool: boolean;
    index_propRequiredOther: string;
    index_propOptionalOther?: string;
  };
};
typeEqual<$Index>()(index);
