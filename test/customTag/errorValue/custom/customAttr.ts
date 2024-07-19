import { RootComponent, SubComponent } from "annil";
import type { $SubA, User } from "../../../mockComponents/subA";

const subA = SubComponent<Root, $SubA>()({
  inherit: {
    subA_numA: "wxml",
  },
});
const subAXx = SubComponent<Root, $SubA, "xx">()({
  inherit: {
    subAXx_numA: "wxml",
  },
});
const subAYy = SubComponent<Root, $SubA, "yy">()({
  inherit: {
    subAYy_numA: "wxml",
  },
});
type Root = typeof rootComponent;
const rootComponent = RootComponent()({
  data: {
    num: 123,
    strList: [] as string[],
  },
  store: {
    userList: (): User[] => [],
  },
});
