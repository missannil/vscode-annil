import {
  ChunkComponent,
  type CreateComponentDoc,
  CustomComponent,
  DefineComponent,
  RootComponent,
  typeEqual,
} from "annil";
import type { $SubInline } from "~/subInline/index.js";
import { subExternal } from "./useSubExternal.js";

type $ChunkA = CreateComponentDoc<"chunkA", {
  properties: {
    customProp: string;
    ternary: unknown[];
    propOptionalList?: unknown[];
    propOptionalBool?: boolean;
    propRequiredList: unknown[];
    propRequiredBool: boolean;
  };
  events: {
    eventsOnTap: string;
  };
}>;
const chunkComp = CustomComponent<Root, $ChunkA>()({
  inherit: {
    chunkA_customProp: "wxml",
    chunkA_ternary: ["propRequiredList", "propOptionalList"],
    chunkA_propRequiredList: "propRequiredList",
    chunkA_propOptionalList: "propOptionalList",
    chunkA_propRequiredBool: "propRequiredBool",
    chunkA_propOptionalBool: "propOptionalBool",
  },
  events: {
    chunkA_eventsOnTap() {
      // ...
    },
  },
});
/**
 * 收集说明：
 * 1 数组类型是为了wxml中block for中数据类型的验证
 * 2 布尔类型是为了wxml中block if中数据类型的验证
 * 3 events是为了wxml中bind:xxx和catch:xxx中事件数据的验证
 */
const subInline = CustomComponent<Root, $SubInline>()({
  inherit: {
    // 1 & 2
    subInline_inheritBool: "propRequiredBool",
    subInline_inheritList: "propRequiredList",
  },
  data: {
    subInline_cid: "subInline",
    // 1
    subInline_dataList: [],
    //  2
    subInline_dataBool: true,
  },
  store: {
    // 1
    subInline_storeList: (): unknown[] => [],
    // 2
    subInline_storeBool: (): boolean => true,
  },
  computed: {
    subInline_isReady() {
      return true;
    },
    // 1
    subInline_computedList(): unknown[] {
      return [];
    },
    // 2
    subInline_computedBool(): boolean {
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

const chunkInline = ChunkComponent<Root, "chunkInline">()({
  data: {
    chunkInline_list: [],
    chunkInline_visible: true,
  },
  computed: {
    chunkInline_isReady(): boolean {
      return true;
    },
  },
  events: {
    chunkInline_onTap() {
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

const appBootstrap = { isReady: true };

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
    storeBool: () => true,
    // 2 & 4: 返回类型注解来自非字面量表达式
    storeFromApp: (): boolean => appBootstrap.isReady,
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
  subComponents: [subInline, subExternal, chunkComp, chunkInline],
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
