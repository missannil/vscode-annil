import { CustomComponent } from "annil";
import type { $SubA } from "~/subA";
import type { Root } from "./demoComp";

export const subA = CustomComponent<Root, $SubA>()({
  inherit: {
    subA__id: ["aaa", "bbb"],
    subA_numA: "wxml",
  },
  data: {
    subA_userList: [],
  },
});
