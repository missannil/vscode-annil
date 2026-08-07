import { DefineComponent, RootComponent } from "annil";

const rootComponent = RootComponent()({
  properties: {
    items: Array,
    showInline: Boolean,
  },
});

export default DefineComponent({
  name: "miniCard",
  rootComponent,
});
