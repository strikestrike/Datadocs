export type FormInputStatus = "active" | "error" | "normal";

export function checkUniqueName(name: string, existNames: string[]): boolean {
  return existNames.indexOf(name) === -1;
}
