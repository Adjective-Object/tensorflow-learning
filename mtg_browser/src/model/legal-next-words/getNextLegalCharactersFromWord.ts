import { getNextLegalCharactersFromCost } from "./getNextLegalCharactersFromCost";
import { getNextLegalCharactersFromStats } from "./getNextLegalCharactersFromStats";
import { getNextLegalCharactersFromStatModifier } from "./getNextLegalCharactersFromStatModifier";
import { getNextLegalCharactersFromNumber } from "./getNextLegalCharactersFromNumber";
import { getNextLegalCharactersFromLoyalty } from "./getNextLegalCharactersFromLoyalty";
import { getNextLegalCharactersFromNormalWord } from "./getNextLegalCharactersFromNormalWord";

function getNextLegalCharactersFromWordInner(
  currentWord: string,
  legalNextWord: string
): string[] {
  switch (legalNextWord) {
    case "COST": {
      return getNextLegalCharactersFromCost(currentWord);
    }
    case "STATS": {
      return getNextLegalCharactersFromStats(currentWord);
    }
    case "STAT_MODIFIER": {
      return getNextLegalCharactersFromStatModifier(currentWord);
    }
    case "NUMBER": {
      return getNextLegalCharactersFromNumber(currentWord);
    }
    case "LOYALTY_COST": {
      return getNextLegalCharactersFromLoyalty(currentWord);
    }
    default: {
      return getNextLegalCharactersFromNormalWord(currentWord, legalNextWord);
    }
  }
}

export function getNextLegalCharactersFromWord(
  currentWord: string,
  legalNextWord: string,
  wordMap: Record<string, string[]>
): string[] {
  const partialOutput = [
    ...getNextLegalCharactersFromWordInner(currentWord, legalNextWord)
  ];
  if (partialOutput.indexOf(" ") !== -1) {
    // add follow-up characters to the current word that are punctuation
    for (let word of ":,.") {
      if (
        wordMap[legalNextWord] &&
        wordMap[legalNextWord].indexOf(word) !== -1
      ) {
        partialOutput.push(word);
      }
    }
  }

  return partialOutput;
}
