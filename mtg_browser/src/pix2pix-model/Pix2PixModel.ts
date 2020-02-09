import * as tf from "@tensorflow/tfjs";
import { get2DModelInputSize } from "../text-generation-model/getModelInputSize";

/**
 * Loads and runs a pix2pix model
 */
export class Pix2PixModel {
  private readonly modelInputSize: { width: number; height: number };

  private constructor(
    private readonly model: tf.LayersModel,
    private readonly preprocessStep: (
      inputData: ImageData
    ) => Promise<ImageData>
  ) {
    this.modelInputSize = get2DModelInputSize(model);
  }

  public async predict(inputImage: ImageData): Promise<ImageData> {
    // TODO transform the image here and run through the network
    return inputImage;
  }

  public static async load(
    modelPath: string,
    preprocessStep: (
      inputData: ImageData
    ) => Promise<ImageData> = Promise.resolve
  ): Promise<Pix2PixModel> {
    const model = await tf.loadLayersModel(modelPath);
    return new Pix2PixModel(model, preprocessStep);
  }
}
