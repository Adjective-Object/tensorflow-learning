export function getNextLegalCharactersFromNormalWord(
  currentWord: string,
  legalNextWord: string
): string[] {
  if (legalNextWord.length < currentWord.length) {
    return [];
  }

  for (let i = 0; i < currentWord.length; i++) {
    if (legalNextWord[i] !== currentWord[i]) {
      return [];
    }
  }

  return legalNextWord.length == currentWord.length
    ? [" "]
    : [legalNextWord[currentWord.length]];
}
