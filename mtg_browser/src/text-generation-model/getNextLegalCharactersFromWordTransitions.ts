import { getNextLegalCharactersFromWord } from "./legal-next-words/getNextLegalCharactersFromWord";

function getLookupWord(word: string): string {
  if (word.startsWith("{") && word.endsWith("}")) {
    return "COST";
  } else if (/^(\d|[xy\*])+\/(\d|[xy\*])+$/.test(word)) {
    return "STATS";
  } else if (/^(\+|\-)(\d|[xy\*])+\/(\+|\-)(\d|[xy\*])+$/.test(word)) {
    return "STAT_MODIFIER";
  } else if (/^\[((\-|\+)\d+|0)\]$/.test(word)) {
    return "LOYALTY_COST";
  } else if (/^\-?\d$/.test(word)) {
    return "NUMBER";
  }
  return word;
}

export function getNextLegalCharactersFromWordTransitions(
  inputString: string,
  wordMap: Record<string, string[]>,
  wordToTokenMap: Record<string, string>
): string[] | null {
  const spacedInputString = inputString.replace(
    / *([,\.:\"]|(\-(?!\d))) +/g,
    " $1 "
  );
  const expandedWords = spacedInputString.split(" ");
  if (expandedWords.length < 2) {
    return null;
  }
  const previousWord = expandedWords[expandedWords.length - 2];
  const currentWord = expandedWords[expandedWords.length - 1];

  console.log(`previousWord '${previousWord}', currentWord ${currentWord}`);

  const lookupFromPreviousWord = getLookupWord(previousWord);
  if (wordMap[lookupFromPreviousWord] === undefined) {
    // if previous word not in transition map, we can't limit the current word
    return null;
  }

  const legalNextWords = wordMap[lookupFromPreviousWord].filter(
    w => w.length >= currentWord.length
  );

  const legalNextCharacters = new Set<string>();

  if (currentWord.length == 0) {
    for (let i = 0; i < legalNextWords.length; i++) {
      const token = wordToTokenMap[legalNextWords[i]];
      if (token !== undefined) {
        legalNextWords.splice(i, 1);
        i--;
        legalNextCharacters.add(token);
      }
    }
  }

  for (let legalNextWord of legalNextWords) {
    const legalNextCharactersForThisWord: string[] = getNextLegalCharactersFromWord(
      currentWord,
      legalNextWord,
      wordMap
    );

    for (let legalNextChar of legalNextCharactersForThisWord) {
      legalNextCharacters.add(legalNextChar);
    }
  }

  return Array.from(legalNextCharacters);
}
