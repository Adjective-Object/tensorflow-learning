import { sanatizeTypeLine } from "./sanatizeTypeLine";

describe("sanatizeTypeLine", () => {
  it("does nothing to 'artifact creature - golem'", () => {
    expect(sanatizeTypeLine("artifact creature - golem")).toBe(
      "artifact creature - golem"
    );
  });
  it("adds spaces around hyphens", () => {
    expect(sanatizeTypeLine("creature-golem")).toBe("creature - golem");
    expect(sanatizeTypeLine("creature- golem")).toBe("creature - golem");
    expect(sanatizeTypeLine("creature -golem")).toBe("creature - golem");
  });
  it("removes extra spaces", () => {
    expect(sanatizeTypeLine("creature ")).toBe("creature");
    expect(sanatizeTypeLine(" creature")).toBe("creature");
    expect(sanatizeTypeLine("creature      -  golem")).toBe("creature - golem");
  });
  it("sorts supertypes", () => {
    expect(sanatizeTypeLine("creature artifact")).toBe("artifact creature");
    expect(sanatizeTypeLine("creature enchantment")).toBe(
      "enchantment creature"
    );
    expect(
      sanatizeTypeLine("artifact enchantment creature legendary tribal")
    ).toBe("legendary tribal artifact enchantment creature");
  });
  it("does not include the - if there is no subtype", () => {
    expect(sanatizeTypeLine("artifact creature - ")).toBe("artifact creature");
  });
  it("does not include the - if there is no supertype", () => {
    expect(sanatizeTypeLine("aura goat - ")).toBe("aura goat");
  });
  it("preserves ordering of subtype fields", () => {
    expect(sanatizeTypeLine("aura creature goat - ")).toBe(
      "creature - aura goat"
    );
    expect(sanatizeTypeLine("goat creature aura - ")).toBe(
      "creature - goat aura"
    );
  });
});
