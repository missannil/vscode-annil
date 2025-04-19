/* eslint-disable @typescript-eslint/no-unused-vars */
import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubA } from "../../../../miniprogram/components/subA";

const subA = CustomComponent<Root, $SubA>()({
  data: {},
});

// const subB = CustomComponent<Root, $SubB>()({
//   data: {},
// });

type Root = typeof rootComponent;
const rootComponent = RootComponent()({});
DefineComponent({
  // @ts-ignore
  subComponents: [subA],
});
