/* eslint-disable @typescript-eslint/no-unused-vars */
import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubC } from "otherComponents/subC";
import type { $SubA } from "~/subA";
import type { $SubB } from "~/subB";

const subA = CustomComponent<object, $SubA>()({
  data: {},
});

const subB = CustomComponent<object, $SubB>()({
  data: {},
});
const subC = CustomComponent<object, $SubC>()({
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
