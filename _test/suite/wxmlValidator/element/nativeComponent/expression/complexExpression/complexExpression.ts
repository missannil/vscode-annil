import { RootComponent } from "annil";

const rootComponent = RootComponent()({
  data: {
    profile: { enabled: true },
    items: [1, 2, 3],
    isReady: true,
    enabled: true,
    count: 1,
  },
});

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
rootComponent;
