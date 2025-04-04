/* eslint-disable @typescript-eslint/no-unused-vars */
import { DefineComponent, RootComponent, SubComponent } from "annil";
import type { $SubA } from "../../../../mockComponents/subA";

const subA = SubComponent<Root, $SubA>()({
  data: {},
});

// const subB = SubComponent<Root, $SubB>()({
//   data: {},
// });

type Root = typeof rootComponent;
const rootComponent = RootComponent()({});
DefineComponent({
  // @ts-ignore
  subComponents: [subA],
});
