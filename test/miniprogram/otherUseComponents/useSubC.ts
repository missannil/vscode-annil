import { CustomComponent } from "annil";
import type { $SubC } from "../otherComponents/subC";

export const subC = CustomComponent<{}, $SubC>()({
  data: {
    subC_bool: true,
  },
});
