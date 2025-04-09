import { ChunkComponent, DefineComponent, RootComponent } from "annil";

const chunk = ChunkComponent<Root>()({
  data: {
    num: 1,
  },
});
const chunk1 = ChunkComponent<Root, "chunk1">()({
  data: {
    chunk1_num: 1,
  },
  events: {
    chunk1_tap() {
      void 0;
    },
  },
});
type Root = typeof rootComponent;
const rootComponent = RootComponent()({
  properties: {
    list: Array,
  },
  data: {
    bool: true,
    str: "string",
    obj: {},
  },
  events: {
    root_jjj() {},
  },
  customEvents: {
    root_customEvents: String,
  },
});

DefineComponent({
  name: "test",
  subComponents: [chunk, chunk1],
});
