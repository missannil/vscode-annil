import { ChunkComponent, CustomComponent, DefineComponent, RootComponent } from "annil";
import type { $SubInline } from "~/subInline/index.js";

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

const subInline = CustomComponent<Root, $SubInline>()({});

// @ts-expect-error fixture only needs the component declaration for scope validation
DefineComponent({ name: "componentScope", rootComponent, subComponents: [chunkInline, subInline] });
