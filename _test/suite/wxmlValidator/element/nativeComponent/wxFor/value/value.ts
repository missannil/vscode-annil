import { RootComponent } from "annil";

const rootComponent = RootComponent()({
  data: {
    items: [],
    itemList: [],
    notArray: "value",
  },
});

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
rootComponent;
