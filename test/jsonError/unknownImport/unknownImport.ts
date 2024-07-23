import { DefineComponent, RootComponent, SubComponent } from "annil";
// 故意 二种引入类型的方式
import type { CreateComponentDoc } from "annil/src/types/CreateComponentDoc";
import type { $SubB } from "~/ddd/subB";
import { type $SubA } from "~/subA";
import { type $SubC } from "../../mockComponents/subC";
import type { $SubD } from "../../mockComponents/subD";
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
const rootComponent = RootComponent()({});
DefineComponent({
  name: "missing",
  rootComponent,
  subComponents: [subA, subB, subC, subD, subDXx, subE],
});
