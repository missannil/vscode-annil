import { CustomComponent, DefineComponent } from "annil";
import type { Root } from "tsFileParser/demoComp/demoComp";
import type { $SubA } from "~/subA";
const subA = CustomComponent<Root, $SubA>()({
  inherit: {
    subA__id: "wxml",
    subA_numA: "wxml",
  },
  data: {
    subA_userList: [],
    subA_isReady: false, // isReady不作为传递属性，不会被认为是缺失的属性
  },
  events: {
    subA_eventA() {},
  },
});
DefineComponent({
  name: "test",
  subComponents: [subA],
});
