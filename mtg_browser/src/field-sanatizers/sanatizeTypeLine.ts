const legalCharacters = new Set("abcdefghijklmnopqrstuvwxyz -");

const supertypeOrdering = [
  "legendary",
  "tribal",
  "artifact",
  "enchantment",
  "sorcery",
  "instant",
  "creature",
  "-"
];

const typeComparator = (a: string, b: string) => {
  const aIdx = supertypeOrdering.indexOf(a);
  const bIdx = supertypeOrdering.indexOf(b);
  if (aIdx === -1 && bIdx === -1) {
    return 0;
  } else if (aIdx === -1) {
    return 1;
  } else if (bIdx === -1) {
    return -1;
  } else {
    return aIdx - bIdx;
  }
};

export function sanatizeTypeLine(rawTypeString: string): string {
  const onlyLegalCharacters = Array.from(rawTypeString.toLowerCase())
    .filter(c => legalCharacters.has(c))
    .join("");

  const cleaned = (onlyLegalCharacters + " -")
    .trim()
    // hyphens must have spaces around them
    .replace(/ *- */g, " - ")
    // no double spaces
    .replace(/ +/g, " ");

  const types = cleaned.split(" ").filter(x => x.length > 0);

  types.sort(typeComparator);

  if (types[types.length - 1] === "-") {
    types.pop();
  }
  if (types[0] === "-") {
    types.shift();
  }

  return types.join(" ").replace(/-( -)+/, "-");
}
