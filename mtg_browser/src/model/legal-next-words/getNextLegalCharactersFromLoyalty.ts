import { numericCharsWithPlusMinus, numericChars } from "./constants";

export function getNextLegalCharactersFromLoyalty(
  currentWord: string
): string[] {
  const wordAsStack = Array.from(currentWord);
  if (wordAsStack.length == 0) {
    return ["["];
  }
  wordAsStack.shift();
  if (wordAsStack.length == 0) {
    return numericCharsWithPlusMinus;
  }
  while (wordAsStack[0] !== "]") {
    if (wordAsStack.length == 0) {
      return numericChars.concat(["]"]);
    }
    wordAsStack.shift();
  }
  wordAsStack.shift();
  return [" "];
}
