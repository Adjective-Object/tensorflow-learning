import { getNextLegalCharactersFromNormalWord } from "./getNextLegalCharactersFromNormalWord";

describe("getNextLegalCharactersFromNormalWord", () => {
  it("returns the next char of the original word", () => {
    expect(getNextLegalCharactersFromNormalWord("hel", "hello")).toEqual(["l"]);
  });

  it("returns empty arr for mismatched substring", () => {
    expect(getNextLegalCharactersFromNormalWord("help", "hello")).toEqual([]);
  });

  it("returns space at end of matching word", () => {
    expect(getNextLegalCharactersFromNormalWord("hello", "hello")).toEqual([
      " "
    ]);
  });

  it("returns empty arr when the current word is longer than the compared word", () => {
    expect(getNextLegalCharactersFromNormalWord("hellozz", "hello")).toEqual(
      []
    );
  });
});
