import { DefineComponent, RootComponent } from "annil";

const rootComponent = RootComponent()({
  properties: {
    cid: {
      type: String,
      value: "subInline",
    },
  },
});

export default DefineComponent({
  name: "subInline",
  rootComponent,
});
