export type SnippetFileType = "json" | "typescript" | "wxml" | "wxss";

export type SnippetConfig = {
  prefix: string;
  body: string[];
  description: string;
};

export type SnippetDefinition = Record<string, SnippetConfig>;

export type DefaultSnippets = Record<SnippetFileType, SnippetDefinition>;
