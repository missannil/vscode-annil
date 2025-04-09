/* eslint-disable @typescript-eslint/no-unused-vars */

import { CustomComponent, DefineComponent } from "annil";
import type { $SubB } from "~/subB";
import type { $SubA } from "../../../mockComponents/subA";

const subB = CustomComponent<{}, $SubB>()({});

DefineComponent({
  name: "test",
  // subComponents: [subB],
});
