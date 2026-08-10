import { ChunkComponent, CustomComponent, DefineComponent, RootComponent } from "annil";
import { externalChunk } from "./defExternal.js";
import { externalComp } from "./useExternal.js";

const rootComponent = RootComponent()({
  data: { propRequiredBool: true },
});

export type Root = typeof rootComponent;

const subInline = CustomComponent<Root, { properties: { subInline_items: boolean } }>()({
  inherit: { subInline_items: "propRequiredBool" },
});

const itemChunk = ChunkComponent<Root>()({
  data: { label: "" },
});

DefineComponent({
  name: "componentDefinition",
  rootComponent,
  subComponents: [subInline, itemChunk, externalComp, externalChunk],
});
