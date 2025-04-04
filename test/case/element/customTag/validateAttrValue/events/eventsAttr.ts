import { DefineComponent, SubComponent } from "annil";
import type { $SubA } from "~/subA";

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-unused-vars
const subA = SubComponent<{}, $SubA>()({
  events: {
    subA_eventA() {},
    subA_eventA_catch() {},
  },
});
DefineComponent({
  name: "test",
  // @ts-ignore
  subComponents: [subA],
});
