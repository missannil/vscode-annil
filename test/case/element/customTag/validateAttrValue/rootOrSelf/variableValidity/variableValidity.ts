/* eslint-disable @typescript-eslint/no-unused-vars */

import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubA } from "~/subA";

const subA = CustomComponent<Root, $SubA>()({
  inherit: {
    subA__id: "id",
  },
  data: {
    subA_numA: 1,
  },
  store: {
    subA_userList: () => [],
  },
});
type Root = typeof rootComponent;
const rootComponent = RootComponent()({
  data: {
    id: "string",
  },
});
DefineComponent({
  name: "test",
  subComponents: [subA],
});
