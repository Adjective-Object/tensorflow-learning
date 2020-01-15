import { getNextLegalCharactersFromLoyalty } from "./getNextLegalCharactersFromLoyalty";

describe("getNextLegalCharactersFromLoyalty", () => {
  const testPairs = {
    "": "[",
    "[": "1234567890+-",
    "[1092": "1234567890]",
    "[3]": " "
  };

  for (let [k, v] of Object.entries(testPairs)) {
    it(`allows '${v}' after '${k}'`, () => {
      expect(getNextLegalCharactersFromLoyalty(k)).toEqual(Array.from(v));
    });
  }
});
