import { DefineComponent, RootComponent, typeEqual } from "annil";

// const chunk = ChunkComponent<Root>()({})
// const custom = CustomComponent<Root, CompType>()({})
// type Root = typeof rootComponent;
const rootComponent = RootComponent()({
  customEvents: {},
});
const subD = DefineComponent({
  name: "subD",
  rootComponent,
  subComponents: [],
});
export type $SubD = {};
typeEqual<$SubD, typeof subD>();
