/* eslint-disable @typescript-eslint/no-unused-vars */

import { DefineComponent, RootComponent } from "annil";

const rootComponent = RootComponent()({
  customEvents: {
    onCustomTap: String,
    errCustomTap: String,
  },

  events: {
    onCustomCatchTap: String,
    errEvent: String,
  },
});

DefineComponent({
  name: "test",
  rootComponent,
});
