/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck

import { DefineComponent } from "annil";
import type { $SubA } from "../../../mockComponents/subA";

const subA = SubComponent<Root, $SubA>()({});
const subB = SubComponent<Root, $SubB>()({});

DefineComponent({
  name: "test",
  // @ts-ignore
  subComponents: [subA, subB],
});
