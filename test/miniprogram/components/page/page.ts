import { DefineComponent, type ParamsEqual, RootComponent } from "annil";

type Root = typeof rootComponent;

const rootComponent = RootComponent()({
  properties: {
    twClass: {
      type: String,
      value: " ",
    },
    style: {
      type: String,
      value: "",
    },
  },
});

const page = DefineComponent({
  name: "page",
  rootComponent,
});
export type $Page = {
  properties: {
    page_twClass?: string;
    page_style?: string;
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type check = ParamsEqual<$Page, typeof page>;
