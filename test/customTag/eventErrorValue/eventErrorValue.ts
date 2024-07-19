/* eslint-disable @typescript-eslint/no-unused-vars */

import { SubComponent } from "annil/src/api/SubComponent";
import type { $SubA } from "../../mockComponents/subA";
import type { $SubB } from "../../mockComponents/subB";
import type { $SubC } from "../../mockComponents/subC";

const subA = SubComponent<Root, $SubA>()({
  events: {
    subA_aaa() {},
  },
});

const subB = SubComponent<Root, $SubB>()({
  events: {
    subB_bbb() {},
  },
});
const subC = SubComponent<Root, $SubC>()({
  events: {
    subC_ccc() {},
  },
});

type Root = {};
