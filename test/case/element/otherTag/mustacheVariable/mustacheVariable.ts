import { ChunkComponent, DefineComponent, RootComponent } from "annil";
const chunkA = ChunkComponent<Root, "chunkA">()({
  data: {
    chunkA_num: 123,
    chunkA_str: "str",
  },
});
const chunkB = ChunkComponent<Root, "chunkB">()({
  data: {
    chunkB_num: 123,
    chunkB_str: "str",
  },
});

type Root = typeof rootComponent;
const rootComponent = RootComponent()({
  customEvents: {
    onCustomTap: String,
  },
  data: {
    aaa: "aaa",
    list: [1, 2, 3],
  },
  computed: {
    rootData() {
      return 100;
    },
  },
});

DefineComponent({
  name: "test",
  rootComponent,
  subComponents: [chunkA, chunkB],
});
