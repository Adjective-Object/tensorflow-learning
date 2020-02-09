import * as React from "react";

const noCapsWords = ["of", "the"];

export const useTitleCaseString = (
  stringToCapitalize: string,
  captializeFirst: boolean
) => {
  return React.useMemo(() => {
    return stringToCapitalize
      .split(" ")
      .map((x, i) =>
        (captializeFirst || i > 0) &&
        x.length > 0 &&
        noCapsWords.indexOf(x) == -1
          ? x[0].toUpperCase() + x.substring(1)
          : x
      )
      .join(" ");
  }, [stringToCapitalize]);
};
