import { DefineComponent, RootComponent } from "annil";

const rootComponent = RootComponent()({
  properties: {
    bool: Boolean,
  },
});

const subC = DefineComponent({
  name: "subC",
  rootComponent,
});

export type $SubC = typeof subC;
