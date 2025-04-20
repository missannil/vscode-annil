import { DefineComponent, RootComponent, typeEqual } from "annil";

// const chunk = ChunkComponent<Root>()({})
// const custom = CustomComponent<Root, CompType>()({})
// type Root = typeof rootComponent;
const rootComponent = RootComponent()({
  properties: {},
  customEvents: {},
});
const subF = DefineComponent({
  name: "subF",
  rootComponent,
  subComponents: [],
});
export type $SubF = {};
typeEqual<$SubF, typeof subF>();
