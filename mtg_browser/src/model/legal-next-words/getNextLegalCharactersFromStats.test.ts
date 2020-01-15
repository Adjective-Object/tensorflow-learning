import { getNextLegalCharactersFromStats } from "./getNextLegalCharactersFromStats";

describe("getNextLegalCharactersFromStats", () => {
  const testPairs = {
    "": "1234567890",
    "1": "1234567890/",
    "1/": "1234567890",
    "1/21": "1234567890 "
  };

  for (let [k, v] of Object.entries(testPairs)) {
    it(`allows '${v}' after '${k}'`, () => {
      expect(getNextLegalCharactersFromStats(k)).toEqual(Array.from(v));
    });
  }
});
