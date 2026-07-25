import type { ChunkComponentInfoRecord } from "../../../_src/core/types/index.js";

/** 与 pages/index/index.ts 中定义的 ChunkComponent 一一对应。 */
export function expectedChunkComponentInfoRecord(fsPath: string): ChunkComponentInfoRecord {
  return {
    chunkInline: {
      line: 88,
      fsPath,
      arrTypeDatas: ["chunkInline_list"],
      boolTypeDatas: ["chunkInline_visible", "chunkInline_isReady"],
      dataList: ["chunkInline_list", "chunkInline_visible", "chunkInline_isReady"],
      events: ["chunkInline_onTap"],
    },
  };
}
