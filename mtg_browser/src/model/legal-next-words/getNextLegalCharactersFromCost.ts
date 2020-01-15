const coloredManaSymbols = Array.from("WUBRG");
export function getNextLegalCharactersFromCost(currentWord: string): string[] {
  if (!currentWord.match(/^(\{([TWUBRGC\^P]+(\})?)?)?$/)) {
    return [];
  }

  const wordAsStack = Array.from(currentWord);
  if (wordAsStack.length == 0) {
    return ["{"];
  }

  wordAsStack.shift();
  const trackedChars = new Set<string>();
  while (wordAsStack[0] !== "}") {
    if (wordAsStack.length == 0) {
      let toReturn = "TWUBRGC^P}";

      if (trackedChars.size == 0) {
        toReturn = toReturn.replace("}", "");
      }

      if (!coloredManaSymbols.some(c => trackedChars.has(c))) {
        toReturn = toReturn.replace("P", "");
      }

      if (trackedChars.has("T")) {
        toReturn = toReturn.replace("T", "");
      }

      return Array.from(toReturn);
    }

    const char = wordAsStack.shift();
    if (char) {
      trackedChars.add(char);
    }
  }

  return [" "];
}
