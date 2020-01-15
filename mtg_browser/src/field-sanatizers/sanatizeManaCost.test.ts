import { sanatizeManaCost } from "./sanatizeManaCost";

describe("sanatizeManaCost", () => {
  it("does nothing to {B}", () => {
    expect(sanatizeManaCost("{B}")).toBe("B");
  });
  it("does nothing to {^^B}", () => {
    expect(sanatizeManaCost("{^^B}")).toBe("^^B");
  });
  it("sorts basic mana symbols", () => {
    expect(sanatizeManaCost("{G^BCR^^UXW}")).toBe("X^^^CWUBRG");
  });
  it("sorts phyrexian mana symbols", () => {
    expect(sanatizeManaCost("{G/P^B/PR/P^^U/PXW/P}")).toBe(
      "X^^^W/PU/PB/PR/PG/P"
    );
  });
  it("sorts phyrexian mana symbols before non-phyrexian ones", () => {
    expect(sanatizeManaCost("{G/PB/PGBR}")).toBe("B/PG/PBRG");
  });
  it("sorts phyrexian mana symbols before non-phyrexian ones, but leaves ^ and X at front", () => {
    expect(sanatizeManaCost("{G/PB/PX^^XGB^R}")).toBe("XX^^^B/PG/PBRG");
  });
  it("joins phyrexian mana symbols that are separated from their legal target", () => {
    expect(sanatizeManaCost("{G^/P;")).toBe("^G/P");
  });
  it("joins phyrexian mana symbols that have no slash", () => {
    expect(sanatizeManaCost("{GP;")).toBe("G/P");
  });
  it("drops phyrexian mana symbols that have no target", () => {
    expect(sanatizeManaCost("^P")).toBe("^");
  });
  it("drops phyrexian mana symbols that precede no valid symbols", () => {
    expect(sanatizeManaCost("PG")).toBe("G");
  });
  it("prepends to the first valid target", () => {
    expect(sanatizeManaCost("RBGP")).toBe("G/PBR");
  });
});
