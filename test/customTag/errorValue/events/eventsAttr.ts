import { SubComponent } from "annil";
import type { $SubA } from "../../subA";

const subA = SubComponent<{}, $SubA>()({
  events: {
    subA_eventA() {},
    subA_eventA_catch() {},
  },
});
