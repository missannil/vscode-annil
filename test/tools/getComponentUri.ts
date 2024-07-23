import { getSiblingUri } from "../../out/componentManager/getSiblingUri";
import type { ComponentUri } from "../../src/componentManager/isComponentUri";

export function getRandomComponentUri(compUri: ComponentUri): ComponentUri {
  const tsUri = getSiblingUri(compUri, ".ts");
  const jsonUri = getSiblingUri(compUri, ".json");
  const wxmlUri = getSiblingUri(compUri, ".wxml");
  const componentUri: ComponentUri[] = [wxmlUri, tsUri, jsonUri];

  return componentUri[Math.floor(Math.random() * componentUri.length)];
}
