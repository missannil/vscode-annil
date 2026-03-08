import { type BubblesComposed, CustomComponent, DefineComponent, RootComponent, typeEqual } from "annil";
import type { $SubA } from "../../../miniprogram/components/subA/index";

// const chunk = ChunkComponent<XxxRoot>()({})
const subA1 = CustomComponent<XxxRoot, $SubA, "1">()({
  data: {
    subA1_cid: "subA1",
  },
});
const subA2 = CustomComponent<XxxRoot, $SubA, "2">()({
  data: {
    subA2_cid: "subA2",
  },
});
const subA3 = CustomComponent<XxxRoot, $SubA, "3">()({
  data: {
    subA3_cid: "subA3",
  },
});
const subA4 = CustomComponent<XxxRoot, $SubA, "4">()({
  data: {
    subA4_cid: "subA4",
  },
});
export type XxxRoot = typeof rootComponent;
const rootComponent = RootComponent()({
  properties: {},
  customEvents: {},
});
const xxx = DefineComponent({
  name: "xxx",
  rootComponent,
  subComponents: [subA1, subA2, subA3, subA4],
});
export type $Xxx = {
  customEvents: {
    xxx_eventA: string | BubblesComposed;
  };
};
typeEqual<$Xxx, typeof xxx>();
