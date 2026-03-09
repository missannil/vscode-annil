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
const subA5 = CustomComponent<XxxRoot, $SubA, "5">()({
  data: {
    subA5_cid: "subA5",
  },
});
export type XxxRoot = typeof rootComponent;
const rootComponent = RootComponent()({
  properties: {
    cid: {
      type: String,
      value: "xxx",
    }
  },
  data: {
    bool: true,
    list: [1, 2, 3, 4, 5],
    content: 'xxx',
    dynamicClass: 'dynamic-class',
    dynamicStyle: "color: red;",
  },
  customEvents: {},
  events: {
    onTap() { },
    onNormalTap() { },
    onLoopTap() { },
    onConditionTap() { },
    onConditionLoopTap() { },
  }
});
const xxx = DefineComponent({
  name: "xxx",
  rootComponent,
  subComponents: [subA1, subA2, subA3, subA4, subA5],
});
export type $Xxx = {
  properties: {
    xxx_cid?: string;
  };
  customEvents: {
    xxx_eventA: string | BubblesComposed;
  };
}
typeEqual<$Xxx, typeof xxx>();
