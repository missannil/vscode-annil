import { ChunkComponent, DefineComponent, RootComponent } from "annil";

const root = RootComponent()({});

type Root = typeof root;

const chunkInline = ChunkComponent<Root, "chunkInline">()({
  events: {
    chunkInline_onTap() {},
  },
});

DefineComponent({ name: "chunkEvent", rootComponent: root, subComponents: [chunkInline] });
