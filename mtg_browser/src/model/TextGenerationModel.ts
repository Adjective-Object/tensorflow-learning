import * as tf from "@tensorflow/tfjs";

import { TrainedTextConfig } from "./types/TrainedTextConfig";
import { SelectionMethod } from "./types/SelectionMethod";

import { getModelInputSize } from "./getModelInputSize";
import { getReverseLookupMap } from "./getReverseLookupMap";
import { selectFromProbabilities } from "./selectFromProbabilities";
import { trimOrPadSeedSequence } from "./trimOrPadSeedSequence";

/**
 * Loads and runs the text generation model
 */
export class TextGenerationModel {
  private readonly modelInputSize: number;
  private readonly vocab: string[];
  private readonly characterReverseLookup: Record<number, string>;
  private readonly tokensToStrings: Record<string, string>;
  private readonly stringsToTokens: Record<string, string>;

  private constructor(
    private readonly model: tf.LayersModel,
    private readonly config: TrainedTextConfig
  ) {
    this.modelInputSize = getModelInputSize(model);
    this.characterReverseLookup = getReverseLookupMap(config.seen_characters);
    this.tokensToStrings = config.tokens_to_strings;
    this.stringsToTokens = getReverseLookupMap(config.tokens_to_strings);
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

    const output = modelOutputTensor.dataSync<"float32">();

    // delete illegal characters from output
    if (selectionMethod.vocabLimits) {
      if (!selectionMethod.vocabLimits.allowNewlines) {
        const newlineIdx = this.config.seen_characters["\n"];
        output[newlineIdx] = -Infinity;
      }
      if (!selectionMethod.vocabLimits.allowTokenizedWords) {
        for (let token in this.tokensToStrings) {
          const tokenIdx = this.config.seen_characters[token];
          output[tokenIdx] = -Infinity;
        }
      }
      if (!selectionMethod.vocabLimits.allowManaAndNumbersMarkup) {
        for (let token of "{&WUBRGCX*}") {
          const tokenIdx = this.config.seen_characters[token];
          output[tokenIdx] = -Infinity;
        }
      }
    }

    return selectFromProbabilities(output, selectionMethod);
  }

  private tokenizeInput(seedSequence: string): string {
    for (let tokenKey in this.stringsToTokens) {
      seedSequence = seedSequence.replace(
        tokenKey,
        this.stringsToTokens[tokenKey]
      );
    }
    return seedSequence;
  }

  public continueSequence(
    seedSequence: string,
    selectionMethod: SelectionMethod,
    shouldFinishSequence: (currentChar: string, index: number) => boolean
  ): string {
    const characters = Array.from(seedSequence);
    const sanatizedSeedSequence = trimOrPadSeedSequence(
      this.tokenizeInput(seedSequence),
      this.vocab,
      this.modelInputSize
    );
    let inputSequence = Array.from(sanatizedSeedSequence).map(c => {
      if (this.config.seen_characters[c] === undefined) {
        throw new Error(`${c} not in the seen_characters map  `);
      }
      return this.config.seen_characters[c] / this.vocab.length;
    });

    for (let i = 0; ; i++) {
      const nextOutput = this.getNextInSequence(inputSequence, selectionMethod);
      const nextOutputChar = this.characterReverseLookup[nextOutput];

      console.log("inputSequence:", inputSequence);

      characters.push(nextOutputChar);
      if (shouldFinishSequence(nextOutputChar, i)) {
        return characters
          .slice(seedSequence.length)
          .map(t => this.tokensToStrings[t] || t)
          .join("");
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
