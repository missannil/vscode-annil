import { DefineComponent, type DetailedType, RootComponent, SubComponent } from "annil";
import type { CreateComponentDoc } from "annil/src/types/CreateComponentDoc";
import type { $SubB } from "~/ddd/subB";
import { type $SubA } from "~/subA";
import { type $Image } from "../mockComponents/image";
import type { $SubC } from "../mockComponents/subC";

type UserA = {
  name: string;
  age: number;
};
const subA = SubComponent<Root, $SubA>()({
  inherit: {
    subA__id: ["aaa", "bbb"],
    subA_numA: "wxml",
  },
  data: {
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
const h_image = SubComponent<Root, $Image>()({
  data: {
    image_str: "string",
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
    aaa: "aaa",
    bbb: "bbb",
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
  subComponents: [subA, subB, subC, h_image, subE],
});
