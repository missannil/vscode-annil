import { RootComponent, SubComponent } from "annil";

import { WXML } from "../../../../out/componentManager/tsFileManager";
import type { SubA, User } from "../../subA";

const subA = SubComponent<Root, SubA>()({
  inherit: {
    subA__id: "wxml",
  },
});

type Root = typeof rootComponent;
const rootComponent = RootComponent()({
  data: {
    str: "",
    strList: [] as string[],
  },
  store: {
    userList: (): User[] => [],
  },
});
