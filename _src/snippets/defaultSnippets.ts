import type { DefaultSnippets } from "./types.js";

export const snippetNames = {
  component: "ancomp",
  page: "anpage",
} as const;

export const defaultSnippets: DefaultSnippets = {
  "json": {
    [snippetNames.component]: {
      "prefix": snippetNames.component,
      "body": ["{", "  \"component\": true,", "  \"usingComponents\": {},", "  \"componentPlaceholder\": {}", "}", ""],
      "description": "Annil component default snippet",
    },
    [snippetNames.page]: {
      "prefix": snippetNames.page,
      "body": ["{", "  \"usingComponents\": {},", "  \"componentPlaceholder\": {}", "}", ""],
      "description": "Annil page default snippet",
    },
  },
  "typescript": {
    [snippetNames.component]: {
      "prefix": snippetNames.component,
      "body": [
        "import { DefineComponent, RootComponent, typeEqual } from \"annil\";",
        "",
        "// const chunk = ChunkComponent<Root>()({})",
        "// const custom = CustomComponent<Root, CompType>()({})",
        "// type Root = typeof rootComponent;",
        "const rootComponent = RootComponent()({",
        "  properties: {},",
        "  customEvents: {},",
        "})",
        "const $1 = DefineComponent({",
        "  name: \"$1\",",
        "  rootComponent,",
        "  subComponents: [],",
        "})",
        "",
        "export type \\$${1/(.*)/${1:/pascalcase}/} = {}",
        "typeEqual<\\$${1/(.*)/${1:/pascalcase}/}>()($1);",
        "$0",
      ],
      "description": "Annil component default snippet",
    },
    [snippetNames.page]: {
      "prefix": snippetNames.page,
      "body": [
        "import { DefineComponent, RootComponent, typeEqual } from \"annil\";",
        "",
        "// const chunk = ChunkComponent<Root>()({})",
        "// const custom = CustomComponent<Root, CompType>()({})",
        "// type Root = typeof rootComponent;",
        "const rootComponent = RootComponent()({",
        "  isPage: true,",
        "  properties: {},",
        "})",
        "const $1 = DefineComponent({",
        "  path: \"/$2\",",
        "  rootComponent,",
        "  subComponents: [],",
        "})",
        "",
        "export type \\$${1/(.*)/${1:/pascalcase}/} = {",
        "  path: \"/$2\",",
        "}",
        "typeEqual<\\$${1/(.*)/${1:/pascalcase}/}>()($1);",
        "$0",
      ],
      "description": "Annil page default snippet",
    },
  },
  "wxml": {
    [snippetNames.component]: {
      "prefix": snippetNames.component,
      "body": ["<block wx:if=\"{{attached}}\">", " ", "</block>"],
      "description": "Annil component default snippet",
    },
    [snippetNames.page]: {
      "prefix": snippetNames.page,
      "body": ["<block wx:if=\"{{attached}}\">", " ", "</block>"],
      "description": "Annil page default snippet",
    },
  },
  "wxss": {
    [snippetNames.component]: {
      "prefix": snippetNames.component,
      "body": [],
      "description": "Annil component default snippet",
    },
    [snippetNames.page]: {
      "prefix": snippetNames.page,
      "body": [],
      "description": "Annil page default snippet",
    },
  },
};
