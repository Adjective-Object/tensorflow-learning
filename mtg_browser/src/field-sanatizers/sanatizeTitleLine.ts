import { sanatizeNoMarkup } from "./sanatizeNoMarkup";

export function sanatizeTitleLine(titleLine: string) {
  return sanatizeNoMarkup(titleLine.toLowerCase());
}
