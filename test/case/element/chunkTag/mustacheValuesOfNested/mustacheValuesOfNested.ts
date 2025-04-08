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
});

DefineComponent({
  name: "test",
  // @ts-ignore
  subComponents: [chunk, chunk1],
});
