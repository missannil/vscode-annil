/* eslint-disable @typescript-eslint/no-unused-vars */

import { CustomComponent, DefineComponent } from "annil";
import type { $SubB } from "~/subB";

const subB = CustomComponent<{}, $SubB>()({});

DefineComponent({
  name: "test",
  // subComponents: [subB],
});
