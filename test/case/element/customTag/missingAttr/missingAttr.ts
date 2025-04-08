import { CustomComponent } from "annil";

import type { $SubA } from "../../mockComponents/subA";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const subA = CustomComponent<Root, $SubA>()({
  inherit: {
    subA_custom: "wxml",
    subA__rootData: "rootData",
  },
  data: {
    subA_self: "Self",
    subA_isReady: false, // isReady不作为传递属性，不会被认为是缺失的属性
  },
  events: {
    subA_eventA() {},
  },
});
DefineComponent({
  subComponents: [subA],
});
