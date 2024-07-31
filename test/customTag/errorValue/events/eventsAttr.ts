import { SubComponent } from "annil";
import type { $SubA } from "~/subA";

// eslint-disable-next-line @typescript-eslint/ban-types
const subA = SubComponent<{}, $SubA>()({
  events: {
    subA_eventA() {},
    subA_eventA_catch() {},
  },
});
