import { VocabLimits } from "./VocabLimits";

/**
 * Common fields shared by all SelectionMethods
 */
interface SelectionMethodCommon {
  vocabLimits?: VocabLimits;
}

export type SelectionMethod = SelectionMethodCommon &
  (
    | {
        type: "take_best";
      }
    | {
        type: "confidence_exponent";
        confidence_exponent: number;
      }
  );
