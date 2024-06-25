// @ts-nocheck
import { SubComponent } from "annil";
import { WXML } from "../../../src/componentManager/tsFileManager";

const subA = SubComponent()({
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
