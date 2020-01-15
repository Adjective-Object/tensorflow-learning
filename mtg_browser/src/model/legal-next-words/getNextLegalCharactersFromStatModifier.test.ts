import { getNextLegalCharactersFromStatModifier } from "./getNextLegalCharactersFromStatModifier";

describe("getNextLegalCharactersFromStatModifier", () => {
  it("starts with +/-", () => {
    expect(getNextLegalCharactersFromStatModifier("")).toEqual(["+", "-"]);
  });

  it("allows digits after the initial +/-", () => {
    expect(getNextLegalCharactersFromStatModifier("+")).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0"
    ]);

    expect(getNextLegalCharactersFromStatModifier("-")).toEqual(
      // omit "0" because you can't have "-0"
      ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
    );
  });

  it("allows digits and slash after the + and a digit", () => {
    expect(getNextLegalCharactersFromStatModifier("+1")).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0",
      "/"
    ]);

    expect(getNextLegalCharactersFromStatModifier("-011214")).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0",
      "/"
    ]);
  });

  it("allows signs after the /", () => {
    expect(getNextLegalCharactersFromStatModifier("+1/")).toEqual(["+", "-"]);
  });

  it("allows numbers after second sign", () => {
    expect(getNextLegalCharactersFromStatModifier("+1/+")).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0"
    ]);
  });

  it("allows numbers and terminating chars after the final sign", () => {
    expect(getNextLegalCharactersFromStatModifier("+1/+2")).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0",
      " "
    ]);
  });

  it("returns nothing for a prefix string that isn't a legal stat modified", () => {
    expect(getNextLegalCharactersFromStatModifier("a")).toEqual([]);
    expect(getNextLegalCharactersFromStatModifier("+a")).toEqual([]);
    expect(getNextLegalCharactersFromStatModifier("-a")).toEqual([]);
    expect(getNextLegalCharactersFromStatModifier("+1a")).toEqual([]);
    expect(getNextLegalCharactersFromStatModifier("+1/a")).toEqual([]);
    expect(getNextLegalCharactersFromStatModifier("+1/-a")).toEqual([]);
    expect(getNextLegalCharactersFromStatModifier("+1/-0a")).toEqual([]);
  });
});
