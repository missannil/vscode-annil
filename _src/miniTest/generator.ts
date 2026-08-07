import { fs, path, vscode } from "#deps";
import { scanWxml } from "./scanner.js";
import type { MiniTestOptions, ScopeType, TagInfo } from "./types.js";

function pascal(value: string): string {
  return value.split(/[-_]/).map(part => part.length > 0 ? `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}` : "").join(
    "",
  );
}

function safeId(value: string): string {
  return (value.split("_").at(-1) ?? "element").replace(/[^a-zA-Z0-9_]/g, "_");
}

function isLoop(scope: readonly ScopeType[]): boolean {
  return scope.includes("wxFor");
}

function isConditional(scope: readonly ScopeType[]): boolean {
  return scope.includes("wxIf") && !isLoop(scope);
}

function selector(tag: string, id: string): string {
  return `${tag}[id$='${id}']`;
}

function attributeMethod(attribute: string): string {
  return attribute.split("-").map(pascal).join("");
}

type CustomComponent = { moduleName: string; rootTag: string };

function resolveCustomComponent(wxmlPath: string, tagName: string): CustomComponent | undefined {
  const jsonPath = wxmlPath.replace(/\.wxml$/, ".json");
  if (!fs.existsSync(jsonPath)) return undefined;
  try {
    const config = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as { usingComponents?: Record<string, string> };
    const reference = config.usingComponents?.[tagName];
    if (reference === undefined || reference === "") return undefined;
    const absolute = path.resolve(path.dirname(wxmlPath), reference);
    const candidates = [
      absolute.endsWith(".wxml") ? absolute : `${absolute}.wxml`,
      path.join(absolute, "index.wxml"),
    ];
    const componentPath = candidates.find(candidate => fs.existsSync(candidate));
    if (componentPath === undefined) return undefined;
    const root = scanWxml(fs.readFileSync(componentPath, "utf8"), ["class", "style"])[0];

    return { moduleName: path.basename(path.dirname(componentPath)), rootTag: root?.element.tagName ?? "view" };
  } catch {
    return undefined;
  }
}

function appendAttribute(
  lines: string[],
  info: TagInfo,
  componentName: string,
  attribute: string,
): { field: string; expression: string; type: string } {
  const id = safeId(info.element.attribs.id);
  const suffix = info.isRoot ? "" : `Of${pascal(id)}`;
  const field = info.isRoot ? `${componentName}_${attribute}` : `${id}_${attribute}${isLoop(info.scope) ? "List" : ""}`;
  const getter = `get${attributeMethod(attribute)}${suffix}`;
  const type = isLoop(info.scope) ? "List[str]" : isConditional(info.scope) ? "str | None" : "str";
  if (info.isRoot) {
    lines.push(`    def ${getter}(self) -> str:`, `        return self.rootElement.attribute("${attribute}")[0]`);
  } else if (isLoop(info.scope)) {
    lines.push(
      `    def ${getter}(self) -> List[str]:`,
      `        return [element.attribute("${attribute}")[0] for element in self.getElementsOf${pascal(id)}()]`,
    );
  } else if (isConditional(info.scope)) {
    lines.push(
      `    def ${getter}(self) -> str | None:`,
      `        element = self.getElementOf${pascal(id)}()`,
      `        return element.attribute("${attribute}")[0] if element else None`,
    );
  } else {lines.push(
      `    def ${getter}(self) -> str:`,
      `        return self.getElementOf${pascal(id)}().attribute("${attribute}")[0]`,
    );}

  return { field, expression: `self.${getter}()`, type };
}

