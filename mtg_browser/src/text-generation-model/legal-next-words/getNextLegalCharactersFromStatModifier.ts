import { numericChars, nonzeroNumericChars, plusMinusChars } from "./constants";

export function getNextLegalCharactersFromStatModifier(
  currentWord: string
): string[] {
  if (!currentWord.match(/^([+-](\d+(\/([+-](\d+)?)?)?)?)?$/)) {
    return [];
  }

  const wordAsStack = Array.from(currentWord);
  if (wordAsStack.length == 0) {
    return plusMinusChars;
  }
  let sign = wordAsStack.shift();
  if (wordAsStack.length == 0) {
    return sign == "+" ? numericChars : nonzeroNumericChars;
  }
  while (wordAsStack[0] !== "/") {
    if (wordAsStack.length == 0) {
      return numericChars.concat(["/"]);
    }
    wordAsStack.shift();
  }
  wordAsStack.shift();
  if (wordAsStack.length == 0) {
    return plusMinusChars;
  }

  sign = wordAsStack.shift();
  if (wordAsStack.length == 0) {
    return sign == "+" ? numericChars : nonzeroNumericChars;
  }

  // cast because typescript tries to infer the type of the first char
  // as "/" from the above while condition, but fails to account for the shift below.
  while ((wordAsStack[0] as string) !== " ") {
    if (wordAsStack.length == 0) {
      return numericChars.concat([" "]);
    }
    wordAsStack.shift();
  }
  return [" "];
}
