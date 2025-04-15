import { CustomComponent, DefineComponent, RootComponent } from "annil";
// 故意 二种引入类型的方式
import type { CreateComponentType } from "annil";
import { type $SubA } from "~/subA";
import type { $SubB } from "~/subB";
import { type $SubC } from "../../../mockComponents/subC";
import type { $SubD } from "../../../mockComponents/subD";
const subA = CustomComponent<Root, $SubA>()({
  data: {
    subA__id: "id",
    subA_numA: 123,
    subA_userList: [],
  },
});
const subB = CustomComponent<Root, $SubB>()({
  data: {
    subB_num: 123,
  },
});
const subBA = CustomComponent<Root, $SubB, "a">()({
  data: {
    subBA_num: 123,
  },
});
const subC = CustomComponent<Root, $SubC>()({
  data: {
    subC_bool: true,
  },
});
const subD = CustomComponent<Root, $SubD>()({
  data: {
    subD_str: "string",
  },
});

// 定义私有的子组件类型
type $SubE = CreateComponentType<"subE", {
  properties: {
    num: number;
  };
}>;
const subE = CustomComponent<Root, $SubE>()({
  data: {
    subE_num: 123,
  },
});
type Root = typeof rootComponent;
const rootComponent = RootComponent()({});
DefineComponent({
  name: "missing",
  rootComponent,
  subComponents: [subA, subB, subBA, subC, subD, subE],
});
