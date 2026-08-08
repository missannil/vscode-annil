import { ChunkComponent, CustomComponent, DefineComponent, RootComponent } from "annil";

const rootComponent = RootComponent()({
  data: {
    rootVisible: true,
  },
});
type Root = typeof rootComponent;

const chunkInline = ChunkComponent<Root, "chunkInline">()({
  data: {
    chunkInline_visible: true,
  },
});

const chunkBlock = ChunkComponent<Root, "chunkBlock">()({
  data: {
    chunkBlock_visible: true,
  },
});

const subInline = CustomComponent<Root, { properties: { subInline_isReady?: boolean } }>()({
  data: {
    subInline_isReady: true,
  },
});

DefineComponent({ name: "componentScope", rootComponent, subComponents: [chunkInline, chunkBlock, subInline] });
