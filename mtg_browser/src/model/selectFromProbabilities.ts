import { SelectionMethod } from "./types/SelectionMethod";

/**
 * Gets the index of the best item
 * @param scores
 * @param selectionMethod
 */
export function selectFromProbabilities(
  scores: Float32Array | Float64Array,
  selectionMethod: SelectionMethod
): number {
  switch (selectionMethod.type) {
    case "take_best": {
      const bestScore = Math.max(...Array.from(scores));
      for (let i = 0; i < scores.length; i++) {
        if (scores[i] >= bestScore) {
          return i;
        }
      }
      throw new Error(
        `No score in array ${scores} had bestScore ${bestScore}. floating point errors?`
      );
    }
    case "confidence_exponent": {
      const minScore = Math.min(...Array.from(scores));
      console.log(scores);
      const adjustedScores = scores.map((score: number): number =>
        Math.pow(score - minScore, selectionMethod.confidence_exponent)
      );

      // TODO resolve function call on a union type of FLoat32Array and FLoat64Array
      const totalAdjustedScores: number = (adjustedScores as any).reduce(
        (a: number, b: number): number => a + b,
        0
      );

      const selectionScore = Math.random() * totalAdjustedScores;

      let cumSumScore = 0;
      for (let i = 0; i < adjustedScores.length; i++) {
        cumSumScore += adjustedScores[i];
        if (cumSumScore >= selectionScore) {
          return i;
        }
      }

      return adjustedScores.length - 1;
    }
  }
}
