import { RootComponent } from "annil";

const rootComponent = RootComponent()({
  data: {
    items: [] as string[],
  },
});

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
rootComponent;
