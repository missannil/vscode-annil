/* eslint-disable @typescript-eslint/no-unused-vars */

import { DefineComponent } from "annil";
import type { $SubA } from "../../../mockComponents/subA";

const subA = CustomComponent<Root, $SubA>()({});
const subB = CustomComponent<Root, $SubB>()({});

DefineComponent({
  name: "test",
  // @ts-ignore
  subComponents: [subA, subB],
});
