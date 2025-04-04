import { SubComponent } from "annil";
import type { Root } from "./demoComp";

// @ts-ignore
export const chunk3 = SubComponent<Root, "chunk3">()({
  data: {
    // @ts-ignore
    chunk3_src: "string",
  },
});
