import { DefineComponent, RootComponent } from "annil";

const rootComponent = RootComponent()({
  properties: {
    num: Number,
  },
  customEvents: {
    onTap: String,
    eventA: {
      detail: String,
      options: {
        bubbles: true,
        composed: true,
      },
    },
  },
});

const subB = DefineComponent({
  name: "subB",
  rootComponent,
});

export type $SubB = typeof subB;
