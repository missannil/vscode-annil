import { getSiblingUri } from "../../out/componentManager/getSiblingUri";
import type { ComponentUri, WxmlUri } from "../../src/componentManager/isComponentUri";

export function getRandomComponentUri(wxmlUri: WxmlUri): ComponentUri {
  const tsUri = getSiblingUri(wxmlUri, ".ts");
  const jsonUri = getSiblingUri(wxmlUri, ".json");
  const componentUri: ComponentUri[] = [wxmlUri, tsUri, jsonUri];

  return componentUri[Math.floor(Math.random() * componentUri.length)];
}
