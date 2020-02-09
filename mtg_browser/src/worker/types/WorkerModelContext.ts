import { TextGenerationModel } from "../../text-generation-model/TextGenerationModel";
import { Pix2PixModel } from "../../pix2pix-model/Pix2PixModel";

/**
 * Global state of the worker's text models.
 */
export interface WorkerModelContext {
  getTextGenerationModel: () => Promise<TextGenerationModel>;
  getImageGrayscaleModel: () => Promise<Pix2PixModel>;
}
