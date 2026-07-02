import { DefineComponent, RootComponent, typeEqual } from "annil";

// const sub = SubComponent<Root, CompType>()({})
// type Root = typeof rootComponent;
/**
 * 配置项说明：
 * 1 数组类型是为了wxml中block for中数据类型的验证
 * 2 布尔类型是为了wxml中block if中数据类型的验证
 * 3 events、customEvents是为了wxml中bind:xxx和catch:xxx中事件数据的验证
 */
const rootComponent = RootComponent()({
  properties: {
    // 1
    propRequiredList: Array,
    // 1
    propOptionalList: {
      type: Array,
      value: [],
    },
    // 2
    propRequiredBool: Boolean,
    // 2
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
    // 1
    computedList(): unknown[] {
      return [];
    },
    // 2
    computedBool(): boolean {
      return true;
    },
    computedOther(): string {
      return "otherData";
    },
  },
  store: {
    // 1
    storeList: (): unknown[] => [],
    // 2
    storeBool: (): boolean => true,
    storeOther: (): string => {
      return "otherData";
    },
    viewSingleGoods__singleGoods: () => {
      return {};
    },
  },
  data: {
    // 1
    dataList: [],
    // 2
    dataBool: true,
    dataOther: "otherData",
  },
  events: {
    // 3
    eventsOnTap() {
      // ...
    },
  },
  // customEvents: {
  //   // 3
  //   customEventChange: String,
  //   customEventClick: [String, Number],
  // },
});
const index = DefineComponent({
  name: "index",
  rootComponent,
  subComponents: [],
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
  // events: {
  //   index_customEventChange: string;
  //   index_customEventClick: string | number;
  // };
};
typeEqual<$Index>()(index);
