import { ChunkComponent, DefineComponent, RootComponent } from "annil";

const root = RootComponent()({
  data: {
    rootKnown: "hello",
  },
});

type Root = typeof root;

const chunkInline = ChunkComponent<Root, "chunkInline">()({
  data: {
    chunkInline_visible: true,
  },
  events: {
    chunkInline_onTap() {},
  },
});

DefineComponent({ name: "chunkData", rootComponent: root, subComponents: [chunkInline] });
