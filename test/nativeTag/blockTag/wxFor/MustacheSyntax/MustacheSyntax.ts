import { RootComponent } from "annil";

const rootComponent = RootComponent()({
  data: {
    users: [1, 2, 3],
    categoryList: [1, 2, 3] as any[], 
  },
});
