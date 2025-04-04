/* eslint-disable @typescript-eslint/no-unused-vars */
import { RootComponent, SubComponent } from "annil";
import type { $SubA } from "../../../mockComponents/subA";
import type { $SubB } from "../../../mockComponents/subB";

// const subA = SubComponent<Root, $SubA>()({
//   data: {},
// });

// const subB = SubComponent<Root, $SubB>()({
//   data: {},
// });

type Root = typeof rootComponent;
const rootComponent = RootComponent()({});
