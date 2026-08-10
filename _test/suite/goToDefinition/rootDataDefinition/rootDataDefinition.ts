import { DefineComponent, RootComponent } from "annil";

const rootComponent = RootComponent()({
  data: { propRequiredBool: true },
});

DefineComponent({
  name: "rootDataDefinition",
  rootComponent,
  subComponents: [],
});
