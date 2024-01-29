import { AttributesList } from "./getAttributesList";

export function isEqual(obj1: AttributesList | null, obj2: AttributesList) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}
