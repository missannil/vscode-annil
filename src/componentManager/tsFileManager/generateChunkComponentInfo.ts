import { assignWith } from "../../utils/assignWith";
import type { ChunkComponentInfos, ChunkComponentInfoWithoutFsPath } from "./types";

export function generateChunkComponentInfo(
  chunkComponentInfos: Record<string, ChunkComponentInfoWithoutFsPath>,
  fsPath: string,
): ChunkComponentInfos {
  Object.values(chunkComponentInfos).forEach(componentInfo => {
    assignWith(componentInfo, { fsPath });
  });

  return chunkComponentInfos as ChunkComponentInfos;
}
