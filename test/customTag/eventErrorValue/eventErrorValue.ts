/* eslint-disable @typescript-eslint/no-unused-vars */

import { SubComponent } from "annil/src/api/SubComponent";
import type { $SubA } from "../../mockComponents/subA";
import type { $SubB } from "../../mockComponents/subB";
import type { $SubC } from "../../mockComponents/subC";

const subA = SubComponent<Root, $SubA>()({
  events: {
    // @ts-expect-error
    subA_aaa() {},
  },
});

const subB = SubComponent<Root, $SubB>()({
  events: {
    // @ts-expect-error
    subB_bbb() {},
  },
});
const subC = SubComponent<Root, $SubC>()({
  events: {
    // @ts-expect-error
    subC_ccc() {},
  },
});

type Root = {};
