import { getNextLegalCharactersFromCost } from "./getNextLegalCharactersFromCost";

describe("getNextLegalCharactersFromCost", () => {
  const testPairs = {
    "": "{",
    // no pherexian mana initially, no closing brace
    "{": "TWUBRGC^",
    // no pherexian mana when no coloured mana symbols, but closing brace present
    "{^^^": "TWUBRGC^}",
    // no pherexian mana when only tap and mana symbols
    "{T^^": "WUBRGC^}",
    // pherexian mana when coloured mana symbols present
    "{W": "TWUBRGC^P}",
    "{^^^W": "TWUBRGC^P}",
    // when cost is closed, space
    "{W}": " ",
    // when the preceding chars are not a legal cost string, suggest nothing
    a: "",
    "{a": "",
    "{WUBGR^Ta": ""
  };

  for (let [k, v] of Object.entries(testPairs)) {
    it(`allows '${v}' after '${k}'`, () => {
      expect(getNextLegalCharactersFromCost(k)).toEqual(Array.from(v));
    });
  }
});
