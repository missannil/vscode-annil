import { DefineComponent, RootComponent, SubComponent } from "annil";
// 故意 二种引入类型的方式

import { type $SubC } from "../../mockComponents/subC";
import type { $SubD } from "../../mockComponents/subD";

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

type Root = typeof rootComponent;
const rootComponent = RootComponent()({});
DefineComponent({
  name: "missing",
  rootComponent,
  subComponents: [subC, subD],
});
