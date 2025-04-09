export function isEventAttr(rawAttrName: string): boolean {
  return rawAttrName.startsWith("bind") || rawAttrName.startsWith("catch") || rawAttrName.startsWith("capture-bind")
    || rawAttrName.startsWith("capture-catch");
}
