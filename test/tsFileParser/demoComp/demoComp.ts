import { CreateComponentType, DefineComponent, type DetailedType, RootComponent, SubComponent } from "annil";

import type { $SubB } from "~/subB";
import { chunk3 } from "./chunk3";
import { subA } from "./subA";
type UserA = {
  name: string;
  age: number;
};

const subB = SubComponent<Root, $SubB>()({
  data: {
    subB_num: 123,
  },
});
// @ts-ignore
const chunk2 = SubComponent<Root, "chunk2">()({
  data: {
    // @ts-ignore
    chunk2_bool: true,
  },
});

// @ts-ignore
const chunk1 = SubComponent<Root>()({
  data: {
    ddd_src: "string",
    ddd_arr: [1, 2, 3],
    _xxx: 123,
  },
  events: {
    // @ts-ignore
    ddd_aaa: String,
  },
});
// 定义私有的子组件类型
type $SubE = CreateComponentType<"subE", {
  properties: {
    num: number;
  };
}>;
const subE = SubComponent<Root, $SubE>()({
  data: {
    subE_num: 123,
  },
});

export type Root = typeof rootComponent;
const rootComponent = RootComponent()({
  properties: {
    anyList: Array,
    propBool: Boolean,
    propBoolObj: {
      type: Boolean,
      value: true,
    },
    userListSingle: Array as DetailedType<UserA[]>,
    anyListFull: {
      type: Array,
      value: [],
    },
    userListFull: {
      type: Array as DetailedType<UserA[]>,
      value: [],
    },
  },
  computed: {
    userListComputed(): UserA[] {
      return this.data.userListFull;
    },
    computedBool(): boolean {
      return true;
    },
  },
  store: {
    storeList: (): UserA[] => [],
    numberStore: (): number => 123,
    storeBool: (): boolean => true,
  },
  data: {
    aaa: "aaa",
    bbb: "bbb",
    dataList: [],
    dataTsList: [] as UserA[],
    dataBool: true,
  },
  events: {
    onTap() {
      console.log("onTap");
    },
  },
  customEvents: {
    onCustomTap: String,
  },
});
DefineComponent({
  name: "missing",
  rootComponent,
  subComponents: [subA, subB, chunk1, chunk2, chunk3, subE],
});
