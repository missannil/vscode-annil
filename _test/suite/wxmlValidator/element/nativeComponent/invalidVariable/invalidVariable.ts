import { RootComponent } from "annil";

const rootComponent = RootComponent()({
  data: {
    a: "valid_data",
  },
});

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
rootComponent;
