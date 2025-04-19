import { DefineComponent, RootComponent } from "annil";

const rootComponent = RootComponent()({
  properties: {
    src: String,
    twClass: {
      type: String,
      value: "",
    },
  },
});

const iamge = DefineComponent({
  name: "image",
  rootComponent,
});

export type $Image = typeof iamge;
