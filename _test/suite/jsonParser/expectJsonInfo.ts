import type { JsonFileInfo } from "../../../_src/core/types/index.js";

export const expectJsonInfo: JsonFileInfo = {
  text: `{
  "component": true,
  "usingComponents": {
    "subInline": "/components/subInline",
    "subExternal": "/components/subExternal/subExternal"
  },
  "componentPlaceholder": {
    "subInline": "view",
    "subExternal": "view"
  }
}`,
  config: {
    component: true,
    usingComponents: {
      subInline: "/components/subInline",
      subExternal: "/components/subExternal/subExternal",
    },
    componentPlaceholder: {
      subInline: "view",
      subExternal: "view",
    },
  },
};
