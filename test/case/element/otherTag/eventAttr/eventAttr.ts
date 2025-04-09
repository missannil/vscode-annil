import { ChunkComponent, DefineComponent, RootComponent } from "annil";
const chunk = ChunkComponent<Root, "chunk">()({
  events: {
    chunk_eventA() {
      void 0;
    },
  },
});
type Root = typeof rootComponent;
const rootComponent = RootComponent()({
  customEvents: {
    rootCustomEvent: String,
  },
  events: {
    rootEvent: String,
  },
});

DefineComponent({
  name: "test",
  rootComponent,
  subComponents: [chunk],
});
