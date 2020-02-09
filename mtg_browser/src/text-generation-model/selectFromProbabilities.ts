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
    case "take_with_probability": {
      // TODO resolve function call on a union type of FLoat32Array and FLoat64Array
      const totalScores: number = (scores as any).reduce(
        (a: number, b: number): number => a + b,
        0
      );

      const selectionScore = Math.random() * totalScores;

      let cumSumScore = 0;
      for (let i = 0; i < scores.length; i++) {
        cumSumScore += scores[i];
        if (cumSumScore >= selectionScore) {
          return i;
        }
      }

      return scores.length - 1;
    }
  }
}
