import { getNextLegalCharactersFromNumber } from "./getNextLegalCharactersFromNumber";

describe("getNextLegalCharactersFromNumber", () => {
  const testPairs = {
    "": "1234567890-",
    "-": "123456789",
    "-1": "1234567890 ",
    "1": "1234567890 ",
    "0": " ",
    // if the current word doesn't match, don't suggest
    a: "",
    "3b": "",
    "-3c": ""
  };

  for (let [k, v] of Object.entries(testPairs)) {
    it(`allows '${v}' after '${k}'`, () => {
      expect(getNextLegalCharactersFromNumber(k)).toEqual(Array.from(v));
    });
  }
});
