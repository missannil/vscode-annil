/* eslint-disable @typescript-eslint/no-unused-vars */
import { DefineComponent, RootComponent, SubComponent } from "annil";
import type { $SubA } from "../../mockComponents/subA";
import type { $SubB } from "../../mockComponents/subB";
import type { $SubC } from "../../mockComponents/subC";

const subA = SubComponent<Root, $SubA>()({
  data: {},
});

const subB = SubComponent<Root, $SubB>()({
  data: {},
});

const subC = SubComponent<Root, $SubC>()({
  data: {},
});
type Root = typeof rootComponent;
const rootComponent = RootComponent()({});
