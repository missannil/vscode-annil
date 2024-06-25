export function isNonEmptyId(id: string | undefined): id is string {
  return id !== "" && id !== undefined;
}
