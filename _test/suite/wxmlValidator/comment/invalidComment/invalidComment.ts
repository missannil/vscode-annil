import { DefineComponent, RootComponent } from "annil";

const rootComponent = RootComponent()({
  properties: {},
  data: {},
});

DefineComponent({
  name: "textError",
  rootComponent,
  subComponents: [],
});
