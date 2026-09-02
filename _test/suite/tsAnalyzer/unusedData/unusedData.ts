import { ChunkComponent, type CreateComponentDoc, CustomComponent, DefineComponent, RootComponent } from "annil";

const root = RootComponent()({
  data: {
    rootUnused: 1,
  },
});

type Root = typeof root;
type CustomDoc = CreateComponentDoc<"custom", { properties: { str: string } }>;

const custom = CustomComponent<Root, CustomDoc>()({
  data: {
    custom_str: "str",
    _custom_Unused: 2,
  },
});

const chunk = ChunkComponent<Root, "chunk">()({
  data: {
    chunk_Unused: 3,
  },
});

DefineComponent({ name: "unusedData", rootComponent: root, subComponents: [custom, chunk] });
