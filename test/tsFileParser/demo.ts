import { DefineComponent, type DetailedType, RootComponent, SubComponent } from "annil";
import type { CreateComponentDoc } from "annil/src/types/CreateComponentDoc";
import { type $SubA } from "../mockComponents/subA";
import type { $SubB } from "../mockComponents/subB";
import { type $SubC } from "../mockComponents/subC";
import type { $SubD } from "../mockComponents/subD";

type UserA = {
  name: string;
  age: number;
};
const subA = SubComponent<Root, $SubA>()({
  data: {
    subA__id: "id",
    subA_numA: 123,
    subA_userList: [],
  },
});

const subB = SubComponent<Root, $SubB>()({
  data: {
    subB_num: 123,
  },
});
const subC = SubComponent<Root, $SubC>()({
  data: {
    subC_bool: true,
  },
});
const subD = SubComponent<Root, $SubD>()({
  data: {
    subD_str: "string",
  },
});
const subDXx = SubComponent<Root, $SubD, "xx">()({
  data: {
    subDXx_str: "string",
  },
});

// 定义私有的子组件类型
type $SubE = CreateComponentDoc<"subE", {
  properties: {
    num: number;
  };
}>;
const subE = SubComponent<Root, $SubE>()({
  data: {
    subE_num: 123,
  },
});
type Root = typeof rootComponent;
const rootComponent = RootComponent()({
  properties: {
    anyList: Array,
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
  },
  store: {
    storeList: (): UserA[] => [],
    numberStore: (): number => 123,
  },
  data: {
    aaa: 567,
    dataList: [],
    dataTsList: [] as UserA[],
  },
  events: {
    onTap() {
      console.log("onTap");
    },
  },
});
DefineComponent({
  name: "missing",
  rootComponent,
  subComponents: [subA, subB, subC, subD, subDXx, subE],
});
