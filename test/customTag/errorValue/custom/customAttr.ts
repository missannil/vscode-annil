import { RootComponent, SubComponent } from "annil";

import type { SubA, User } from "../../subA";
import { WXML } from "../../../../out/componentManager/tsFileManager";

const subA = SubComponent<Root, SubA>()({
  inherit: {
    subA__id: WXML,
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
