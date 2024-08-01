import { DefineComponent, RootComponent } from "annil";

const rootComponent = RootComponent()({
  properties: {
    str: String,
  },
});

const iamge = DefineComponent({
  name: "image",
  rootComponent,
});

export type $Image = typeof iamge;
