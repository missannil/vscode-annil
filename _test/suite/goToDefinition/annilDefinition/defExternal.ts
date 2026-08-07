import { ChunkComponent } from "annil";
import type { Root } from "./annilDefinition.js";

export const externalChunk = ChunkComponent<Root>()({
  data: { externalChunk_label: "" },
});
