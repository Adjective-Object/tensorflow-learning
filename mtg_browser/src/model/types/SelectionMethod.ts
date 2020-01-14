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
        type: "take_with_probability";
      }
  );
