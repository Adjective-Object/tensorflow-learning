import * as tf from "@tensorflow/tfjs";

import { TrainedTextConfig } from "./types/TrainedTextConfig";
import { SelectionMethod } from "./types/SelectionMethod";

import { getModelInputSize } from "./getModelInputSize";
import { getReverseLookupMap } from "./getReverseLookupMap";
import { selectFromProbabilities } from "./selectFromProbabilities";
import { trimOrPadSeedSequence } from "./trimOrPadSeedSequence";
import { VocabLimits } from "./types/VocabLimits";
import { getNextLegalCharactersFromWord } from "./legal-next-words/getNextLegalCharactersFromWord";
import { getNextLegalCharactersFromWordTransitions } from "./getNextLegalCharactersFromWordTransitions";

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
    private readonly config: TrainedTextConfig,
    private readonly legalWordTransitions: Record<string, string[]>
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

    if (selectionMethod.vocabLimits) {
      this.limitLegalCharacterOutput(
        inputSequence,
        output,
        selectionMethod.vocabLimits
      );
    }

    return selectFromProbabilities(output, selectionMethod);
  }

  /***
   * Mutates the passed in output array, setting illegal options to 0.
   */
  private limitLegalCharacterOutput(
    inputSequence: number[],
    output: Float32Array,
    vocabLimits: VocabLimits
  ) {
    if (vocabLimits.limitTransitions) {
      this.limitCharacterByLegalWordTransitions(inputSequence, output);
    }

    // delete illegal characters from output
    if (!vocabLimits.allowNewlines) {
      const newlineIdx = this.config.seen_characters["\n"];
      output[newlineIdx] = 0;
    }
    if (!vocabLimits.allowTokenizedWords) {
      for (let token in this.tokensToStrings) {
        const tokenIdx = this.config.seen_characters[token];
        output[tokenIdx] = 0;
      }
    }
    if (!vocabLimits.allowManaAndNumbersMarkup) {
      for (let token of "{&WUBRGCX*}") {
        const tokenIdx = this.config.seen_characters[token];
        output[tokenIdx] = 0;
      }
    }
    if (!vocabLimits.allowAlphabetic) {
      for (let token of "abcdefghijklmnopqrstuvwxyz") {
        const tokenIdx = this.config.seen_characters[token];
        output[tokenIdx] = 0;
      }
    }
    if (!vocabLimits.allowNumeric) {
      for (let token of "1234567890") {
        const tokenIdx = this.config.seen_characters[token];
        output[tokenIdx] = 0;
      }
    }
    if (!vocabLimits.allowNormalPuncutaion) {
      for (let token of ".+-,") {
        const tokenIdx = this.config.seen_characters[token];
        output[tokenIdx] = 0;
      }
    }
  }

  /**
   * Limits the next legal characters based on word transitions
   *
   * @param inputSequence
   * @param output
   */
  private limitCharacterByLegalWordTransitions(
    inputSequence: number[],
    output: Float32Array
  ) {
    const inputString = inputSequence
      .map(i => this.characterReverseLookup[Math.round(i * this.vocab.length)])
      .map(t => this.tokensToStrings[t] || t)
      .join("");

    const splitFields = inputString.split(/[;<]/g);
    // Isolate this field and get rid of the number at the head of it.
    const inputFieldString = splitFields[splitFields.length - 1].substring(1);

    const nextLegalChars = getNextLegalCharactersFromWordTransitions(
      inputFieldString,
      this.legalWordTransitions,
      this.stringsToTokens
    );

    console.log(inputFieldString, "->", nextLegalChars);

    if (nextLegalChars) {
      for (let i = 0; i < output.length; i++) {
        const char = this.characterReverseLookup[i];
        if (nextLegalChars.indexOf(char) == -1) {
          output[i] = 0;
        }
      }
    }
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
    configPath: string,
    transitionsPath: string
  ): Promise<TextGenerationModel> {
    const [model, trainedTextConfig, legalTransitions] = await Promise.all([
      tf.loadLayersModel(modelPath),
      fetch(configPath).then(r => r.json()),
      fetch(transitionsPath).then(r => r.json())
    ]);

    return new TextGenerationModel(model, trainedTextConfig, legalTransitions);
  }
}
