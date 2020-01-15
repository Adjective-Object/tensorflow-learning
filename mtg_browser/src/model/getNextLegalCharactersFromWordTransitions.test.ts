import { getNextLegalCharactersFromWordTransitions } from "./getNextLegalCharactersFromWordTransitions";

describe("getNextLegalCharactersFromWordTransitions", () => {
  it("returns null on empty string", () => {
    const result = getNextLegalCharactersFromWordTransitions(
      "",
      {}, // transitions
      {} // tokenMap
    );
    expect(result).toBe(null);
  });

  it("returns null when there is no known mapping", () => {
    const result = getNextLegalCharactersFromWordTransitions(
      "hi ",
      {}, // transitions
      {} // tokenMap
    );
    expect(result).toBe(null);
  });

  it("returns the first character of each matching followup", () => {
    const result = getNextLegalCharactersFromWordTransitions(
      "hi ",
      { hi: ["mark", "jeff"] }, // transitions
      {} // tokenMap
    );
    expect(result).toEqual(["m", "j"]);
  });

  it("returns the nth character of each matching followup", () => {
    const result = getNextLegalCharactersFromWordTransitions(
      "hi ma",
      { hi: ["mark", "madeline", "jeff"] }, // transitions
      {} // tokenMap
    );
    expect(result).toEqual(["r", "d"]);
  });

  it("returns the tokenized forms of followups", () => {
    const result = getNextLegalCharactersFromWordTransitions(
      "hi ",
      { hi: ["mark", "jeff"] }, // transitions
      { mark: "~" } // tokenMap
    );
    expect(result).toEqual(["~", "j"]);
  });

  it("returns the tokenized forms of followups, and also words that start with the same amount", () => {
    const result = getNextLegalCharactersFromWordTransitions(
      "hi ",
      { hi: ["mark", "marcus", "jeff"] }, // transitions
      { mark: "~" } // tokenMap
    );
    expect(result).toEqual(["~", "m", "j"]);
  });

  it("does not return tokens for partially completed words", () => {
    const result = getNextLegalCharactersFromWordTransitions(
      "hi ma",
      { hi: ["mark", "jeff"] }, // transitions
      { mark: "~" } // tokenMap
    );
    expect(result).toEqual(["r"]);
  });

  describe("recognizing special cases as previousWords", () => {
    describe("COST", () => {
      it("recognizes COSTs", () => {
        const result = getNextLegalCharactersFromWordTransitions(
          "{T} ",
          { COST: [":"] }, // transitions
          {} // tokenMap
        );
        expect(result).toEqual([":"]);
      });

      it("recognizes complex COSTs", () => {
        const result = getNextLegalCharactersFromWordTransitions(
          "{TW^^WUBRCP} ",
          { COST: [":"] }, // transitions
          {} // tokenMap
        );
        expect(result).toEqual([":"]);
      });
    });

    describe("LOYALTY_COST", () => {
      it("recognizes + LOYALTY_COST", () => {
        const result = getNextLegalCharactersFromWordTransitions(
          "[+1] ",
          { LOYALTY_COST: ["a"] }, // transitions
          {} // tokenMap
        );
        expect(result).toEqual(["a"]);
      });

      it("recognizes - LOYALTY_COST", () => {
        const result = getNextLegalCharactersFromWordTransitions(
          "[-1] ",
          { LOYALTY_COST: ["a"] }, // transitions
          {} // tokenMap
        );
        expect(result).toEqual(["a"]);
      });

      it("recognizes 0 LOYALTY_COST", () => {
        const result = getNextLegalCharactersFromWordTransitions(
          "[0] ",
          { LOYALTY_COST: ["a"] }, // transitions
          {} // tokenMap
        );
        expect(result).toEqual(["a"]);
      });

      it("does not recognize nonzero non +/- as a LOYALTY_COST", () => {
        const result = getNextLegalCharactersFromWordTransitions(
          "[1] ",
          { LOYALTY_COST: ["a"] }, // transitions
          {} // tokenMap
        );
        expect(result).toEqual(null);
      });
    });

    describe("STATS", () => {
      it("recognizes STATS", () => {
        const result = getNextLegalCharactersFromWordTransitions(
          "1/2 ",
          { STATS: ["a"] }, // transitions
          {} // tokenMap
        );
        expect(result).toEqual(["a"]);
      });

      it("does not recognize state modifiers as STATS", () => {
        const result = getNextLegalCharactersFromWordTransitions(
          "+1/-2 ",
          { STATS: ["a"] }, // transitions
          {} // tokenMap
        );
        expect(result).toEqual(null);
      });
    });

    describe("STAT_MODIFIER", () => {
      it("recognizes STAT_MODIFIER", () => {
        const result = getNextLegalCharactersFromWordTransitions(
          "-1/+2 ",
          { STAT_MODIFIER: ["a"] }, // transitions
          {} // tokenMap
        );
        expect(result).toEqual(["a"]);
      });

      it("does not recognize STAT as STAT_MODIFIER", () => {
        const result = getNextLegalCharactersFromWordTransitions(
          "0/0 ",
          { STAT_MODIFIER: ["a"] }, // transitions
          {} // tokenMap
        );
        expect(result).toEqual(null);
      });
    });

    describe("NUMBER", () => {
      it("recognizes NUMBER", () => {
        const result = getNextLegalCharactersFromWordTransitions(
          "1 ",
          { NUMBER: ["a"] }, // transitions
          {} // tokenMap
        );
        expect(result).toEqual(["a"]);
      });

      it("recognizes negative NUMBER", () => {
        const result = getNextLegalCharactersFromWordTransitions(
          "-1 ",
          { NUMBER: ["a"] }, // transitions
          {} // tokenMap
        );
        expect(result).toEqual(["a"]);
      });

      it("does not recognize + NUMBER", () => {
        const result = getNextLegalCharactersFromWordTransitions(
          "+0 ",
          { NUMBER: ["a"] }, // transitions
          {} // tokenMap
        );
        expect(result).toEqual(null);
      });
    });
  });

  describe("suggesting special cases", () => {
    it.todo("suggests the first character of COST");
    it.todo("suggests the first character of LOYALTY_COST");
    it.todo("suggests the first character of STATS");
    it.todo("suggests the first character of STAT_MODIFIER");
    it.todo("suggests the first character of NUMBER");
  });

  describe("when there is no previous word", () => {
    it.todo("suggests like a COST when the word starts with {.");
    it.todo("suggests like a LOYALTY_COST when the word starts with [.");
    it.todo(
      "suggests like a STATS or NUMBER when the word starts with a numeric character"
    );
    it.todo("suggests like a STAT_MODIFIER when the word starts with +");
    it.todo("suggests like a STAT_MODIFIER when the word starts with -");
  });
});
