import * as React from "react";
import { normalizeAndSplitManaSymbols } from "../field-sanatizers/sanatizeManaCost";
import "./ManaLikeCost.css";

const joinManaSymbolNumbers = (manaSymbols: string[]) => {
  let runningTotal = 0;
  const out = [];
  for (let i = 0; i < manaSymbols.length; i++) {
    if (manaSymbols[i] == "^") {
      runningTotal++;
      if (runningTotal >= 20) {
        out.push(runningTotal.toString());
        runningTotal = 0;
      }
    } else if (runningTotal != 0) {
      out.push(runningTotal.toString());
      out.push(manaSymbols[i]);
      runningTotal = 0;
    } else {
      out.push(manaSymbols[i]);
    }
  }
  if (runningTotal != 0) {
    out.push(runningTotal.toString());
  }

  return out;
};

export const ManaLikeCost = (props: { manaLikeCostString: string }) => {
  const manaSymbols = React.useMemo(
    () =>
      joinManaSymbolNumbers(
        normalizeAndSplitManaSymbols(props.manaLikeCostString)
      ),
    [props.manaLikeCostString]
  );

  const symbols = manaSymbols.map((symbolString: string, i: number) => (
    <span key={i} className={`mana-symbol _${symbolString.replace("/", "")}`} />
  ));

  return <>{symbols}</>;
};
