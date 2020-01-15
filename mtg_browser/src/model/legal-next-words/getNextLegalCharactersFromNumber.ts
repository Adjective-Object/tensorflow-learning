import { numericChars } from "./constants";

const nonzeroNumericChars = Array.from("123456789");
const numericCharsWithMinus = numericChars.concat("-");
const numericWithSpace = numericChars.concat(" ");
export function getNextLegalCharactersFromNumber(
  currentWord: string
): string[] {
  if (!currentWord.match(/^-?\d*$/)) {
    return [];
  }

  if (currentWord.length == 0) {
    return numericCharsWithMinus;
  } else if (currentWord[0] == "0") {
    return [" "];
  } else if (currentWord[0] == "-" && currentWord.length == 1) {
    return nonzeroNumericChars;
  }

  return numericWithSpace;
}
