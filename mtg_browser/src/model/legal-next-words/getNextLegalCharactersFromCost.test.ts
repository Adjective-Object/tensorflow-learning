import { getNextLegalCharactersFromCost } from "./getNextLegalCharactersFromCost";

describe("getNextLegalCharactersFromCost", () => {
  const testPairs = {
    "": "{",
    // no pherexian mana initially, no closing brace
    "{": "TQEWUBRGCX^",
    // no pherexian mana when no coloured mana symbols, but closing brace present
    "{^^^": "TQEWUBRGCX^}",
    // no pherexian mana when only tap and mana symbols, can't tap twice or tap & untap
    "{T^^": "EWUBRGCX^}",
    // no pherexian mana when only tap and mana symbols, can't untap and tap
    "{Q^^": "EWUBRGCX^}",
    // can repeat energy
    "{E": "TQEWUBRGCX^}",
    // can include multiple X
    "{X": "TQEWUBRGCX^}",
    // pherexian mana when coloured mana symbols present
    "{W": "TQEWUBRGCX^P}",
    "{^^^W": "TQEWUBRGCX^P}",
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
