import { ChunkComponent } from "annil";
import type { Root } from "./demoComp";

export const chunk3 = ChunkComponent<Root>()({
  data: {
    chunk3_src: "string",
  },
});
