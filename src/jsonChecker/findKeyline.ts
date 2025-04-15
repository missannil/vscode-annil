export function findKeyline(textlines: string[], key: string): number {
  return textlines.findIndex((item) => item.includes(key));
}
