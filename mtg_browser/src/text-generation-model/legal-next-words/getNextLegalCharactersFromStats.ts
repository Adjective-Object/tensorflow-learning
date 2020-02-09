import { numericChars } from "./constants";

export function getNextLegalCharactersFromStats(currentWord: string): string[] {
  if (!currentWord.match(/^(\d+((\/(\d+)?)?)?)?$/)) {
    return [];
  }

  const wordAsStack = Array.from(currentWord);
  if (wordAsStack.length == 0) {
    return numericChars;
  }
  while (wordAsStack[0] !== "/") {
    if (wordAsStack.length == 0) {
      return numericChars.concat(["/"]);
    }
    wordAsStack.shift();
  }
  wordAsStack.shift();
  // cast because typescript tries to infer the type of the first char
  // as "/" from the above while condition, but fails to account for the shift below.
  if (wordAsStack.length == 0) {
    return numericChars;
  }
  while ((wordAsStack[0] as string) !== " ") {
    if (wordAsStack.length == 0) {
      return numericChars.concat([" "]);
    }
    wordAsStack.shift();
  }
  return [" "];
}
