import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubA } from "~/subA";

const subA = CustomComponent<Root, $SubA>()({
  data: {
    subA__id: "id",
    subA_numA: 123,
    subA_userList: [],
  },
  events: {
    subA_onTap(e) {
      e;
    },
  },
});
type Root = typeof rootComponent;

const rootComponent = RootComponent()({
  data: {
    arr: [1, 2, 3] as number[],
    bool: true,
    str: "string",
    num: 123,
  },
});
DefineComponent({
  name: "test",
  subComponents: [subA],
});
