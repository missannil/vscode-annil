/* eslint-disable @typescript-eslint/no-unused-vars */
import { DefineComponent, RootComponent, SubComponent } from "annil";
import type { $SubA } from "~/subA";
import type { $SubB } from "~/subB";
import type { $SubC } from "~/subC";

const subA = SubComponent<object, $SubA>()({
  data: {},
});

const subB = SubComponent<object, $SubB>()({
  data: {},
});
const subC = SubComponent<object, $SubC>()({
  data: {
    // @ts-ignore
    subC_class: "subC",
  },
});
const root = RootComponent()({
  data: {
    list: [],
  },
});
DefineComponent({
  name: "test",
  // @ts-ignore
  subComponents: [subA, subB, subC],
});
