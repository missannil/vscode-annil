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

const subInline = CustomComponent<Root, { properties: { subInline_isReady?: boolean } }>()({
  data: {
    subInline_isReady: true,
  },
});

DefineComponent({ name: "illegalIf", rootComponent, subComponents: [chunkInline, subInline] });
