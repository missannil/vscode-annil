/* eslint-disable @typescript-eslint/no-unused-vars */
import { SubComponent, type Wm } from "annil";
import type { $SubA } from "~/subA";
import type { $SubB } from "~/subB";
import type { $SubC } from "~/subC";

const view = SubComponent<object, Wm.View>()({
  data: {
    view_xxx: 123,
  },
});
