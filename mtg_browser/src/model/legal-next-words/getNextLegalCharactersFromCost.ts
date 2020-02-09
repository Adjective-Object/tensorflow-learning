const coloredManaSymbols = Array.from("WUBRG");
export function getNextLegalCharactersFromCost(currentWord: string): string[] {
  if (!currentWord.match(/^(\{([TQEWUBRGCX\^P]+(\})?)?)?$/)) {
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
      let toReturn = "TQEWUBRGCX^P}";

      if (trackedChars.size == 0) {
        toReturn = toReturn.replace("}", "");
      }

      if (!coloredManaSymbols.some(c => trackedChars.has(c))) {
        toReturn = toReturn.replace("P", "");
      }

      if (trackedChars.has("T") || trackedChars.has("Q")) {
        toReturn = toReturn.replace("T", "");
        toReturn = toReturn.replace("Q", "");
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
