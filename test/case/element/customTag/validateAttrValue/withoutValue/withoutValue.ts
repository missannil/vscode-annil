import { CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubA } from "~/subA";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const subA = CustomComponent<Root, $SubA>()({
  data: {
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
  subComponents: [subA],
});
