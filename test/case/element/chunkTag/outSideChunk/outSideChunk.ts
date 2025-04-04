import { DefineComponent } from "annil";
import { chunk } from "./chunk";

DefineComponent({
  name: "test",
  // @ts-ignore
  subComponents: [chunk],
});
