import { DefineComponent, RootComponent } from "annil";

const rootComponent = RootComponent()({
  customEvents: {
    onCustomTap: String,
  },
  data: {
    aaa: "aaa",
  },
  computed: {
    height() {
      return 100;
    },
  },
});

DefineComponent({
  name: "test",
  rootComponent,
});
