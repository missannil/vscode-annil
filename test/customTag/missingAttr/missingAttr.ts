// @ts-nocheck
import { SubComponent } from "annil";
import { WXML } from "../../../src/componentManager/tsFileManager";
import type { $SubA } from "../../mockComponents/subA";

const subA = SubComponent<Root, $SubA>()({
  inherit: {
    subA_custom: WXML,
    subA__rootData: "rootData",
  },
  data: {
    subA_self: "Self",
  },
  events: {
    subA_eventA(e) {},
  },
});
