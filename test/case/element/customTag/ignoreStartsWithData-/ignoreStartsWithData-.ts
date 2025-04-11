import { CustomComponent, DefineComponent } from "annil";
import type { $SubA } from "~/subA";

const subA = CustomComponent<{ data: { rootData: string } }, $SubA>()({
  inherit: {
    subA__id: "rootData",
  },
  data: {
    subA_numA: 123,
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
