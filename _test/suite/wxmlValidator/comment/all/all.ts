import { DefineComponent, RootComponent } from "annil";

const rootComponent = RootComponent()({
  properties: {},
  data: {},
});

DefineComponent({
  name: "all",
  rootComponent,
  subComponents: [],
});
