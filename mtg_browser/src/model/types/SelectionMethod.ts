export type SelectionMethod =
  | {
      type: "take_best";
    }
  | {
      type: "confidence_exponent";
      confidence_exponent: number;
    };
