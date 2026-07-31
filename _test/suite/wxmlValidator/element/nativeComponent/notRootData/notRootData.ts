import { RootComponent } from "annil";

const rootComponent = RootComponent()({
  data: {
    knownData: "defined",
  },
});

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
rootComponent;
