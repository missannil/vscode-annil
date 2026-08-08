import { CustomComponent } from "annil";
import type { $SubExternal } from "~/subExternal/subExternal.js";
import type { Root } from "./externalImports.js";

export const external = CustomComponent<Root, $SubExternal>()({
  data: {
    subExternal_str: "",
  },
});