// 代码生成按标签类型组合多个 Python 片段，复杂度来自输出分支而非运行时逻辑。
// eslint-disable-next-line complexity
export async function generatePython(wxmlPath: string, wxmlText: string, options: MiniTestOptions): Promise<string> {
  const componentName = path.basename(path.dirname(wxmlPath));
  const className = `${pascal(componentName)}Component`;
  const infos = scanWxml(wxmlText, options.generatedAttributes);
  const fields: string[] = [];
  const partialFields: string[] = [];
  const methods: string[] = [
    `class ${className}(Common):`,
    "    def __init__(self, rootElement: BaseElement) -> None:",
    "        super().__init__()",
    "        self.rootElement = rootElement",
  ];
  const values: string[] = [];
  const records: string[] = [];
  const customValues: string[] = [];
  const customFields: string[] = [];
  const customImports = new Set<string>();

  for (const info of infos) {
    const tag = info.element.tagName;
    const id = safeId(info.element.attribs.id ?? tag);
    if (info.isCustom) {
      const component = resolveCustomComponent(wxmlPath, tag);
      const moduleName = component?.moduleName ?? tag;
      const importedName = `${pascal(moduleName)}Component`;
      const componentRoot = component?.rootTag ?? tag;
      customImports.add(`from miniTest.components.${moduleName} import ${importedName}, ${importedName}Info`);
      const customId = info.element.attribs.cid ?? moduleName;
      const method = `get${pascal(tag)}Component`;
      const type = isLoop(info.scope)
        ? `List[${importedName}Info]`
        : isConditional(info.scope)
        ? `${importedName}Info | None`
        : `${importedName}Info`;
      customFields.push(`        "${tag}": ${type},`);
      if (isLoop(info.scope)) {
        methods.push(
          `    def ${method}(self, cid: str) -> List[${importedName}]:`,
          `        return [${importedName}(element) for element in self.rootElement.get_elements(f"${
            selector(componentRoot, "{cid}")
          }")]`,
        );
        customValues.push(
          `            "${tag}": [element.getComponentInfo() for element in self.${method}("${customId}")],`,
        );
      } else if (isConditional(info.scope)) {
        methods.push(
          `    def ${method}(self, cid: str) -> ${importedName}Info | None:`,
          "        try:",
          `            return ${importedName}(self.rootElement.get_element(f"${
            selector(componentRoot, "{cid}")
          }")).getComponentInfo()`,
          "        except Exception:",
          "            return None",
        );
        customValues.push(`            "${tag}": self.${method}("${customId}"),`);
      } else {
        methods.push(
          `    def ${method}(self, cid: str) -> ${importedName}Info:`,
          `        return ${importedName}(self.rootElement.get_element(f"${
            selector(componentRoot, "{cid}")
          }")).getComponentInfo()`,
        );
        customValues.push(`            "${tag}": self.${method}("${customId}"),`);
      }
      continue;
    }
    if (!info.isRoot) {
      if (isLoop(info.scope)) {
        methods.push(
          `    def getElementsOf${pascal(id)}(self) -> List[BaseElement]:`,
          `        return self.rootElement.get_elements("${selector(tag, id)}")`,
        );
      } else if (isConditional(info.scope)) {
        methods.push(
          `    def getElementOf${pascal(id)}(self) -> BaseElement | None:`,
          "        try:",
          `            return self.rootElement.get_element("${selector(tag, id)}")`,
          "        except Exception:",
          "            return None",
        );
      } else {methods.push(
          `    def getElementOf${pascal(id)}(self) -> BaseElement:`,
          `        return self.rootElement.get_element("${selector(tag, id)}")`,
        );}
    }
    for (const attribute of Object.keys(info.element.attribs)) {
      if (!attribute.startsWith("bind:tap") && !attribute.startsWith("catch:tap")) continue;
      const tapName = info.isRoot ? `tap${pascal(componentName)}` : `tap${pascal(id)}`;
      if (info.isRoot) {
        methods.push(
          `    def ${tapName}(self, count: int = 1) -> None:`,
          "        self.tapElement(self.rootElement, count)",
        );
      } else if (isLoop(info.scope)) {
        methods.push(
          `    def ${tapName}(self, index: int, count: int = 1) -> None:`,
          `        elements = self.getElementsOf${pascal(id)}()`,
          "        if index >= len(elements):",
          "            raise Exception(\"Element not found\")",
          "        self.tapElement(elements[index], count)",
        );
      } else if (isConditional(info.scope)) {
        methods.push(
          `    def ${tapName}(self, count: int = 1) -> None:`,
          `        element = self.getElementOf${pascal(id)}()`,
          "        if element is None:",
          "            raise Exception(\"Element not found\")",
          "        self.tapElement(element, count)",
        );
      } else {methods.push(
          `    def ${tapName}(self, count: int = 1) -> None:`,
          `        self.tapElement(self.getElementOf${pascal(id)}(), count)`,
        );}
    }
    for (const attribute of Object.keys(info.element.attribs)) {
      if (
        !options.generatedAttributes.includes(attribute) && attribute !== "class" && attribute !== "style"
        && !attribute.startsWith("data-")
      ) continue;
      const generated = appendAttribute(methods, info, componentName, attribute);
      fields.push(`        "${generated.field}": ${generated.type},`);
      partialFields.push(`        "${generated.field}": ${generated.type},`);
      values.push(`            "${generated.field}": ${generated.expression},`);
      records.push(`            "${generated.field}": ["${generated.expression.slice(5, -2)}", ""],`);
    }
    if (info.hasInnerText) {
      const getter = info.isRoot ? "getInnerText" : `getInnerTextOf${pascal(id)}`;
      const type = isLoop(info.scope) ? "List[str]" : isConditional(info.scope) ? "str | None" : "str";
      if (info.isRoot) methods.push("    def getInnerText(self) -> str:", "        return self.rootElement.inner_text");
      else if (isLoop(info.scope)) {
        methods.push(
          `    def ${getter}(self) -> List[str]:`,
          `        return [element.inner_text for element in self.getElementsOf${pascal(id)}()]`,
        );
      } else if (isConditional(info.scope)) {
        methods.push(
          `    def ${getter}(self) -> str | None:`,
          `        element = self.getElementOf${pascal(id)}()`,
          "        return element.inner_text if element else None",
        );
      } else {methods.push(
          `    def ${getter}(self) -> str:`,
          `        return self.getElementOf${pascal(id)}().inner_text`,
        );}
      const field = `${info.isRoot ? componentName : id}_innerText${isLoop(info.scope) ? "List" : ""}`;
      fields.push(`        "${field}": ${type},`);
      partialFields.push(`        "${field}": ${type},`);
      values.push(`            "${field}": self.${getter}(),`);
      records.push(`            "${field}": ["${getter}", ""],`);
    }
  }

  return [
    "from typing import TypedDict, List",
    "from miniTest.common import Common, BaseElement, DiffConfig",
    ...customImports,
    "",
    `${className}Info = TypedDict("${className}Info", {`,
    ...fields,
    ...(customFields.length ? ["        \"customComponents\": dict,"] : []),
    "})",
    `Partial${className}Info = TypedDict("Partial${className}Info", {`,
    ...partialFields,
    ...(customFields.length ? ["        \"customComponents\": dict,"] : []),
    "}, total=False)",
    "",
    ...methods,
    "    def methodsRecord(self) -> dict:",
    "        return {",
    ...records,
    "        }",
    `    def getComponentInfo(self) -> ${className}Info:`,
    "        return {",
    ...values,
    ...(customValues.length ? ["            \"customComponents\": {", ...customValues, "            },"] : []),
    "        }",
    `    def assertComponentInfo(self, expectedInfo: Partial${className}Info, diffConfig: DiffConfig | None = None) -> None:`,
    "        actual_info = {key: getattr(self, method_name)() for key, (method_name, _) in self.methodsRecord().items() if key in expectedInfo}",
    ...(customFields.length
      ? [
        "        if \"customComponents\" in expectedInfo:",
        "            actual_info[\"customComponents\"] = self.getComponentInfo()[\"customComponents\"]",
      ]
      : []),
    "        self.dict_diff(actual_info, dict(expectedInfo), compareConfig=diffConfig)",
  ].join("\n");
}

export function getMiniTestOptions(): MiniTestOptions {
  const config = vscode.workspace.getConfiguration("annil");
  const configuredOutputPath = config.get<string>("testFilePath")?.trim();

  return {
    outputPath: configuredOutputPath === undefined || configuredOutputPath === ""
      ? "miniTest/components"
      : configuredOutputPath,
    generatedAttributes: config.get<string[]>("generateAttrs") ?? ["class", "style"],
  };
}
