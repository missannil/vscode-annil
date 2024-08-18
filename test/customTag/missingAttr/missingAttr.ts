// @ts-nocheck
import { SubComponent } from "annil";

import type { $SubA } from "../../mockComponents/subA";

const subA = SubComponent<Root, $SubA>()({
  inherit: {
    subA_custom: "wxml",
    subA__rootData: "rootData",
  },
  data: {
    subA_self: "Self",
  },
  events: {
    subA_eventA(e) {},
  },
});
