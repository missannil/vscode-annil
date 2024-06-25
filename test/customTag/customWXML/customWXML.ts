import { SubComponent } from "annil";
import { WXML } from "../../../out/componentManager/tsFileManager";
import type { SubA } from "../subA";

const subA = SubComponent<{}, SubA>()({
  inherit: {
    subA__id: WXML,
  },
  data: {
    subA_numA: 1,
  },
  store: {
    subA_userList: () => [],
  },
  events: {
    subA_eventA() {},
  },
});
