import { DefineComponent, RootComponent } from "annil";

const rootComponent = RootComponent()({
  properties: {
    cid: {
      type: String,
      value: "commentTest",
    },
  },
  data: {},
});

DefineComponent({
  name: "commentTest",
  rootComponent,
  subComponents: [],
});
