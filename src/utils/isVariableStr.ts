export function isVariableStr(str: string): boolean {
  return /^[a-zA-Z_@][a-zA-Z0-9_@]*$/.test(str);
}

// export function islegalVariable(str:string): boolean{
//   return true;
// }