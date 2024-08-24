/* eslint-disable @typescript-eslint/no-unused-vars */
import { RootComponent, SubComponent } from "annil";
import type { $SubA } from "../../mockComponents/subA";
import type { $SubB } from "../../mockComponents/subB";

const subA = SubComponent<Root, $SubA>()({
  data: {},
});

const subB = SubComponent<Root, $SubB>()({
  data: {
    // @ts-ignore
    subB_twClass: "twClassSubB",
  },
});
// @ts-ignore
const subC = SubComponent<Root, $SubC>()({
  // @ts-ignore
  data: {
    // @ts-ignore
    subC_twClass: "twClassSubC",
  },
});
type Root = typeof rootComponent;
const rootComponent = RootComponent()({});
