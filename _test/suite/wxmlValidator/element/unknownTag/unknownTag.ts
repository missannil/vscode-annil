import { type CreateComponentDoc, CustomComponent, DefineComponent, RootComponent } from "annil";

const rootComponent = RootComponent()({
  data: {
    cid: "unknown-tag-test",
  },
});

type Root = typeof rootComponent;
type $SubB = CreateComponentDoc<"subB", { properties: { cid: string } }>;

const subB = CustomComponent<Root, $SubB>()({
  inherit: {
    subB_cid: "cid",
  },
});

DefineComponent({
  name: "unknownTag",
  rootComponent,
  subComponents: [subB],
});
