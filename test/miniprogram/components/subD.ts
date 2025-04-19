import { DefineComponent, RootComponent } from "annil";

const rootComponent = RootComponent()({
  properties: {
    str: String,
  },
});

const subD = DefineComponent({
  name: "subD",
  rootComponent,
});

export type $SubD = typeof subD;
