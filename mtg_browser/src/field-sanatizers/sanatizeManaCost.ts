const manaPipCharacters = new Set("WUBRG");
const legalCharacters = new Set("WUBRGXP^");

const sortOrder = ["X", "^", "C", "W", "U", "B", "R", "G"];

export function normalizeAndSplitManaSymbols(
  rawManaCostString: string
): string[] {
  const onlyLegalCharacters = Array.from(rawManaCostString).filter(c =>
    legalCharacters.has(c)
  );

  const individualManaSymbols = [];
  for (let currentChar of onlyLegalCharacters) {
    if (currentChar === "P") {
      for (let i: number = individualManaSymbols.length - 1; i >= 0; i--) {
        const currentSymbol: string = individualManaSymbols[i];
        if (
          currentSymbol.length === 1 &&
          currentSymbol !== "^" &&
          currentSymbol !== "X"
        ) {
          individualManaSymbols[i] = `${currentSymbol}/P`;
          break;
        }
      }
    } else {
      individualManaSymbols.push(currentChar);
    }
  }

  return individualManaSymbols;
}

const comparator = (a: string, b: string) => {
  if (
    a.length !== b.length &&
    manaPipCharacters.has(a[0]) &&
    manaPipCharacters.has(b[0])
  ) {
    return b.length - a.length;
  }
  return sortOrder.indexOf(a[0]) - sortOrder.indexOf(b[0]);
};

export function sanatizeManaCost(rawManaCostString: string) {
  const individualManaSymbols = normalizeAndSplitManaSymbols(rawManaCostString);

  individualManaSymbols.sort(comparator);

  return individualManaSymbols.join("");
}
