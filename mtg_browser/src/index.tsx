// import React from 'react';
// import ReactDOM from 'react-dom';
import "./index.css";
// import App from './App';
// import * as serviceWorker from './serviceWorker';

// ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();

import * as tf from "@tensorflow/tfjs";

interface TrainedTextConfig {
  seen_characters: Record<string, number>;
}

type SelectionMethod =
  | {
      type: "take_best";
    }
  | {
      type: "confidence_exponent";
      confidence_exponent: number;
    };

/**
 * Gets the model input size off the loaded model
 */
function getModelInputSize(model: tf.LayersModel): number {
  const modelInputShapes = model.feedInputShapes;

  // console.log("model input", modelInputShapes, "output", model.outputShape);

  if (modelInputShapes.length !== 1) {
    throw new Error("Expected exactly 1 model input shape");
  }
  const inputShape = modelInputShapes[0];
  if (
    inputShape.length !== 2 ||
    inputShape[0] !== null ||
    inputShape[1] === null
  ) {
    throw new Error(
      "expected model input to have dimensionality [null, <input_size>]"
    );
  }

  // Cast because we've aleady checked that it is not null above
  return inputShape[1] as number;
}

/**
 * Gets the index of the best item
 * @param scores
 * @param selectionMethod
 */
function selectFromProbabilities(
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

function getReverseLookupMap(
  forwardMap: Record<string, number>
): Record<number, string> {
  const reverseMap: Record<number, string> = {};
  for (let forwardKey of Object.keys(forwardMap)) {
    const reverseKey: number = forwardMap[forwardKey];
    if (reverseMap.hasOwnProperty(reverseKey)) {
      throw new Error(
        `duplicate value ${reverseKey} for keys ${forwardKey} and ${reverseMap[reverseKey]} while building reverse map`
      );
    }
    reverseMap[reverseKey] = forwardKey;
  }
  return reverseMap;
}

const fixedSeedTail = ". ;;>";
function trimOrPadSeedSequence(
  seedSequence: string,
  vocab: string[],
  limit: number
): string {
  if (seedSequence.length < limit) {
    const requiredSeedLength =
      limit - seedSequence.length - fixedSeedTail.length;

    const seed = [];
    for (let i = 0; i < requiredSeedLength; i++) {
      const randomCharIdx = Math.floor(Math.random() * vocab.length);
      seed.push(vocab[randomCharIdx]);
    }

    seedSequence = [...seed, fixedSeedTail, seedSequence].join("");
  }

  if (seedSequence.length > limit) {
    return seedSequence.substr(seedSequence.length - limit);
  }
  return seedSequence;
}

/**
 * Loads and runs the text generation model
 */
class TextGenerationModel {
  private readonly modelInputSize: number;
  private readonly vocab: string[];
  private readonly characterReverseLookup: Record<number, string>;

  private constructor(
    private readonly model: tf.LayersModel,
    private readonly config: TrainedTextConfig
  ) {
    this.modelInputSize = getModelInputSize(model);
    this.characterReverseLookup = getReverseLookupMap(config.seen_characters);
    this.vocab = Object.keys(this.characterReverseLookup);
  }

  /**
   * Gets the next character int he sequence given a model
   * @param model
   */
  private getNextInSequence(
    inputSequence: number[],
    selectionMethod: SelectionMethod
  ): number {
    if (inputSequence.length !== this.modelInputSize) {
      throw new Error(
        `input sequence "${inputSequence}" is not of length ${this.modelInputSize} (len=${inputSequence.length})`
      );
    }

    const inputTensor = tf
      .tensor1d(inputSequence)
      .reshape([1, this.modelInputSize]);

    const modelOutputTensor = this.model.predict(inputTensor);

    if (modelOutputTensor instanceof Array) {
      throw new Error("Expected a sinlge output tensor, got array");
    }

    return selectFromProbabilities(
      modelOutputTensor.dataSync<"float32">(),
      selectionMethod
    );
  }

  public continueSequence(
    seedSequence: string,
    selectionMethod: SelectionMethod,
    shouldFinishSequence: (currentChar: string, index: number) => boolean
  ) {
    const characters = Array.from(seedSequence);
    const sanatizedSeedSequence = trimOrPadSeedSequence(
      seedSequence,
      this.vocab,
      this.modelInputSize
    );
    let inputSequence = Array.from(sanatizedSeedSequence).map(
      c => this.config.seen_characters[c] / this.vocab.length
    );

    for (let i = 0; ; i++) {
      const nextOutput = this.getNextInSequence(inputSequence, selectionMethod);
      const nextOutputChar = this.characterReverseLookup[nextOutput];

      console.log("inputSequence:", inputSequence);

      characters.push(nextOutputChar);
      if (shouldFinishSequence(nextOutputChar, i)) {
        return characters.join("");
      }

      inputSequence = [
        ...inputSequence.slice(1),
        nextOutput / this.vocab.length
      ];
    }
  }

  public static async load(
    modelPath: string,
    configPath: string
  ): Promise<TextGenerationModel> {
    const [model, trainedTextConfig] = await Promise.all([
      tf.loadLayersModel(modelPath),
      fetch(configPath).then(r => r.json())
    ]);

    return new TextGenerationModel(model, trainedTextConfig);
  }
}

async function main() {
  const model = await TextGenerationModel.load(
    "/models/trained_text/model.json",
    "/trained_text_config.json"
  );

  const inString = "<Jace";

  const completedSequence = model.continueSequence(
    inString,
    { type: "take_best" },
    (c, i) => c === ">" || i > 120
  );

  console.log(completedSequence);
}

main();
